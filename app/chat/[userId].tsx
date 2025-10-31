import React, { useState, useEffect, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  AppState,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "@/lib/api";
import { ensureAuth } from "@/lib/auth";
import { scheduleMessageNotification, showInAppNotification, showExpoGoNotification } from "../../lib/notifications-expo-go";

type Message = {
  id: string;
  text: string;
  timestamp: Date;
  isFromMe: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'failed';
};

export default function ChatScreen() {
  const { userId, name, preFillMessage, phone, isPhoneOnly } = useLocalSearchParams<{ 
    userId: string; 
    name: string; 
    preFillMessage?: string;
    phone?: string;
    isPhoneOnly?: string;
  }>();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [isAppInBackground, setIsAppInBackground] = useState(false);
  const [apiFailureCache, setApiFailureCache] = useState<{[key: string]: number}>({});
  const [hasLoadedPreFill, setHasLoadedPreFill] = useState(false);

  // Load pre-filled message if provided (only once on mount)
  useEffect(() => {
    if (hasLoadedPreFill) return; // Prevent re-loading
    
    const loadPreFillMessage = async () => {
      try {
        // Check for pre-filled message from AsyncStorage (from carousel)
        const preFillMsg = await AsyncStorage.getItem('preFillMessage');
        if (preFillMsg) {
          setMessage(preFillMsg);
          await AsyncStorage.removeItem('preFillMessage'); // Clear it after use
          setHasLoadedPreFill(true);
        } else if (preFillMessage) {
          // Or from route params
          setMessage(preFillMessage);
          setHasLoadedPreFill(true);
        }
      } catch (error) {
        console.error('Error loading pre-fill message:', error);
      }
    };
    
    loadPreFillMessage();
  }, []); // Empty dependency - only run once on mount

  // Load messages and contact info when component mounts
  useEffect(() => {
    loadMessages();
    loadContactInfo();
    
    // Set up faster message checking every 500ms for this chat (instant feel)
    const messageCheckInterval = setInterval(() => {
      loadMessages(); // Simply reload messages from AsyncStorage (updated by global polling)
    }, 500);
    
    // Listen for app state changes
    const handleAppStateChange = (nextAppState: string) => {
      setIsAppInBackground(nextAppState === 'background' || nextAppState === 'inactive');
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      clearInterval(messageCheckInterval);
      subscription?.remove();
    };
  }, [userId]);

  // Track when this chat screen is focused/unfocused for notification management
  useFocusEffect(
    useCallback(() => {
      console.log(`🎯 Chat focused for userId: ${userId}`);
      // Store the active chat ID globally
      AsyncStorage.setItem('currentActiveChat', userId);
      
      // Mark any undelivered messages as delivered when user opens the chat
      markMessagesAsDelivered();
      
      return () => {
        console.log(`🎯 Chat unfocused for userId: ${userId}`);
        // Clear the active chat ID when leaving
        AsyncStorage.removeItem('currentActiveChat');
      };
    }, [userId])
  );

  const markMessagesAsDelivered = async () => {
    try {
      const storedMessages = await AsyncStorage.getItem(`messages_${userId}`);
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages);
        const undeliveredMessages = parsedMessages.filter((msg: any) => 
          !msg.isFromMe && (msg.status === 'received' || msg.status === 'pending') && msg.backendMessageId
        );
        
        if (undeliveredMessages.length > 0) {
          console.log(`📩 Marking ${undeliveredMessages.length} messages as delivered for ${userId}`);
          
          // Extract backend message IDs
          const backendMessageIds = undeliveredMessages.map((msg: any) => msg.backendMessageId);
          
          // Mark as delivered on backend
          try {
            await api.post('/messages/mark-delivered', {
              messageIds: backendMessageIds
            });
            console.log(`✅ Successfully marked ${backendMessageIds.length} messages as delivered on backend`);
            
            // Update local message status
            const updatedMessages = parsedMessages.map((msg: any) => {
              if (!msg.isFromMe && backendMessageIds.includes(msg.backendMessageId)) {
                return { ...msg, status: 'delivered' };
              }
              return msg;
            });
            
            // Save updated messages
            await AsyncStorage.setItem(`messages_${userId}`, JSON.stringify(updatedMessages));
            setMessages(updatedMessages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            })));
            
          } catch (error) {
            console.error('❌ Failed to mark messages as delivered on backend:', error);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error in markMessagesAsDelivered:', error);
    }
  };

  const loadContactInfo = async () => {
    try {
      console.log('👤 Loading contact info for userId:', userId);
      
      // First, check if userId is a valid MongoDB ObjectId
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
      let actualUserId = userId;
      
      if (!isValidObjectId) {
        console.log('⚠️ userId is not a valid ObjectId, treating as phone number:', userId);
        
        // Try to find user by phone number
        try {
          const phoneNumber = userId.replace(/\D/g, ''); // Remove non-digits
          const userResponse = await api.get(`/users/search-by-phone/${phoneNumber}`);
          if (userResponse?.user) {
            console.log('✅ Found user by phone:', userResponse.user.name, userResponse.user._id);
            actualUserId = userResponse.user._id;
            
            // Set contact info immediately
            const contactData = {
              id: userResponse.user._id,
              name: userResponse.user.name,
              phoneNumber: userResponse.user.phone || phone,
              profilePicture: userResponse.user.profilePicture,
              about: userResponse.user.about,
              lastUpdated: new Date().toISOString()
            };
            setContactInfo(contactData);
            await AsyncStorage.setItem(`contact_${actualUserId}`, JSON.stringify(contactData));
            return;
          }
        } catch (phoneError) {
          console.log('❌ Could not find user by phone number');
        }
      }
      
      // Check if we've recently failed to fetch this user's info (cache for 5 minutes)
      const now = Date.now();
      if (apiFailureCache[actualUserId] && (now - apiFailureCache[actualUserId] < 5 * 60 * 1000)) {
        console.log('👤 Skipping API call - user not found recently, using cached data');
      } else {
        // Try to fetch fresh data from API first
        try {
          const token = await ensureAuth();
          if (token) {
            console.log('👤 Fetching fresh contact info from API...');
            const response = await api.get(`/users/${actualUserId}`);
            if (response.data) {
              const contactData = {
                id: actualUserId,
                name: response.data.name || name,
                phoneNumber: response.data.phoneNumber,
                profilePicture: response.data.profilePicture,
                about: response.data.about,
                lastUpdated: new Date().toISOString()
              };
              console.log('👤 Fetched fresh contact info from API:', contactData);
              setContactInfo(contactData);
              // Save to local storage for future use
              await AsyncStorage.setItem(`contact_${actualUserId}`, JSON.stringify(contactData));
              // Clear any failure cache for this user since it succeeded
              if (apiFailureCache[actualUserId]) {
                const newCache = { ...apiFailureCache };
                delete newCache[actualUserId];
                setApiFailureCache(newCache);
              }
              return; // Exit early if API call was successful
            }
          }
        } catch (apiError: any) {
          console.log('❌ API failed to fetch contact info:', apiError?.status || 'unknown error');
          // For 404 errors, cache the failure to prevent repeated calls
          if (apiError?.status === 404) {
            console.log('👤 User not found in backend database, caching failure to prevent repeated calls');
            setApiFailureCache(prev => ({ ...prev, [actualUserId]: now }));
          } else {
            console.log('❌ API error details:', apiError?.message || apiError);
          }
        }
      }
      
      // Fallback to stored data if API fails
      const storedContactInfo = await AsyncStorage.getItem(`contact_${actualUserId}`);
      if (storedContactInfo) {
        const contactData = JSON.parse(storedContactInfo);
        console.log('👤 Loaded contact info from storage:', contactData);
        setContactInfo(contactData);
      } else {
        console.log('👤 No stored contact info found, setting basic info...');
        // Set basic contact info with name from params
        const basicContactData = {
          id: actualUserId,
          name: name || 'Unknown',
          phoneNumber: null,
          lastUpdated: new Date().toISOString()
        };
        setContactInfo(basicContactData);
      }
    } catch (error) {
      console.error('Error loading contact info:', error);
    }
  };

  const loadMessages = async () => {
    try {
      console.log('📚 DEBUG: Loading messages for userId:', userId);
      const storedMessages = await AsyncStorage.getItem(`messages_${userId}`);
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        console.log('📚 DEBUG: Loaded messages:', parsedMessages.map((m: any) => ({ id: m.id, text: m.text, isFromMe: m.isFromMe })));
        setMessages(parsedMessages);
      } else {
        console.log('📚 DEBUG: No stored messages found for userId:', userId);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const saveMessages = async (newMessages: Message[]) => {
    try {
      await AsyncStorage.setItem(`messages_${userId}`, JSON.stringify(newMessages));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  // Simplified message sending - just send and let global polling handle reception
  const sendMessage = async () => {
    try {
      console.log('🎯 SEND MESSAGE FUNCTION STARTED');
      
      if (!message.trim()) {
        console.log('❌ Empty message, aborting');
        return;
      }

      console.log('📤 DEBUG: Original message state:', `"${message}"`);
      console.log('📤 DEBUG: Trimmed message:', `"${message.trim()}"`);
      console.log('📤 Sending message to userId:', userId, 'content:', message.trim());

      const newMessage: Message = {
        id: Date.now().toString(),
        text: message.trim(),
        timestamp: new Date(),
        isFromMe: true,
        status: 'sending'
      };

      console.log('📤 DEBUG: Created message object:', JSON.stringify(newMessage, null, 2));

      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      setMessage("");

      // Save messages to local storage immediately for instant UI update
      await saveMessages(updatedMessages);
      console.log('💾 Message saved to local storage:', newMessage.text);

      // Send message through backend for delivery (optimized - no waiting)
      try {
        const token = await ensureAuth();
        if (token) {
          console.log('🚀 Sending message to backend...');
          
          // Validate userId is MongoDB ObjectId format, not phone number
          let validReceiverId = userId;
          const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
          
          if (!isValidObjectId) {
            console.warn('⚠️ userId is not a valid ObjectId (possibly phone number):', userId);
            
            // Try to get the correct ObjectId from contacts
            try {
              const phoneNumber = userId.replace(/\D/g, ''); // Remove non-digits
              console.log('🔍 Looking up user by phone number:', phoneNumber);
              
              // Fetch all contacts and find by phone
              const contactsResponse = await api.get('/contacts/all');
              const contacts = contactsResponse.data || [];
              
              const matchedContact = contacts.find((c: any) => {
                const contactPhone = c.phoneNumber?.replace(/\D/g, '');
                return contactPhone === phoneNumber;
              });
              
              if (matchedContact && matchedContact.appUserId) {
                const appUserId = matchedContact.appUserId._id || matchedContact.appUserId;
                validReceiverId = appUserId;
                console.log('✅ Found user ObjectId from contacts:', validReceiverId);
              } else {
                console.error('❌ Contact not found by phone:', phoneNumber);
                Alert.alert('Error', 'Unable to send message. Contact not found.');
                
                // Update to failed status
                const failedMessages = updatedMessages.map(msg => 
                  msg.id === newMessage.id 
                    ? { ...msg, status: 'failed' as const }
                    : msg
                );
                setMessages(failedMessages);
                await saveMessages(failedMessages);
                return;
              }
            } catch (lookupError) {
              console.error('❌ Failed to lookup user by phone:', lookupError);
              Alert.alert('Error', 'Unable to send message. Could not find recipient.');
              
              // Update to failed status
              const failedMessages = updatedMessages.map(msg => 
                msg.id === newMessage.id 
                  ? { ...msg, status: 'failed' as const }
                  : msg
              );
              setMessages(failedMessages);
              await saveMessages(failedMessages);
              return;
            }
          }
          
          const payload = {
            receiverId: validReceiverId,
            text: newMessage.text,
            messageId: newMessage.id
          };
          
          console.log('📤 DEBUG: Backend payload:', JSON.stringify(payload, null, 2));
          
          // Fire and forget - don't wait for response
          api.post('/messages/send', payload).then((response) => {
            console.log('✅ Message sent to backend successfully, response:', response);
            // Update message status to sent
            const sentMessages = updatedMessages.map(msg => 
              msg.id === newMessage.id 
                ? { ...msg, status: 'sent' as const }
                : msg
            );
            setMessages(sentMessages);
            saveMessages(sentMessages);
          }).catch((error) => {
            console.error('❌ Error sending message:', error);
            console.error('❌ DEBUG: Full error details:', {
              message: error.message,
              status: error.status,
              url: error.url,
              data: error.data
            });
            // Update message status to failed
            const failedMessages = updatedMessages.map(msg => 
              msg.id === newMessage.id 
                ? { ...msg, status: 'failed' as const }
                : msg
            );
            setMessages(failedMessages);
            saveMessages(failedMessages);
          });
          
          // Immediately mark as sent for better UX (optimistic update)
          const sentMessages = updatedMessages.map(msg => 
            msg.id === newMessage.id 
              ? { ...msg, status: 'sent' as const }
              : msg
          );
          setMessages(sentMessages);
          await saveMessages(sentMessages);
        } else {
          console.log('❌ No token available for backend request');
        }
      } catch (error) {
        console.error('❌ Error in backend sending logic:', error);
        
        // Update message status to failed
        const failedMessages = updatedMessages.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'failed' as const }
            : msg
        );
        setMessages(failedMessages);
        await saveMessages(failedMessages);
      }
    } catch (error) {
      console.error('💥 CRITICAL ERROR IN SEND MESSAGE:', error);
      console.error('💥 Error stack:', (error as any)?.stack);
    }
  };

  const receiveMessage = async (messageData: any) => {
    const receivedMessage: Message = {
      id: messageData.id || Date.now().toString(),
      text: messageData.text,
      timestamp: new Date(messageData.timestamp),
      isFromMe: false,
      status: 'delivered'
    };

    const updatedMessages = [...messages, receivedMessage];
    setMessages(updatedMessages);
    await saveMessages(updatedMessages);
  };

  const handleViewContact = () => {
    setShowMenu(false);
    // Navigate to contact info screen
    router.push({
      pathname: `/contact-info/[userId]`,
      params: { 
        userId: userId,
        name: name || contactInfo?.name || 'Unknown',
        phone: contactInfo?.phoneNumber || 'No phone number'
      }
    });
  };

  const MenuModal = () => (
    <Modal
      visible={showMenu}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowMenu(false)}
    >
      <TouchableOpacity 
        style={styles.menuOverlay}
        activeOpacity={1}
        onPress={() => setShowMenu(false)}
      >
        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleViewContact}
          >
            <Ionicons name="person-outline" size={20} color="#111827" />
            <Text style={styles.menuItemText}>View Contact</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);
              Alert.alert(
                "Delete Chat",
                "Are you sure you want to delete this conversation? This cannot be undone.",
                [
                  { text: "Cancel", style: "cancel" },
                  { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await AsyncStorage.removeItem(`messages_${userId}`);
                        router.back();
                      } catch (error) {
                        console.error('Error deleting chat:', error);
                        Alert.alert('Error', 'Failed to delete chat');
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
            <Text style={[styles.menuItemText, { color: '#EF4444' }]}>Delete Chat</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const getMessageStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sending':
        return <Ionicons name="time-outline" size={12} color="rgba(255, 255, 255, 0.5)" />;
      case 'sent':
        return <Ionicons name="checkmark" size={12} color="rgba(255, 255, 255, 0.7)" />;
      case 'delivered':
        return <Ionicons name="checkmark-done" size={12} color="rgba(255, 255, 255, 0.7)" />;
      case 'failed':
        return <Ionicons name="alert-circle-outline" size={12} color="#EF4444" />;
      default:
        return null;
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageWrapper,
      item.isFromMe ? styles.myMessageWrapper : styles.theirMessageWrapper
    ]}>
      <View style={[
        styles.messageContainer,
        item.isFromMe ? styles.myMessage : styles.theirMessage
      ]}>
        <Text style={[
          styles.messageText,
          item.isFromMe ? styles.myMessageText : styles.theirMessageText
        ]}>
          {item.text}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={[
            styles.timestamp,
            item.isFromMe ? styles.myTimestamp : styles.theirTimestamp
          ]}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {item.isFromMe && getMessageStatusIcon(item.status)}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isPhoneOnly === 'true' ? phone : (name || contactInfo?.name || 'Unknown')}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={() => setShowMenu(true)}
            style={styles.menuButton}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu Modal */}
      <MenuModal />

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Messages */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                Start your conversation with {isPhoneOnly === 'true' ? phone : (name || contactInfo?.name || 'this contact')}
              </Text>
              <Text style={styles.emptySubtext}>
                Messages are stored locally on your device
              </Text>
            </View>
          }
          ListFooterComponent={null}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
            onPress={() => {
              console.log('🎯 SEND BUTTON PRESSED - Message:', `"${message}"`);
              console.log('🎯 SEND BUTTON PRESSED - UserId:', userId);
              console.log('🎯 SEND BUTTON PRESSED - Message length:', message.length);
              sendMessage();
            }}
            disabled={!message.trim()}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
  },
  messageWrapper: {
    marginVertical: 2,
    paddingHorizontal: 4,
  },
  myMessageWrapper: {
    alignItems: 'flex-end',
  },
  theirMessageWrapper: {
    alignItems: 'flex-start',
  },
  messageContainer: {
    maxWidth: '85%',
    minWidth: '20%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    position: 'relative',
  },
  myMessage: {
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    paddingBottom: 4,
    flexWrap: 'wrap',
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  theirMessageText: {
    color: '#111827',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 2,
  },
  myTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  theirTimestamp: {
    color: 'rgba(107, 114, 128, 0.7)',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 2,
  },
  emptySubtext: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    color: '#111827',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  menuButton: {
    padding: 4,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 80, // Adjust based on header height
    paddingRight: 16,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: {
    color: '#111827',
    fontSize: 16,
    marginLeft: 12,
  },
});