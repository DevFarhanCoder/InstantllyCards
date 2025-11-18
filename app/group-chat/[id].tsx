import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser, getCurrentUserId } from '@/lib/useUser';
import api from '@/lib/api';
import { showInAppNotification } from '@/lib/notifications-expo-go';
import { useChatSocket, useSendMessage } from '@/hooks/chats';
import { socketService } from '@/lib/socket';

interface GroupMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  type: 'text' | 'system';
}

interface GroupInfo {
  id: string;
  name: string;
  description: string;
  icon?: string;
  members: string[];
  admin: string;
  createdAt: string;
  updatedAt: string;
}

interface GroupMember {
  id: string;
  name: string;
  profilePicture?: string;
  phoneNumber: string;
}

export default function GroupChatScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [displayName, setDisplayName] = useState<string>('Group');
  const flatListRef = useRef<FlatList>(null);
  
  // Add Socket.IO integration
  const { isConnected, socketService } = useChatSocket();
  const { sendGroupMessage: sendGroupMessageViaSocket } = useSendMessage();

  useEffect(() => {
    if (!isInitialized) {
      initializeChat();
      setIsInitialized(true);
    }
    setActiveChat();
    
    // Join the group room for real-time messaging (but don't set up duplicate listeners)
    if (isConnected && id) {
      console.log('🎧 Setting up Socket.IO listeners for group:', id);
      
      // Join the group room for real-time messaging
      socketService.joinConversation(undefined, id);
      console.log('🏠 Joined group room:', id);
      
      // Set up a message refresh interval to check for new messages
      const messageRefreshInterval = setInterval(() => {
        checkForNewMessages();
      }, 2000); // Check every 2 seconds for new messages
      
      return () => {
        clearActiveChat();
        socketService.leaveConversation(undefined, id);
        console.log('🚪 Left group room:', id);
        clearInterval(messageRefreshInterval);
      };
    } else {
      // Fallback to polling if Socket.IO is not connected
      const messageInterval = setInterval(() => {
        checkForNewMessages();
      }, 5000);
      
      return () => {
        clearActiveChat();
        clearInterval(messageInterval);
      };
    }
  }, [id, isConnected, socketService, isInitialized]);

  // Update display name whenever groupInfo changes
  useEffect(() => {
    if (groupInfo?.name) {
      console.log('📝 Updating display name to:', groupInfo.name);
      setDisplayName(groupInfo.name);
    } else if (name && displayName === 'Group') {
      // Only use URL parameter as fallback on first load
      console.log('📝 Using fallback name:', name);
      setDisplayName(name);
    }
  }, [groupInfo?.name, name, displayName]);

  // Reload group info when screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      const reloadGroupInfo = async () => {
        if (!id) return;
        
        console.log('🔄 Focus effect: Reloading group info...');
        
        try {
          // Reload from storage first (fastest and most reliable)
          const groupData = await AsyncStorage.getItem(`group_${id}`);
          if (groupData) {
            const group = JSON.parse(groupData);
            console.log('🔄 Loaded group from storage:', group.name);
            setGroupInfo(group);
            // Display name will be updated by the useEffect above
          }
        } catch (error) {
          console.error('Error reloading group info:', error);
        }
      };
      
      reloadGroupInfo();
    }, [id])
  );

  const setActiveChat = async () => {
    if (id) {
      await AsyncStorage.setItem('currentActiveChat', `group_${id}`);
      console.log(`🔔 Set active chat to group: ${id}`);
    }
  };

  const clearActiveChat = async () => {
    await AsyncStorage.removeItem('currentActiveChat');
    console.log('🔔 Cleared active chat');
  };

  const initializeChat = async () => {
    if (!id) return;

    try {
      // Get current user data using utility function
      const userData = await getCurrentUser();
      if (!userData) {
        Alert.alert('Error', 'User not found. Please log in again.');
        router.back();
        return;
      }

      const userId = userData.id || userData._id;
      if (!userId) {
        Alert.alert('Error', 'Invalid user data. Please log in again.');
        router.back();
        return;
      }
      setCurrentUserId(userId);

      // First try to load group info from backend API
      let group: GroupInfo | null = null;
      try {
        console.log(`🔍 Fetching group data for ID: ${id}`);
        const response = await api.get('/groups');
        
        if (response && response.success && response.groups) {
          const backendGroup = response.groups.find((g: any) => g._id === id);
          
          if (backendGroup) {
            console.log(`✅ Found group in backend: ${backendGroup.name}`);
            group = {
              id: backendGroup._id,
              name: backendGroup.name,
              description: backendGroup.description || '',
              icon: backendGroup.icon || '',
              members: backendGroup.members.map((m: any) => m._id || m.id || m),
              admin: backendGroup.admin._id || backendGroup.admin,
              createdAt: backendGroup.createdAt,
              updatedAt: backendGroup.updatedAt
            };
          }
        }
      } catch (apiError) {
        console.error('❌ Failed to fetch group from backend:', apiError);
      }

      // Fallback to AsyncStorage if backend fetch failed
      if (!group) {
        console.log('🔄 Falling back to AsyncStorage...');
        const groupData = await AsyncStorage.getItem(`group_${id}`);
        if (groupData) {
          group = JSON.parse(groupData);
          console.log(`✅ Found group in AsyncStorage: ${group?.name}`);
        }
      }

      if (group) {
        setGroupInfo(group);

        // Check if current user is still a member
        if (!group.members.includes(userId)) {
          Alert.alert('Error', 'You are no longer a member of this group.');
          router.back();
          return;
        }

        // Load group members
        const members: GroupMember[] = [];
        
        // Try to get populated member data from backend response first
        try {
          const response = await api.get('/groups');
          if (response && response.success && response.groups) {
            const backendGroup = response.groups.find((g: any) => g._id === id);
            if (backendGroup && backendGroup.members) {
              // Use populated member data from backend
              for (const member of backendGroup.members) {
                if (typeof member === 'object' && member._id) {
                  members.push({
                    id: member._id,
                    name: member.name || `User ${member._id.slice(-4)}`,
                    phoneNumber: member.phone || 'Unknown',
                    profilePicture: member.profilePicture,
                  });
                }
              }
              console.log(`✅ Loaded ${members.length} members from backend`);
            }
          }
        } catch (memberError) {
          console.error('❌ Failed to fetch members from backend:', memberError);
        }
        
        // Fallback to AsyncStorage method if backend fetch failed
        if (members.length === 0) {
          console.log('🔄 Falling back to AsyncStorage for member data...');
          for (const memberId of group.members) {
            if (memberId === userId) {
              // Add current user
              members.push({
                id: userId,
                name: userData.name || 'You',
                phoneNumber: userData.phone || 'current user',
                profilePicture: userData.profilePicture,
              });
            } else {
              // Try to find member data
              const memberData = await AsyncStorage.getItem(`contact_${memberId}`);
              if (memberData) {
                const member = JSON.parse(memberData);
                members.push({
                  id: memberId,
                  name: member.name,
                  profilePicture: member.profilePicture,
                  phoneNumber: member.phoneNumber,
                });
              } else {
                // If contact not found, add a placeholder
                members.push({
                  id: memberId,
                  name: `User ${memberId.slice(-4)}`,
                  phoneNumber: 'Unknown',
                });
              }
            }
          }
        }
        
        setGroupMembers(members);
      } else {
        console.error(`❌ Group not found with ID: ${id}`);
        Alert.alert('Error', 'Group not found.');
        router.back();
        return;
      }

      // Load messages
      loadMessages();
      
      // Check for any pending messages
      setTimeout(() => {
        checkForNewMessages();
      }, 1000); // Small delay to ensure all data is loaded
    } catch (error) {
      console.error('Error initializing group chat:', error);
      Alert.alert('Error', 'Failed to load group chat.');
    }
  };

  const loadMessages = async () => {
    if (!id) return;

    try {
      const messagesData = await AsyncStorage.getItem(`group_messages_${id}`);
      if (messagesData) {
        const groupMessages: GroupMessage[] = JSON.parse(messagesData);
        setMessages(groupMessages.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ));
      }
    } catch (error) {
      console.error('Error loading group messages:', error);
    }
  };

  const checkForNewMessages = async () => {
    if (!id || !currentUserId) return;

    try {
      // Use the group-specific endpoint to check for new messages
      const response = await api.get(`/messages/check-group-pending/${id}`);
      
      if (response?.success && response.messages && response.messages.length > 0) {
        console.log(`📬 Received ${response.messages.length} new group messages`);
        
        const newMessages: GroupMessage[] = response.messages.map((msg: any) => ({
          id: msg.messageId,
          senderId: msg.senderId,
          senderName: msg.senderName,
          text: msg.text,
          timestamp: msg.timestamp,
          type: 'text'
        }));

        // Get current messages
        const currentMessagesData = await AsyncStorage.getItem(`group_messages_${id}`);
        const currentMessages: GroupMessage[] = currentMessagesData 
          ? JSON.parse(currentMessagesData) 
          : [];

        // Merge new messages with existing ones (avoid duplicates)
        const existingMessageIds = new Set(currentMessages.map(m => m.id));
        const uniqueNewMessages = newMessages.filter(msg => !existingMessageIds.has(msg.id));

        if (uniqueNewMessages.length > 0) {
          const updatedMessages = [...currentMessages, ...uniqueNewMessages].sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );

          // Update state and storage
          setMessages(updatedMessages);
          await AsyncStorage.setItem(`group_messages_${id}`, JSON.stringify(updatedMessages));

          // Show notification for each new message (if not currently active)
          const activeChat = await AsyncStorage.getItem('currentActiveChat');
          if (activeChat !== `group_${id}`) {
            for (const msg of uniqueNewMessages) {
              await showInAppNotification(
                `${groupInfo?.name || 'Group'}: ${msg.senderName}`,
                msg.text,
                () => {
                  // Focus this chat when notification is tapped
                  router.push(`/group-chat/${id}?name=${encodeURIComponent(groupInfo?.name || 'Group')}` as any);
                }
              );
            }
          }

          // Scroll to bottom if new messages received
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);

          // Mark messages as delivered
          await api.post('/messages/mark-group-delivered', {
            messageIds: uniqueNewMessages.map(m => m.id),
            groupId: id
          });
          
          console.log(`✅ Marked ${uniqueNewMessages.length} group messages as delivered`);
        }
      }
    } catch (error) {
      console.error('Error checking for new group messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !id || !currentUserId) return;

    try {
      // Get current user name from group members or fallback
      const currentUserMember = groupMembers.find(m => m.id === currentUserId);
      const currentUserName = currentUserMember?.name || 'You';
      
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const message: GroupMessage = {
        id: messageId,
        senderId: currentUserId,
        senderName: currentUserName,
        text: newMessage.trim(),
        timestamp: new Date().toISOString(),
        type: 'text',
      };

      // Add to messages list immediately for better UX
      const updatedMessages = [...messages, message];
      setMessages(updatedMessages);

      // Save to local storage
      await AsyncStorage.setItem(`group_messages_${id}`, JSON.stringify(updatedMessages));

      // Clear input
      setNewMessage('');

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Send via Socket.IO if connected, otherwise fallback to REST API
      if (isConnected && sendGroupMessageViaSocket) {
        console.log('📨 Sending group message via Socket.IO:', messageId);
        try {
          const success = await sendGroupMessageViaSocket(
            id, 
            message.text, 
            'text'
          );
          if (success) {
            console.log('✅ Group message sent via Socket.IO:', messageId);
          } else {
            console.log('❌ Socket.IO send failed, falling back to REST API');
            throw new Error('Socket.IO send failed');
          }
        } catch (socketError) {
          console.error('Socket.IO send error, falling back to REST API:', socketError);
          // Fallback to REST API
          await api.post('/messages/send-group', {
            groupId: id,
            text: message.text,
            messageId: messageId
          });
          console.log('📨 Group message sent via REST API fallback:', messageId);
        }
      } else {
        // Send to backend REST API if Socket.IO not connected
        console.log('📨 Sending group message via REST API (Socket.IO not connected):', messageId);
        await api.post('/messages/send-group', {
          groupId: id,
          text: message.text,
          messageId: messageId
        });
        console.log('📨 Group message sent via REST API:', messageId);
      }

      console.log('📨 Group message sent:', message);
    } catch (error) {
      console.error('Error sending group message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: GroupMessage }) => {
    const isOwnMessage = item.senderId === currentUserId;
    const isSystemMessage = item.type === 'system';

    if (isSystemMessage) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.text}</Text>
        </View>
      );
    }

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        {!isOwnMessage && (
          <Text style={styles.senderName}>{item.senderName}</Text>
        )}
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.text}
          </Text>
          <Text style={[
            styles.messageTime,
            isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
          ]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  const openGroupInfo = () => {
    router.push(`/group-details/${id}?name=${encodeURIComponent(groupInfo?.name || '')}` as any);
  };

  const initiateGroupCall = async (type: 'audio' | 'video') => {
    try {
      console.log(`🎥 Initiating ${type} call for group:`, id);
      
      // Check if user has necessary permissions
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to start a call');
        return;
      }

      // Navigate to group call screen
      router.push(`/group-call/${id}?type=${type}&groupName=${encodeURIComponent(groupInfo?.name || 'Group')}` as any);
      
      // Send call invitation to all group members via Socket.IO
      if (socketService.isConnected()) {
        // For now, send as a system message. We'll enhance this with proper call signaling later
        const callMessage = {
          id: `call_${Date.now()}`,
          senderId: user.id,
          senderName: user.name,
          text: `📞 ${user.name} started a ${type} call`,
          timestamp: new Date().toISOString(),
          type: 'system' as const
        };
        
        // Add the call message to local state
        setMessages(prev => [...prev, callMessage]);
        
        console.log(`📞 Group ${type} call invitation sent`);
      }
      
    } catch (error) {
      console.error('Error initiating group call:', error);
      Alert.alert('Error', 'Failed to start group call');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={styles.root} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.groupInfoButton}
          onPress={openGroupInfo}
        >
          <View style={styles.groupAvatar}>
            {groupInfo?.icon ? (
              <Image source={{ uri: groupInfo.icon }} style={styles.groupAvatarImage} />
            ) : (
              <Ionicons name="people" size={24} color="#FFFFFF" />
            )}
          </View>
          
          <View style={styles.groupHeaderInfo}>
            <Text style={styles.groupName}>{displayName}</Text>
            <View style={styles.statusRow}>
              {/* Socket.IO connection indicator */}
              <View style={[styles.connectionDot, isConnected ? styles.connectedDot : styles.disconnectedDot]} />
              <Text style={styles.memberCount}>
                {groupMembers.length} member{groupMembers.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Call Buttons */}
        <View style={styles.callButtonsContainer}>
          <TouchableOpacity 
            style={styles.callButton}
            onPress={() => initiateGroupCall('audio')}
          >
            <Ionicons name="call" size={20} color="#059669" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.callButton}
            onPress={() => initiateGroupCall('video')}
          >
            <Ionicons name="videocam" size={20} color="#7C3AED" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => setShowGroupMenu(true)}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
      />

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TouchableOpacity
            style={styles.cardShareButton}
            onPress={() => {
              // Navigate to card selection for sharing
              router.push(`/share-card-to-group/${id}?groupName=${encodeURIComponent(groupInfo?.name || 'Group')}` as any);
            }}
          >
            <Ionicons name="card" size={20} color="#3B82F6" />
          </TouchableOpacity>
          
          <TextInput
            style={styles.messageInput}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          
          <TouchableOpacity
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Group Menu Modal */}
      <Modal
        visible={showGroupMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGroupMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          onPress={() => setShowGroupMenu(false)}
          activeOpacity={0.0}
        >
          <View style={styles.groupMenuContainer}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowGroupMenu(false);
                // Navigate to see all group cards
                router.push(`/group-cards/${id}?groupName=${encodeURIComponent(groupInfo?.name || 'Group')}` as any);
              }}
            >
              <Ionicons name="albums-outline" size={24} color="#111827" />
              <Text style={styles.menuItemText}>See all cards</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowGroupMenu(false);
                // Navigate to group info
                router.push(`/group-details/${id}?name=${encodeURIComponent(groupInfo?.name || '')}` as any);
              }}
            >
              <Ionicons name="information-circle-outline" size={24} color="#111827" />
              <Text style={styles.menuItemText}>Group Info</Text>
            </TouchableOpacity>
            
            {/* Admin Transfer - Only show for group admin */}
            {groupInfo?.admin === currentUserId && (
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setShowGroupMenu(false);
                  // Show member selection for admin transfer
                  Alert.alert(
                    'Transfer Admin',
                    'Select a new admin for this group. You will no longer be the admin.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Select Member', onPress: () => {
                        // This would ideally open a member selection screen
                        // For now, we'll show a simple prompt
                        Alert.alert('Feature Coming Soon', 'Admin transfer functionality will be available soon.');
                      }}
                    ]
                  );
                }}
              >
                <Ionicons name="person-add-outline" size={24} color="#FFA500" />
                <Text style={[styles.menuItemText, { color: '#FFA500' }]}>Transfer Admin</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowGroupMenu(false);
                Alert.alert(
                  'Leave Group',
                  'Are you sure you want to leave this group?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Leave', style: 'destructive', onPress: () => {
                      // Leave group functionality
                      router.back();
                    }}
                  ]
                );
              }}
            >
              <Ionicons name="exit-outline" size={24} color="#FF6B6B" />
              <Text style={[styles.menuItemText, { color: '#FF6B6B' }]}>Leave Group</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#111827",
  },
  groupInfoButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  groupAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4B5563",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  groupAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  groupHeaderInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  memberCount: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  callButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  callButton: {
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  moreButton: {
    padding: 8,
    marginLeft: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  ownMessageContainer: {
    alignItems: "flex-end",
  },
  otherMessageContainer: {
    alignItems: "flex-start",
  },
  senderName: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
    marginLeft: 12,
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  ownMessageBubble: {
    backgroundColor: "#3B82F6",
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: "#F3F4F6",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  ownMessageText: {
    color: "#FFFFFF",
  },
  otherMessageText: {
    color: "#111827",
  },
  messageTime: {
    fontSize: 11,
    textAlign: "right",
  },
  ownMessageTime: {
    color: "#E5E7EB",
  },
  otherMessageTime: {
    color: "#6B7280",
  },
  systemMessageContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  systemMessageText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  inputContainer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#F9FAFB",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardShareButton: {
    padding: 8,
    marginRight: 8,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: "#3B82F6",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "#4B5563",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupMenuContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  menuItemText: {
    color: "#111827",
    fontSize: 16,
    marginLeft: 12,
    fontWeight: "500",
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectedDot: {
    backgroundColor: '#10B981', // Green for connected
  },
  disconnectedDot: {
    backgroundColor: '#EF4444', // Red for disconnected
  },
});