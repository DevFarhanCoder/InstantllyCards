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
import { useChatSocket, useSendMessage } from "@/hooks/chats";

type Message = {
  id: string;
  text: string;
  timestamp: Date;
  isFromMe: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  localMessageId?: string; // For matching optimistic messages
  backendMessageId?: string; // Real message ID from server
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
  
  // Socket.IO integration for real-time messaging
  const { isConnected, socketService } = useChatSocket();
  const { sendMessage: sendMessageViaSocket } = useSendMessage();

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
    
    // Listen for app state changes
    const handleAppStateChange = (nextAppState: string) => {
      setIsAppInBackground(nextAppState === 'background' || nextAppState === 'inactive');
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [userId]);

  // Socket.IO connection and message refresh (without duplicate listeners)
  useEffect(() => {
    if (!isConnected || !userId) return;

    console.log('🎧 Setting up Socket.IO connection for private chat with:', userId);

    // Join the conversation room for real-time messaging
    socketService.joinConversation(userId);

    // Listen for message status updates only (not new messages to avoid duplicates)
    const unsubscribeStatus = socketService.onMessageStatus((statusData: any) => {
      console.log('📊 Message status update:', statusData);
      
      setMessages(prevMessages => {
        const updated = prevMessages.map(msg => {
          // Match by backend message ID or local ID
          if (msg.backendMessageId === statusData.messageId || msg.id === statusData.messageId) {
            return {
              ...msg,
              status: statusData.status as Message['status']
            };
          }
          return msg;
        });
        
        // Save updated messages
        if (JSON.stringify(updated) !== JSON.stringify(prevMessages)) {
          saveMessages(updated);
        }
        
        return updated;
      });
    });

    // Set up message refresh polling to get new messages
    const messageRefreshInterval = setInterval(() => {
      checkForNewMessages();
    }, 2000); // Check every 2 seconds for new messages

    return () => {
      socketService.leaveConversation(userId);
      unsubscribeStatus();
      clearInterval(messageRefreshInterval);
    };
  }, [isConnected, userId, socketService]);

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
        const unreadMessages = parsedMessages.filter((msg: any) => 
          !msg.isFromMe && msg.status !== 'read' && (msg.backendMessageId || msg.id)
        );
        
        if (unreadMessages.length > 0) {
          console.log(`📖 Marking ${unreadMessages.length} messages as read for ${userId}`);
          
          // Mark as read via Socket.IO for real-time updates
          if (isConnected) {
            unreadMessages.forEach((msg: any) => {
              const messageId = msg.backendMessageId || msg.id;
              if (messageId) {
                socketService.markMessageAsRead(messageId);
              }
            });
          }
          
          // Also update via REST API as fallback
          const messageIds = unreadMessages
            .map((msg: any) => msg.backendMessageId || msg.id)
            .filter(Boolean);
          
          if (messageIds.length > 0) {
            try {
              await api.post('/messages/mark-read', {
                messageIds: messageIds
              });
              console.log(`✅ Marked ${messageIds.length} messages as read on backend`);
            } catch (error) {
              console.error('❌ Failed to mark messages as read on backend:', error);
            }
          }
          
          // Update local message status
          const updatedMessages = parsedMessages.map((msg: any) => {
            if (!msg.isFromMe && messageIds.includes(msg.backendMessageId || msg.id)) {
              return { ...msg, status: 'read' };
            }
            return msg;
          });
          
          // Save updated messages
          await AsyncStorage.setItem(`messages_${userId}`, JSON.stringify(updatedMessages));
          setMessages(updatedMessages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })));
        }
      }
    } catch (error) {
      console.error('❌ Error in markMessagesAsDelivered:', error);
    }
  };

  const checkForNewMessages = async () => {
    if (!userId) return;

    try {
      // Use the private chat endpoint to check for new messages
      const response = await api.get(`/messages/check-pending/${userId}`);
      
      if (response?.success && response.messages && response.messages.length > 0) {
        console.log(`📬 Received ${response.messages.length} new private messages from ${userId}`);
        
        const newMessages: Message[] = response.messages.map((msg: any) => ({
          id: msg.messageId || msg._id,
          text: msg.text || msg.content,
          timestamp: new Date(msg.timestamp),
          isFromMe: false,
          status: 'delivered',
          backendMessageId: msg.messageId || msg._id
        }));

        // Get current messages
        const currentMessagesData = await AsyncStorage.getItem(`messages_${userId}`);
        const currentMessages: Message[] = currentMessagesData 
          ? JSON.parse(currentMessagesData).map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          : [];

        // Merge new messages with existing ones (avoid duplicates)
        const existingMessageIds = new Set(currentMessages.map(m => m.id || m.backendMessageId));
        const uniqueNewMessages = newMessages.filter(msg => 
          !existingMessageIds.has(msg.id) && !existingMessageIds.has(msg.backendMessageId || '')
        );

        if (uniqueNewMessages.length > 0) {
          const updatedMessages = [...currentMessages, ...uniqueNewMessages].sort((a, b) => 
            a.timestamp.getTime() - b.timestamp.getTime()
          );

          // Update state and storage
          setMessages(updatedMessages);
          await saveMessages(updatedMessages);

          console.log(`✅ Added ${uniqueNewMessages.length} new messages from ${userId}`);

          // Mark messages as delivered
          const messageIds = uniqueNewMessages
            .map(m => m.backendMessageId || m.id)
            .filter(Boolean);
          
          if (messageIds.length > 0) {
            try {
              await api.post('/messages/mark-delivered', {
                messageIds: messageIds
              });
              console.log(`✅ Marked ${messageIds.length} private messages as delivered`);
            } catch (error) {
              console.error('❌ Failed to mark messages as delivered:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking for new private messages:', error);
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
        console.log('👤 No stored contact info found, using name from params...');
        // Set basic contact info with name from params or phone number
        const displayName = name || (isPhoneOnly === 'true' ? phone : null) || 'Unknown';
        const basicContactData = {
          id: actualUserId,
          name: displayName,
          phoneNumber: phone || null,
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

  // Optimized message sending with Socket.IO and optimistic updates
  const sendMessage = async () => {
    try {
      console.log('🎯 SEND MESSAGE FUNCTION STARTED');
      
      if (!message.trim()) {
        console.log('❌ Empty message, aborting');
        return;
      }

      const messageText = message.trim();
      const localMessageId = `local_${Date.now()}_${Math.random()}`;
      
      console.log('📤 Sending message to userId:', userId, 'content:', messageText);

      // Create optimistic message (appears instantly in UI)
      const optimisticMessage: Message = {
        id: localMessageId,
        text: messageText,
        timestamp: new Date(),
        isFromMe: true,
        status: 'sending',
        localMessageId: localMessageId
      };

      console.log('📤 Created optimistic message:', optimisticMessage);

      // Check if we already have a similar message being sent (prevent double-tap issues)
      const recentSimilarMessage = messages.find(msg => 
        msg.text === messageText && 
        msg.isFromMe && 
        (msg.status === 'sending' || msg.status === 'sent') &&
        Math.abs(new Date().getTime() - msg.timestamp.getTime()) < 3000 // Within 3 seconds
      );
      
      if (recentSimilarMessage) {
        console.log('🚫 Preventing duplicate send - similar message already being processed');
        setMessage(""); // Clear input anyway
        return;
      }

      // Add to UI immediately for instant feedback
      const updatedMessages = [...messages, optimisticMessage];
      setMessages(updatedMessages);
      setMessage(""); // Clear input immediately

      // Save to local storage
      await saveMessages(updatedMessages);
      console.log('💾 Optimistic message saved to local storage');

      // Try Socket.IO first for real-time delivery
      if (isConnected) {
        console.log('🔌 Sending via Socket.IO...');
        
        const success = await sendMessageViaSocket(userId, messageText, 'text');
        
        if (success) {
          console.log('✅ Message sent via Socket.IO');
          // Update status to sent
          setMessages(prev => prev.map(msg => 
            msg.localMessageId === localMessageId 
              ? { ...msg, status: 'sent' as const }
              : msg
          ));
          return;
        } else {
          console.log('⚠️ Socket.IO send failed, falling back to REST API');
        }
      }

      // Fallback to REST API if Socket.IO unavailable
      console.log('📡 Falling back to REST API...');
      
      try {
        const token = await ensureAuth();
        if (!token) {
          throw new Error('No auth token');
        }

        // Validate userId is MongoDB ObjectId format
        let validReceiverId = userId;
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
        
        if (!isValidObjectId) {
          console.warn('⚠️ userId is not a valid ObjectId:', userId);
          
          // Try to get the correct ObjectId from contacts
          const contactsResponse = await api.get('/contacts/all');
          const contacts = contactsResponse.data || [];
          const phoneNumber = userId.replace(/\D/g, '');
          
          const matchedContact = contacts.find((c: any) => {
            const contactPhone = c.phoneNumber?.replace(/\D/g, '');
            return contactPhone === phoneNumber;
          });
          
          if (matchedContact && matchedContact.appUserId) {
            validReceiverId = matchedContact.appUserId._id || matchedContact.appUserId;
            console.log('✅ Found user ObjectId:', validReceiverId);
          } else {
            throw new Error('Contact not found');
          }
        }
        
        const payload = {
          receiverId: validReceiverId,
          text: messageText,
          messageId: localMessageId
        };
        
        console.log('📤 Sending to backend REST API:', payload);
        
        const response = await api.post('/messages/send', payload);
        console.log('✅ Message sent via REST API:', response);
        
        // Update to sent status
        const sentMessages = updatedMessages.map(msg => 
          msg.localMessageId === localMessageId 
            ? { ...msg, status: 'sent' as const, backendMessageId: response.messageId }
            : msg
        );
        setMessages(sentMessages);
        await saveMessages(sentMessages);
        
      } catch (error: any) {
        console.error('❌ Error sending message:', error);
        
        // Update to failed status
        const failedMessages = updatedMessages.map(msg => 
          msg.localMessageId === localMessageId 
            ? { ...msg, status: 'failed' as const }
            : msg
        );
        setMessages(failedMessages);
        await saveMessages(failedMessages);
        
        Alert.alert('Error', 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('💥 CRITICAL ERROR IN SEND MESSAGE:', error);
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
        return <Ionicons name="time-outline" size={14} color="rgba(255, 255, 255, 0.5)" />;
      case 'sent':
        // Single tick - sent to server
        return <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 14, marginLeft: 4 }}>✓</Text>;
      case 'delivered':
        // Double tick - delivered to recipient
        return <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 14, marginLeft: 4 }}>✓✓</Text>;
      case 'read':
        // Blue double tick - read by recipient
        return <Text style={{ color: '#4FC3F7', fontSize: 14, marginLeft: 4 }}>✓✓</Text>;
      case 'failed':
        return <Ionicons name="alert-circle-outline" size={14} color="#EF4444" style={{ marginLeft: 4 }} />;
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
          keyExtractor={(item: Message) => item.id}
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