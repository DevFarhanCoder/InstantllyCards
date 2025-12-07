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
  ScrollView,
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
  const [showTransferAdminModal, setShowTransferAdminModal] = useState(false);
  const [selectedNewAdmin, setSelectedNewAdmin] = useState<string | null>(null);
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

  const loadGroupMembers = async () => {
    if (!id || !groupInfo) return;

    try {
      console.log('🔄 Loading group members for transfer modal...');
      const members: GroupMember[] = [];
      
      // Get current user
      const userData = await getCurrentUser();
      const userId = userData?.id || userData?._id;
      
      // Try to fetch from backend API first
      try {
        const response = await api.get('/groups');
        if (response && response.success && response.groups) {
          const backendGroup = response.groups.find((g: any) => g._id === id);
          if (backendGroup && backendGroup.members) {
            for (const member of backendGroup.members) {
              if (typeof member === 'object' && member._id) {
                members.push({
                  id: member._id,
                  name: member.name || `User ${member._id.slice(-4)}`,
                  phoneNumber: member.phone || member.phoneNumber || 'Unknown',
                  profilePicture: member.profilePicture,
                });
              }
            }
            console.log(`✅ Loaded ${members.length} members from backend for modal`);
          }
        }
      } catch (error) {
        console.error('❌ Failed to fetch members from backend:', error);
      }
      
      // If members loaded successfully, update state
      if (members.length > 0) {
        setGroupMembers(members);
        console.log('✅ Updated groupMembers state:', members);
      } else {
        console.warn('⚠️ No members loaded for transfer modal');
      }
    } catch (error) {
      console.error('Error loading group members:', error);
    }
  };

  const transferAdminRole = async () => {
    if (!selectedNewAdmin) {
      Alert.alert('Error', 'Please select a member to transfer admin rights to.');
      return;
    }

    try {
      if (!groupInfo || !id) return;

      const newAdminMember = groupMembers.find(m => m.id === selectedNewAdmin);
      if (!newAdminMember) {
        Alert.alert('Error', 'Selected member not found.');
        return;
      }

      console.log('🔄 Transferring admin to:', selectedNewAdmin);
      console.log('🔄 Group ID:', id);

      // Call backend API to transfer admin
      const response = await api.put(`/groups/${id}/transfer-admin`, {
        newAdminId: selectedNewAdmin
      });

      console.log('📥 Transfer admin response:', response);

      if (response && response.success) {
        // Update local state
        setShowTransferAdminModal(false);
        setSelectedNewAdmin(null);
        
        // Reload group info from backend to get fresh admin data
        const reloadGroupInfo = async () => {
          try {
            const groupsResponse = await api.get('/groups');
            if (groupsResponse && groupsResponse.success && groupsResponse.groups) {
              const updatedGroup = groupsResponse.groups.find((g: any) => g._id === id || g.id === id);
              if (updatedGroup) {
                const groupInfo: GroupInfo = {
                  id: updatedGroup._id,
                  name: updatedGroup.name,
                  description: updatedGroup.description || '',
                  icon: updatedGroup.icon,
                  members: updatedGroup.members || [],
                  admin: updatedGroup.admin,
                  createdAt: updatedGroup.createdAt,
                  updatedAt: updatedGroup.updatedAt,
                };
                setGroupInfo(groupInfo);
                console.log('✅ Group info reloaded after admin transfer');
              }
            }
          } catch (error) {
            console.error('Error reloading group info:', error);
          }
        };
        await reloadGroupInfo();
        
        Alert.alert(
          'Admin Transferred',
          `${newAdminMember.name} is now the group admin.`,
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(response?.message || response?.error || 'Failed to transfer admin');
      }
    } catch (error: any) {
      console.error('❌ Error transferring admin:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to transfer admin rights. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const confirmLeaveGroup = async () => {
    console.log('🔵 CONFIRM LEAVE GROUP FUNCTION CALLED - Group Chat');
    console.log('🔵 Group ID:', id);
    console.log('🔵 Group Info:', groupInfo);
    
    try {
      console.log('🚀 Starting leave group process from chat...');
      
      if (!groupInfo || !id) {
        console.log('❌ No group info found, aborting leave');
        Alert.alert('Error', 'Group information not available.');
        return;
      }

      setShowGroupMenu(false);

      console.log('📞 Making API call to DELETE /groups/' + id);
      
      // Call backend API to leave the group
      const response = await api.del(`/groups/${id}`);
      
      console.log('📥 Received response from backend:', JSON.stringify(response, null, 2));
      
      if (response && response.success) {
        console.log('✅ Successfully left group from backend');
        
        // Clear active chat
        await clearActiveChat();
        
        // Leave the socket room
        if (socketService && id) {
          socketService.leaveConversation(undefined, id);
          console.log('🚪 Left socket room:', id);
        }
        
        // Update local group data to mark as left - DON'T DELETE IT
        try {
          let groupData = await AsyncStorage.getItem(`group_${id}`);
          
          // If group doesn't exist in storage, create it from current groupInfo
          if (!groupData && groupInfo) {
            console.log('⚠️ Group not in storage, creating from current data...');
            const newGroupData = {
              id: id,
              _id: id,
              name: groupInfo.name,
              description: groupInfo.description || '',
              icon: groupInfo.icon || '',
              members: groupInfo.members || [],
              admin: groupInfo.admin,
              createdAt: groupInfo.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await AsyncStorage.setItem(`group_${id}`, JSON.stringify(newGroupData));
            groupData = JSON.stringify(newGroupData);
          }
          
          if (groupData) {
            const group = JSON.parse(groupData);
            
            // Mark the group as left by updating it
            group.hasLeft = true;
            group.leftAt = new Date().toISOString();
            
            // Save the updated group data - DO NOT DELETE
            await AsyncStorage.setItem(`group_${id}`, JSON.stringify(group));
            console.log('✅ Marked group as left in local storage (NOT DELETED)');
            
            // Add system message indicating user left
            const messagesData = await AsyncStorage.getItem(`group_messages_${id}`);
            const messages = messagesData ? JSON.parse(messagesData) : [];
            
            const systemMessage = {
              id: `msg_system_${Date.now()}`,
              senderId: 'system',
              senderName: 'System',
              text: 'You left the group',
              timestamp: new Date().toISOString(),
              type: 'system',
            };
            
            messages.push(systemMessage);
            console.log('✅ Added "You left the group" system message');
          } else {
            console.error('❌ Could not find or create group data');
          }
        } catch (storageError) {
          console.error('Error updating local storage:', storageError);
        }
        
        // Store preference to show Groups tab BEFORE navigation
        await AsyncStorage.setItem('chats_active_tab', 'groups');
        console.log('✅ Set chats_active_tab to groups');
        
        // Navigate to chats tab which will auto-switch to Groups tab
        router.replace('/(tabs)/chats' as any);
      } else {
        console.log('❌ Failed to leave group - backend returned error');
        throw new Error(response?.message || 'Failed to leave group');
      }
    } catch (error: any) {
      console.error('❌ ERROR LEAVING GROUP:', error);
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      
      Alert.alert(
        'Error',
        'Failed to leave group. Please try again.\n\n' + (error?.message || String(error))
      );
    } finally {
      console.log('🔵 confirmLeaveGroup function FINISHED');
    }
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
                onPress={async () => {
                  setShowGroupMenu(false);
                  await loadGroupMembers();
                  setShowTransferAdminModal(true);
                }}
              >
                <Ionicons name="person-add-outline" size={24} color="#FFA500" />
                <Text style={[styles.menuItemText, { color: '#FFA500' }]}>Transfer Admin</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={async () => {
                setShowGroupMenu(false);
                const isAdmin = groupInfo?.admin === currentUserId;
                
                // If admin with other members, require transfer first
                if (isAdmin && groupMembers.length > 1) {
                  Alert.alert(
                    'Transfer Admin Required',
                    'As the group admin, you must transfer admin rights to another member before leaving the group.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Transfer Admin', 
                        onPress: async () => {
                          await loadGroupMembers();
                          setShowTransferAdminModal(true);
                        }
                      }
                    ]
                  );
                  return;
                }
                
                const message = `Are you sure you want to leave "${groupInfo?.name}"?\n\nYou can delete it from your device later using the "Delete Group from Device" option.`;
                
                Alert.alert(
                  'Leave Group',
                  message,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Leave', style: 'destructive', onPress: confirmLeaveGroup }
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

      {/* Transfer Admin Modal */}
      <Modal
        visible={showTransferAdminModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowTransferAdminModal(false);
          setSelectedNewAdmin(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={{ 
            backgroundColor: '#FFFFFF', 
            borderRadius: 16, 
            width: '90%', 
            maxWidth: 400,
            maxHeight: '80%',
            overflow: 'hidden'
          }}>
            <View style={{ padding: 20, backgroundColor: '#FFF7ED', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <View style={{ 
                width: 64, 
                height: 64, 
                borderRadius: 32, 
                backgroundColor: '#FFA500', 
                alignSelf: 'center', 
                justifyContent: 'center', 
                alignItems: 'center',
                marginBottom: 16
              }}>
                <Ionicons 
                  name="person-add-outline" 
                  size={32} 
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.modalTitle}>Transfer Admin</Text>
              <Text style={styles.modalSubtitle}>
                Select a member to transfer admin rights to. You will no longer be the admin after this.
              </Text>
            </View>
            
            <ScrollView style={styles.membersList} showsVerticalScrollIndicator={false}>
              {groupMembers
                .filter(member => member.id !== currentUserId)
                .map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.transferMemberItem,
                      selectedNewAdmin === member.id && styles.transferMemberItemSelected
                    ]}
                    onPress={() => setSelectedNewAdmin(member.id)}
                  >
                    <View style={styles.transferMemberAvatar}>
                      {member.profilePicture ? (
                        <Image 
                          source={{ uri: member.profilePicture }} 
                          style={styles.transferMemberAvatarImage} 
                        />
                      ) : (
                        <Text style={styles.transferMemberAvatarText}>
                          {member.name?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                      )}
                    </View>
                    
                    <View style={{ flex: 1, marginLeft: 14, marginRight: 10 }}>
                      <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>
                        {member.name || 'Unknown User'}
                      </Text>
                      <Text style={{ fontSize: 14, color: '#6B7280' }}>
                        {member.phoneNumber || 'No phone'}
                      </Text>
                    </View>
                    
                    {selectedNewAdmin === member.id && (
                      <Ionicons name="checkmark-circle" size={28} color="#10B981" />
                    )}
                  </TouchableOpacity>
                ))}
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => {
                  setShowTransferAdminModal(false);
                  setSelectedNewAdmin(null);
                }}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButtonPrimary,
                  !selectedNewAdmin && styles.modalButtonDisabled
                ]}
                onPress={transferAdminRole}
                disabled={!selectedNewAdmin}
              >
                <Text style={styles.modalButtonTextPrimary}>Transfer Admin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  
  // Transfer Admin Modal Styles
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  membersList: {
    width: '100%',
    maxHeight: 400,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  transferMemberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minHeight: 80,
    width: '100%',
  },
  transferMemberItemSelected: {
    backgroundColor: '#FFF7ED',
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  transferMemberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFA500',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 0,
  },
  transferMemberAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  transferMemberAvatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  transferMemberDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  transferMemberName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
  },
  transferMemberPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  modalButtonPrimary: {
    flex: 1,
    backgroundColor: '#FFA500',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalButtonDisabled: {
    backgroundColor: '#D1D5DB',
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
});