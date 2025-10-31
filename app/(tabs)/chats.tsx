import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Alert, 
  ActivityIndicator,
  TextInput,
  Image,
  Pressable,
  ScrollView,
  Dimensions,
  Animated,
  Modal,
  Linking
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser, getCurrentUserId } from '@/lib/useUser';
import * as Contacts from 'expo-contacts';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "@/lib/api";
import { ensureAuth } from "@/lib/auth";
import { showInAppNotification } from "../../lib/notifications-expo-go";
import { useChatSocket } from '@/hooks/chats';
import FooterCarousel from "@/components/FooterCarousel";
import GroupSharingModal from "@/components/GroupSharingModal";
import GroupConnectionUI from "@/components/GroupConnectionUI";
import groupSharingService, { GroupSharingSession } from "@/lib/groupSharingService";

type SentCard = {
  _id: string;
  cardId: string;
  recipientId: string;
  recipientName: string;
  cardTitle: string;
  sentAt: string;
  status: 'sent' | 'delivered' | 'viewed';
};

type ReceivedCard = {
  _id: string;
  cardId: string;
  senderId: string;
  senderName: string;
  cardTitle: string;
  receivedAt: string;
  isViewed: boolean;
};

type Conversation = {
  id: string;
  userId: string;
  name: string;
  profilePicture?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline?: boolean;
};

export default function Chats() {
  console.log('🏠 Chats tab component rendered');
  const [activeTab, setActiveTab] = useState<'chats' | 'groups' | 'sent' | 'received'>('chats');
  // Read incoming deep-link/navigation params from notifications
  const params = useLocalSearchParams<{ tab?: string; highlightCardId?: string }>();
  const incomingTab = params?.tab as string | undefined;
  const incomingHighlightCardId = params?.highlightCardId as string | undefined;

  // Local highlight state (used to briefly highlight an item)
  const [highlightId, setHighlightId] = useState<string | undefined>(undefined);
  
  // Animation refs for highlight effect
  const highlightAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsSynced, setContactsSynced] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Socket.IO connection management
  const { isConnected, connect } = useChatSocket();
  console.log('🔌 Chats tab - Socket.IO isConnected:', isConnected);

  // Real conversation data (empty initially, will be populated when users actually chat)
  const [conversations, setConversations] = useState<Conversation[]>([]);
  
  // Groups data
  const [groups, setGroups] = useState<any[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
  const [joinGroupCode, setJoinGroupCode] = useState("");
  
  // Group sharing states
  const [showGroupSharingModal, setShowGroupSharingModal] = useState(false);
  const [groupSharingMode, setGroupSharingMode] = useState<'create' | 'join'>('create');
  const [showGroupConnection, setShowGroupConnection] = useState(false);
  const [currentGroupSession, setCurrentGroupSession] = useState<GroupSharingSession | null>(null);
  const [currentGroupCode, setCurrentGroupCode] = useState<string | null>(null);
  
  // Track currently active chat to prevent notifications
  const [currentActiveChat, setCurrentActiveChat] = useState<string | null>(null);
  
  // Track visited tabs for lazy loading performance
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['chats']));

  // Function definitions (moved before useEffect for proper hoisting)
  const loadConversations = async () => {
    try {
      // Get all stored message keys
      const keys = await AsyncStorage.getAllKeys();
      const messageKeys = keys.filter(key => key.startsWith('messages_'));
      
      const conversationData: Conversation[] = [];
      
      for (const key of messageKeys) {
        const userId = key.replace('messages_', '');
        const messagesData = await AsyncStorage.getItem(key);
        
        if (messagesData) {
          const messages = JSON.parse(messagesData);
          if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            
            // Try to get contact name from multiple sources
            let contactName = `Unknown`;
            let profilePicture: string | undefined;
            
            // 1. First check stored contact info in AsyncStorage
            const contactInfo = await AsyncStorage.getItem(`contact_${userId}`);
            if (contactInfo) {
              const contact = JSON.parse(contactInfo);
              contactName = contact.name || contactName;
              profilePicture = contact.profilePicture;
              console.log(`📇 Found contact in storage: ${contactName}`);
            } else {
              // 2. If not in storage, try to fetch from backend contacts
              try {
                console.log(`🔍 Looking up contact name for userId: ${userId}`);
                const contactsResponse = await api.get('/contacts/all');
                const contacts = contactsResponse.data || [];
                
                // Check if userId is a phone number (all digits)
                const isPhoneNumber = /^\d+$/.test(userId);
                
                // Find contact by appUserId (MongoDB ObjectId) OR phone number
                const matchedContact = contacts.find((c: any) => {
                  // appUserId is the MongoDB ObjectId from backend
                  const appUserId = c.appUserId?._id || c.appUserId;
                  const contactPhone = c.phoneNumber?.replace(/\D/g, '');
                  
                  if (isPhoneNumber) {
                    // If userId is phone number, match by phone
                    return contactPhone === userId;
                  } else {
                    // If userId is ObjectId, match by appUserId
                    return appUserId === userId || c._id === userId;
                  }
                });
                
                if (matchedContact) {
                  contactName = matchedContact.name || contactName;
                  profilePicture = matchedContact.profilePicture;
                  console.log(`✅ Found contact in backend: ${contactName}`);
                  
                  // Save to AsyncStorage for future use
                  await AsyncStorage.setItem(`contact_${userId}`, JSON.stringify({
                    name: contactName,
                    profilePicture: profilePicture
                  }));
                } else {
                  console.log(`⚠️ No contact match found for userId: ${userId}. Searched ${contacts.length} contacts`);
                  
                  // If it's a phone number and not found, format it nicely
                  if (isPhoneNumber && userId.length >= 10) {
                    // Format phone number: +91 98674 77227
                    const formatted = `+${userId.slice(0, 2)} ${userId.slice(2, 7)} ${userId.slice(7)}`;
                    contactName = formatted;
                  }
                }
              } catch (error) {
                console.log(`⚠️ Could not fetch contact info for ${userId}`);
                
                // Fallback: if userId looks like phone number, format it
                const isPhoneNumber = /^\d+$/.test(userId);
                if (isPhoneNumber && userId.length >= 10) {
                  const formatted = `+${userId.slice(0, 2)} ${userId.slice(2, 7)} ${userId.slice(7)}`;
                  contactName = formatted;
                }
              }
            }
            
            conversationData.push({
              id: userId,
              userId: userId,
              name: contactName,
              profilePicture: profilePicture,
              lastMessage: lastMessage.text,
              lastMessageTime: new Date(lastMessage.timestamp),
              unreadCount: 0,
              isOnline: false
            });
          }
        }
      }
      
      // Sort by last message time
      conversationData.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
      setConversations(conversationData);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const checkSyncStatus = async () => {
    try {
      const syncStatus = await AsyncStorage.getItem('contactsSynced');
      setContactsSynced(syncStatus === 'true');
    } catch (error) {
      console.error('Error checking sync status:', error);
    }
  };

  // Load conversations when component mounts
  useEffect(() => {
    loadConversations();
    checkSyncStatus();
    checkForAllPendingMessages(); // Check for new messages from all contacts
    
    // Set up periodic checking for new messages (every 30 seconds for reasonable performance)
    const messageCheckInterval = setInterval(() => {
      checkForAllPendingMessages();
      checkForGroupUpdates(); // Also check for group updates
    }, 30000); // Reduced frequency to 30 seconds
    
    return () => clearInterval(messageCheckInterval);
  }, []);

  // Handle incoming navigation params from notifications
  useEffect(() => {
    if (incomingTab) {
      changeTab(incomingTab as any); // Navigate to tab without animation
    }
    if (incomingHighlightCardId) {
      setHighlightId(incomingHighlightCardId);
      
      // Start highlight animation sequence
      highlightAnimation.setValue(0);
      pulseAnimation.setValue(1);
      
      Animated.sequence([
        // Fade in highlight
        Animated.timing(highlightAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        // Pulse effect (repeat 3 times)
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnimation, {
              toValue: 1.1,
              duration: 600,
              useNativeDriver: false,
            }),
            Animated.timing(pulseAnimation, {
              toValue: 1,
              duration: 600,
              useNativeDriver: false,
            }),
          ]),
          { iterations: 3 }
        ),
      ]).start();
      
      // Clear highlight after animation completes
      const t = setTimeout(() => {
        Animated.timing(highlightAnimation, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }).start(() => {
          setHighlightId(undefined);
        });
      }, 4000);
      
      return () => clearTimeout(t);
    }
  }, [incomingTab, incomingHighlightCardId]);

  // Group sharing handlers
  const handleCreateGroupSharing = () => {
    setGroupSharingMode('create');
    setShowGroupSharingModal(true);
  };

  const handleJoinGroupSharing = () => {
    setGroupSharingMode('join');
    setShowGroupSharingModal(true);
  };

  // Handle group sharing success
  const handleGroupSharingSuccess = (session: GroupSharingSession, code?: string) => {
    setCurrentGroupSession(session);
    setCurrentGroupCode(code || null);
    setShowGroupSharingModal(false);
    setShowGroupConnection(true);
  };

  // Handle group connection completion
  const handleGroupConnectionComplete = () => {
    setShowGroupConnection(false);
    setCurrentGroupSession(null);
    setCurrentGroupCode(null);
    
    // Navigate to My Cards for sharing
    router.push('/my-cards?mode=group-share' as any);
  };

  // Socket.IO connection management
  useEffect(() => {
    console.log('🔍 Chats tab: Connection status check:', { isConnected });
    if (!isConnected) {
      console.log('🔌 Chats tab: Attempting to connect Socket.IO...');
      connect().then(success => {
        console.log('🔌 Chats tab: Socket.IO connection result:', success);
      }).catch(error => {
        console.error('❌ Chats tab: Socket.IO connection error:', error);
      });
    } else {
      console.log('✅ Chats tab: Socket.IO already connected');
    }
  }, [isConnected, connect]);

  // Track when this screen becomes focused to refresh conversations
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Chats screen focused - refreshing conversations');
      loadConversations();
      loadGroups(); // Load groups when screen is focused
      return () => {
        console.log('🔄 Chats screen unfocused');
      };
    }, [])
  );

  // Check for new contact notifications
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const token = await ensureAuth();
        if (token) {
          const response = await api.get('/notifications?unreadOnly=true');
          if (response.data?.unreadCount > 0) {
            // Show notification badge or update UI
            console.log(`${response.data.unreadCount} unread notifications`);
          }
        }
      } catch (error) {
        // Silently handle errors
      }
    };

    if (contactsSynced) {
      checkNotifications();
    }
  }, [contactsSynced]);

  // Check for pending messages from all contacts
  const checkForAllPendingMessages = async () => {
    console.log('🔍 DEBUG: === Starting checkForAllPendingMessages ===');
    try {
      const token = await ensureAuth();
      console.log('🔍 DEBUG: Token from ensureAuth:', token ? 'Present' : 'Missing');
      
      if (token) {
        console.log('🔄 Checking for all pending messages...');
        console.log('🔍 DEBUG: Making API GET request to /messages/check-all-pending');
        
        const response = await api.get('/messages/check-all-pending');
        console.log('🔍 DEBUG: Raw API response:', JSON.stringify(response, null, 2));
        
        if (response?.messagesBySender && Array.isArray(response.messagesBySender) && response.messagesBySender.length > 0) {
          console.log('📥 Found pending messages from:', response.messagesBySender.length, 'contacts');
          
          // DON'T mark messages as delivered here - only when user actually opens the chat
          
          for (const senderData of response.messagesBySender) {
            console.log('🔍 DEBUG: Processing sender data:', JSON.stringify(senderData, null, 2));
            
            const { senderId, senderName, messages: newMessages } = senderData;
            
            if (!senderId || !senderName || !newMessages) {
              console.log('❌ Invalid sender data structure:', senderData);
              continue;
            }
            
            console.log(`🔍 Processing messages from ${senderName} (${senderId}):`, newMessages.length, 'messages');
            
            // Get existing messages for this conversation
            const existingMessagesData = await AsyncStorage.getItem(`messages_${senderId}`);
            let existingMessages = existingMessagesData ? JSON.parse(existingMessagesData) : [];
            console.log(`📁 Existing messages for ${senderId}:`, existingMessages.length);
            
            // Add new messages but DON'T mark as delivered yet
            let hasNewMessages = false;
            for (const messageData of newMessages) {
              console.log(`🔍 Checking message data:`, JSON.stringify(messageData, null, 2));
              
              if (!messageData.text || messageData.text.trim() === '') {
                console.log('❌ Empty message text, skipping:', messageData);
                continue;
              }
              
              const existingMessage = existingMessages.find((m: any) => 
                m.id === messageData.id || m.id === messageData.backendMessageId
              );
              
              if (!existingMessage) {
                const receivedMessage = {
                  id: messageData.id,
                  text: messageData.text.trim(), // Ensure we trim and preserve full text
                  timestamp: new Date(messageData.timestamp),
                  isFromMe: false,
                  status: 'received', // Change from 'delivered' to 'received' until user opens chat
                  backendMessageId: messageData.backendMessageId // Store backend ID for later marking as delivered
                };
                
                existingMessages.push(receivedMessage);
                hasNewMessages = true;
                console.log(`✅ Added new message from ${senderName}: "${messageData.text}"`);
              } else {
                console.log(`⏭️ Message already exists:`, messageData.id);
              }
            }
            
            if (hasNewMessages) {
              console.log(`📝 Saving ${existingMessages.length} messages for ${senderId}`);
              // Sort messages by timestamp
              existingMessages.sort((a: any, b: any) => 
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              );
              
              // Save updated messages
              await AsyncStorage.setItem(`messages_${senderId}`, JSON.stringify(existingMessages));
              console.log(`💾 Messages saved successfully for ${senderId}`);
              
              // Also save the contact info for this sender
              const contactInfo = {
                id: senderId,
                name: senderName,
                lastUpdated: new Date().toISOString()
              };
              await AsyncStorage.setItem(`contact_${senderId}`, JSON.stringify(contactInfo));
              console.log(`👤 Contact info saved for ${senderName}`);
              
              // Show notification for new messages (only if not currently in that chat)
              const lastMessage = newMessages[newMessages.length - 1];
              console.log(`🔔 Attempting to show notification for message: "${lastMessage.text}" from ${senderName}`);
              
              // Check if user is currently in this chat
              const currentActiveChat = await AsyncStorage.getItem('currentActiveChat');
              console.log(`🔔 Current active chat: ${currentActiveChat}, Message sender: ${senderId}`);
              
              // Only show notification if not currently viewing this chat
              if (currentActiveChat !== senderId) {
                try {
                  console.log('🔍 DEBUG: Calling showInAppNotification...');
                  await showInAppNotification(
                    `New message from ${senderName}`,
                    lastMessage.text,
                    () => {
                      console.log(`📱 User tapped notification, navigating to chat ${senderId}`);
                      router.push({
                        pathname: `/chat/[userId]`,
                        params: { 
                          userId: senderId,
                          name: senderName
                        }
                      });
                    }
                  );
                  console.log(`✅ Notification shown successfully for: "${lastMessage.text}"`);
                } catch (notificationError) {
                  console.error(`❌ Failed to show notification:`, notificationError);
                  console.error('🔍 DEBUG: Notification error details:', {
                    message: (notificationError as any).message,
                    stack: (notificationError as any).stack
                  });
                }
              } else {
                console.log(`🔕 Skipping notification - user is currently in chat with ${senderName}`);
              }
              
              // Mark messages as delivered on backend after processing
              try {
                const messageIds = newMessages.map((msg: any) => msg.id);
                await api.post('/messages/mark-delivered', {
                  messageIds: messageIds,
                  senderId: senderId
                });
                console.log(`✅ Marked ${messageIds.length} messages as delivered on backend`);
              } catch (deliveryError) {
                console.error('❌ Failed to mark messages as delivered on backend:', deliveryError);
              }
            } else {
              console.log(`⏭️ No new messages for ${senderName}`);
            }
          }
          
          // Refresh conversations to show new messages immediately
          console.log('🔍 DEBUG: Refreshing conversations after processing messages');
          await loadConversations();
          
          // Also trigger a state update to force UI refresh
          setRefreshing(false); // This ensures any pending refresh state is cleared
        } else {
          console.log('📭 No pending messages found in response');
          console.log('🔍 DEBUG: Response structure check:');
          console.log('  - response exists:', !!response);
          console.log('  - messagesBySender exists:', !!response?.messagesBySender);
          console.log('  - messagesBySender length:', response?.messagesBySender?.length || 0);
        }
      } else {
        console.log('❌ No valid token, skipping message check');
      }
    } catch (error) {
      console.error('💥 Error checking for pending messages:', error);
      console.error('🔍 DEBUG: Error details:', {
        message: (error as any).message,
        stack: (error as any).stack,
        status: (error as any).status,
        url: (error as any).url
      });
    }
    console.log('🔍 DEBUG: === Ending checkForAllPendingMessages ===');
  };

  // Check for new group messages and updates
  const checkForGroupUpdates = async () => {
    try {
      console.log('🔍 Checking for group updates...');
      
      // Get the list of groups
      const groupsListData = await AsyncStorage.getItem('groups_list');
      if (!groupsListData) return;

      const groupIds = JSON.parse(groupsListData);
      const currentUserId = await AsyncStorage.getItem('currentUserId') || 'current_user';
      
      for (const groupId of groupIds) {
        try {
          // For now, since this is local storage only, we'll just refresh the group data
          // In a real implementation, this would check a server for new messages
          
          // Get current active group chat to prevent notifications
          const currentActiveChat = await AsyncStorage.getItem('currentActiveChat');
          
          // Load group messages to check for updates since last check
          const messagesData = await AsyncStorage.getItem(`group_messages_${groupId}`);
          if (messagesData) {
            const messages = JSON.parse(messagesData);
            
            // Check if there are any recent messages (within last 5 seconds) that aren't from current user
            const fiveSecondsAgo = new Date(Date.now() - 5000);
            const recentMessages = messages.filter((msg: any) => 
              new Date(msg.timestamp) > fiveSecondsAgo && 
              msg.senderId !== currentUserId &&
              msg.type !== 'system'
            );
            
            if (recentMessages.length > 0 && currentActiveChat !== `group_${groupId}`) {
              // Show notification for new group messages
              const latestMessage = recentMessages[recentMessages.length - 1];
              const groupData = await AsyncStorage.getItem(`group_${groupId}`);
              
              if (groupData) {
                const group = JSON.parse(groupData);
                
                try {
                  await showInAppNotification(
                    `${group.name}`,
                    `${latestMessage.senderName}: ${latestMessage.text}`,
                    () => {
                      console.log(`📱 User tapped group notification, navigating to group ${groupId}`);
                      router.push(`/group-chat/${groupId}?name=${encodeURIComponent(group.name)}` as any);
                    }
                  );
                  console.log(`✅ Group notification shown for: "${latestMessage.text}" in ${group.name}`);
                } catch (notificationError) {
                  console.error(`❌ Failed to show group notification:`, notificationError);
                }
              }
            }
          }
        } catch (groupError) {
          console.error(`Error checking group ${groupId}:`, groupError);
        }
      }
      
      // Refresh groups list to update UI
      await loadGroups();
    } catch (error) {
      console.error('Error checking for group updates:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadConversations();
      console.log('🔄 Conversations refreshed');
    } catch (error) {
      console.error('Error refreshing conversations:', error);
    } finally {
      setRefreshing(false);
    }
  };
  const queryClient = useQueryClient();

  // Real horizontal sliding with ScrollView
  const scrollViewRef = useRef<ScrollView>(null);
  const screenWidth = Dimensions.get('window').width;
  const [currentPage, setCurrentPage] = useState(0);

  // Define tab order for proper page navigation
  const tabs = ['chats', 'groups', 'sent', 'received'] as const;

  // Proper tab change with real page scrolling
  const changeTab = useCallback((newTab: typeof activeTab) => {
    const newIndex = tabs.indexOf(newTab);
    setActiveTab(newTab);
    setCurrentPage(newIndex);
    
    // Track visited tabs for lazy loading
    setVisitedTabs(prev => new Set([...prev, newTab]));
    
    // Scroll to the correct page
    scrollViewRef.current?.scrollTo({
      x: newIndex * screenWidth,
      animated: true
    });
  }, [tabs, screenWidth]);

  // Handle scroll events to update active tab
  const handleScroll = useCallback((event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / screenWidth);
    
    if (page !== currentPage && page >= 0 && page < tabs.length) {
      setCurrentPage(page);
      setActiveTab(tabs[page]);
      setVisitedTabs(prev => new Set([...prev, tabs[page]]));
    }
  }, [screenWidth, currentPage, tabs]);
  
  // Helper function to format time
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);
    const minutes = diff / (1000 * 60);
    
    if (minutes < 1) {
      return 'now';
    } else if (hours < 1) {
      return `${Math.floor(minutes)}m`;
    } else if (hours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      const days = Math.floor(hours / 24);
      if (days === 1) {
        return 'yesterday';
      } else if (days < 7) {
        return `${days}d`;
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    }
  };

  // Render individual conversation item
  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity 
      style={s.conversationItem}
      onPress={() => router.push({
        pathname: `/chat/[userId]`,
        params: { 
          userId: item.userId,
          name: item.name
        }
      })}
    >
      <View style={s.conversationAvatar}>
        {item.profilePicture ? (
          <Image source={{ uri: item.profilePicture }} style={s.conversationAvatarImage} />
        ) : (
          <Text style={s.conversationAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        )}
        {item.isOnline && <View style={s.onlineIndicator} />}
      </View>

      <View style={s.conversationInfo}>
        <View style={s.conversationHeader}>
          <Text style={s.conversationName}>{item.name}</Text>
          <Text style={s.conversationTime}>{formatTime(item.lastMessageTime)}</Text>
        </View>
        <View style={s.conversationFooter}>
          <Text 
            style={[
              s.conversationMessage,
              item.unreadCount > 0 && s.unreadMessage
            ]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View style={s.unreadBadge}>
              <Text style={s.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Check if contacts were previously synced
  useEffect(() => {
    const checkSyncStatus = async () => {
      try {
        const syncTimestamp = await AsyncStorage.getItem('contactsSyncTimestamp');
        
        if (syncTimestamp) {
          setContactsSynced(true);
          const lastSyncDate = new Date(parseInt(syncTimestamp));
          console.log(`✅ Contacts synced on ${lastSyncDate.toLocaleString()}`);
        } else {
          setContactsSynced(false);
        }
      } catch (error) {
        console.error('Error checking sync status:', error);
        setContactsSynced(false);
      }
    };
    
    checkSyncStatus();
  }, []);

  // Fetch sent cards
  const sentCardsQuery = useQuery({
    queryKey: ["sent-cards"],
    queryFn: async () => {
      try {
        const token = await ensureAuth();
        if (!token) return [];
        
        const response = await api.get("/cards/sent");
        return response.data || [];
      } catch (error) {
        console.error("Error fetching sent cards:", error);
        return [];
      }
    },
  });

  // Fetch received cards
  const receivedCardsQuery = useQuery({
    queryKey: ["received-cards"],
    queryFn: async () => {
      try {
        const token = await ensureAuth();
        if (!token) return [];
        
        const response = await api.get("/cards/received");
        return response.data || [];
      } catch (error) {
        console.error("Error fetching received cards:", error);
        return [];
      }
    },
  });

  const requestContactsPermission = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      return false;
    }
  };

  const syncContacts = async () => {
    setContactsLoading(true);
    try {
      const hasPermission = await requestContactsPermission();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Please grant contacts permission to sync your contacts.');
        setContactsLoading(false);
        return;
      }

      // Get device contacts
      const { data: deviceContacts } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });
      
      // Extract phone numbers with proper typing
      const phoneNumbers = deviceContacts
        .filter((contact: any) => contact.phoneNumbers && contact.phoneNumbers.length > 0)
        .map((contact: any) => ({
          name: contact.name || 'Unknown Contact',
          phoneNumber: contact.phoneNumbers[0]?.number?.replace(/\D/g, '') || ''
        }))
        .filter((contact: any) => contact.phoneNumber && contact.phoneNumber.length >= 10);

      // Send to backend to sync and store all contacts
      const token = await ensureAuth();
      if (token) {
        console.log(`Syncing ${phoneNumbers.length} contacts to backend...`);
        await api.post("/contacts/sync-all", { contacts: phoneNumbers });
        setContactsSynced(true);
        
        // Save sync timestamp to AsyncStorage
        try {
          const timestamp = Date.now().toString();
          await AsyncStorage.setItem('contactsSyncTimestamp', timestamp);
          await AsyncStorage.setItem('contactsSynced', 'true'); // Keep for backward compatibility
          console.log('✅ Contacts synced successfully - timestamp saved');
        } catch (storageError) {
          console.error('Error saving sync status:', storageError);
        }
        
        queryClient.invalidateQueries({ queryKey: ["app-contacts"] });
        queryClient.invalidateQueries({ queryKey: ["stored-contacts"] });
        console.log('✅ Contacts sync complete');
      }
    } catch (error) {
      console.error('Error syncing contacts:', error);
    } finally {
      setContactsLoading(false);
    }
  };

  // Helper function to handle phone calls - uses local contact data to avoid API calls
  const handleCall = async (item: SentCard | ReceivedCard, isSentCard: boolean) => {
    try {
      // For sent cards, we need recipient's phone
      // For received cards, we need sender's phone  
      const userName = isSentCard ? (item as SentCard).recipientName : (item as ReceivedCard).senderName;
      const userId = isSentCard ? (item as SentCard).recipientId : (item as ReceivedCard).senderId;
      
      console.log(`📞 Attempting to call ${isSentCard ? 'recipient' : 'sender'}: ${userName} (${userId})`);
      
      // First, try to find the contact in our local conversations data
      const contact = conversations.find(conv => conv.userId === userId);
      
      let phoneNumber = '';
      
      if (contact && (contact as any).phone) {
        phoneNumber = (contact as any).phone;
        console.log(`📱 Found phone in conversations: ${phoneNumber}`);
      } else {
        // If not in conversations, try to fetch from contacts API
        try {
          const response = await api.get(`/contacts/all?limit=1000`);
          const contacts = response.data || [];
          
          // Find contact by userId
          const foundContact = contacts.find((c: any) => 
            c.appUserId === userId || 
            c.appUserId?._id === userId ||
            c.userId === userId
          );
          
          if (foundContact) {
            phoneNumber = foundContact.phoneNumber || foundContact.phone;
            console.log(`📱 Found phone in contacts: ${phoneNumber}`);
          }
        } catch (error) {
          console.error('Error fetching contacts:', error);
        }
      }
      
      console.log(`📞 Retrieved phone number: ${phoneNumber ? phoneNumber : 'Not found'}`);
      
      if (phoneNumber) {
        // Clean phone number and ensure it has proper format with + prefix
        let cleanPhone = phoneNumber.replace(/[\s-()]/g, '');
        
        // Add + prefix if not present
        if (!cleanPhone.startsWith('+')) {
          cleanPhone = '+' + cleanPhone;
        }
        
        const telUrl = `tel:${cleanPhone}`;
        console.log(`📞 Trying to open tel URL: ${telUrl}`);
        
        try {
          // Try to open the dialer directly
          await Linking.openURL(telUrl);
          console.log(`✅ Opened dialer with: ${cleanPhone}`);
        } catch (error) {
          console.error('❌ Error opening dialer:', error);
          Alert.alert(
            'Unable to Make Call',
            'Cannot open the phone dialer. This may be due to device restrictions or emulator limitations.',
            [
              { text: 'OK', style: 'cancel' },
              {
                text: 'Copy Number',
                onPress: () => {
                  // You could use Clipboard API here if needed
                  Alert.alert('Phone Number', cleanPhone);
                }
              }
            ]
          );
        }
      } else {
        console.warn(`⚠️ No phone number found for: ${userName}`);
        Alert.alert(
          'Phone Number Unavailable', 
          `Cannot find phone number for ${userName}. Would you like to send a message instead?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Message', 
              onPress: () => {
                router.push({ 
                  pathname: `/chat/[userId]`, 
                  params: { userId, userName } 
                } as any);
              }
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('❌ Error getting phone number for call:', error);
      
      // Fallback: Offer to message instead
      const item2 = item as any;
      const userId = item2.recipientId || item2.senderId;
      const userName = item2.recipientName || item2.senderName;
      
      Alert.alert(
        'Phone Number Unavailable', 
        'Unable to retrieve phone number. Would you like to send a message instead?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Message', 
            onPress: () => {
              router.push({ 
                pathname: `/chat/[userId]`, 
                params: { userId, userName } 
              } as any);
            }
          }
        ]
      );
    }
  };

  // Optional: Function to reset sync status (useful for debugging)
  const resetSyncStatus = async () => {
    try {
      await AsyncStorage.removeItem('contactsSynced');
      setContactsSynced(false);
      Alert.alert('Reset Complete', 'Contact sync status has been reset.');
    } catch (error) {
      console.error('Error resetting sync status:', error);
      Alert.alert('Error', 'Failed to reset sync status.');
    }
  };

  const renderSentCard = useCallback(({ item }: { item: SentCard }) => (
    <TouchableOpacity
      onPress={() => {
        router.push({ pathname: `/(main)/card/[id]`, params: { id: item.cardId } } as any);
      }}
    >
      <Animated.View
        style={[
          s.cardItem, 
          (incomingHighlightCardId === item._id || incomingHighlightCardId === item.cardId || highlightId === item._id) && {
            backgroundColor: highlightAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: ['#FFFFFF', '#FFE4B5']
            }),
            borderColor: '#FF6B35',
            borderWidth: 2,
            transform: [{
              scale: pulseAnimation
            }],
            opacity: highlightAnimation.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [1, 0.8, 1]
            })
          }
        ]}
      >
      {(item as any).cardPhoto || (item as any).recipientProfilePicture ? (
        <Image source={{ uri: (item as any).cardPhoto || (item as any).recipientProfilePicture }} style={s.cardLogo} />
      ) : (
        <View style={[s.cardLogo, s.avatarPlaceholder]}>
          <Text style={s.avatarText}>{item.recipientName?.charAt(0).toUpperCase() || 'U'}</Text>
        </View>
      )}

      <View style={s.cardInfo}>
        <View style={s.cardTitleRow}>
          <Text style={s.cardTitlePrefix}>To - </Text>
          <Text style={s.cardTitleBold} numberOfLines={1} ellipsizeMode="tail">{item.recipientName}</Text>
        </View>
        <Text style={s.cardSubtitle} numberOfLines={1} ellipsizeMode="tail">{item.cardTitle}</Text>
      </View>

      <View style={s.actionButtons}>
        <TouchableOpacity style={s.iconButton} onPress={() => {
          handleCall(item, true); // true = sent card
        }}>
          <Ionicons name="call" size={20} color="#0EA5A4" />
        </TouchableOpacity>

        <TouchableOpacity style={s.iconButton} onPress={() => {
          router.push({ pathname: `/chat/[userId]`, params: { userId: item.recipientId, userName: item.recipientName } } as any);
        }}>
          <Ionicons name="chatbubbles" size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>
      </Animated.View>
    </TouchableOpacity>
  ), [handleCall]);

  const renderReceivedCard = useCallback(({ item }: { item: ReceivedCard }) => (
    <TouchableOpacity
      onPress={async () => {
        router.push({ pathname: `/(main)/card/[id]`, params: { id: item.cardId } } as any);
        if (!item.isViewed) {
          try {
            await api.post(`/cards/shared/${item._id}/view`);
            queryClient.invalidateQueries({ queryKey: ["received-cards"] });
          } catch (error) {
            console.error('Failed to mark card as viewed:', error);
          }
        }
      }}
    >
      <Animated.View
        style={[
          s.cardItem,
          !item.isViewed && s.unseenCard,
          (incomingHighlightCardId === item._id || incomingHighlightCardId === item.cardId || highlightId === item._id) && {
            backgroundColor: highlightAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: ['#FFFFFF', '#FFE4B5']
            }),
            borderColor: '#FF6B35',
            borderWidth: 2,
            transform: [{
              scale: pulseAnimation
            }],
            opacity: highlightAnimation.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [1, 0.8, 1]
            })
          }
        ]}
      >
      {(item as any).senderProfilePicture || (item as any).senderAvatar ? (
        <Image source={{ uri: (item as any).senderProfilePicture || (item as any).senderAvatar }} style={s.cardLogo} />
      ) : (
        <View style={[s.cardLogo, s.avatarPlaceholder]}>
          <Text style={s.avatarText}>{item.senderName?.charAt(0).toUpperCase() || 'U'}</Text>
        </View>
      )}

      <View style={s.cardInfo}>
        <View style={s.cardTitleRow}>
          <Text style={s.cardTitlePrefix}>From - </Text>
          <Text style={s.cardTitleBold} numberOfLines={1} ellipsizeMode="tail">{item.senderName}</Text>
        </View>
        <Text style={s.cardSubtitle} numberOfLines={1} ellipsizeMode="tail">{item.cardTitle}</Text>
        {!item.isViewed && <Text style={s.newBadge}>NEW</Text>}
      </View>

      <View style={s.actionButtons}>
        <TouchableOpacity style={s.iconButton} onPress={() => {
          handleCall(item, false); // false = received card
        }}>
          <Ionicons name="call" size={20} color="#0EA5A4" />
        </TouchableOpacity>

        <TouchableOpacity style={s.iconButton} onPress={() => {
          router.push({ pathname: `/chat/[userId]`, params: { userId: item.senderId, userName: item.senderName } } as any);
        }}>
          <Ionicons name="chatbubbles" size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>
      </Animated.View>
    </TouchableOpacity>
  ), [handleCall]);

  // Load groups from backend API instead of AsyncStorage
  const loadGroups = async () => {
    try {
      setGroupsLoading(true);
      console.log('🔄 Loading groups from backend...');
      
      // Fetch groups from backend API
      const response = await api.get('/groups');
      
      if (response && response.success && response.groups) {
        const currentUserId = await getCurrentUserId();
        
        const backendGroups = response.groups.map((group: any) => ({
          id: group._id,
          name: group.name,
          description: group.description || '',
          icon: group.icon || '',
          members: group.members || [],
          admin: group.admin,
          memberCount: group.members ? group.members.length : 0,
          lastMessage: `${group.members ? group.members.length : 0} members`,
          timestamp: group.updatedAt || group.createdAt,
          unreadCount: 0,
          inviteCode: group.inviteCode,
          isAdmin: group.admin._id ? (group.admin._id === currentUserId) : false
        }));
        
        console.log(`✅ Loaded ${backendGroups.length} groups from backend`);
        setGroups(backendGroups);
        setGroupsLoading(false);
      } else {
        console.log('📭 No groups found in backend response');
        setGroups([]);
        setGroupsLoading(false);
      }
    } catch (error) {
      console.error('❌ Failed to load groups from backend:', error);
      
      // Fallback to local storage for existing groups
      try {
        console.log('🔄 Falling back to local storage...');
        const userData = await getCurrentUser();
        if (!userData) {
          setGroups([]);
          return;
        }

        const currentUserId = userData.id || userData._id;
        if (!currentUserId) {
          setGroups([]);
          return;
        }

        // Get the list of group IDs for the current user
        const userGroupsStr = await AsyncStorage.getItem(`user_groups_${currentUserId}`);
        if (!userGroupsStr) {
          setGroups([]);
          return;
        }

        const groupIds = JSON.parse(userGroupsStr);
        const loadedGroups = [];

        for (const groupId of groupIds) {
          // Load group info
          const groupData = await AsyncStorage.getItem(`group_${groupId}`);
          if (groupData) {
            const group = JSON.parse(groupData);
            
            // Check if current user is still a member
            if (!group.members.includes(currentUserId)) {
              // User has left this group, skip it or show with "You left" status
              continue;
            }
            
            // Load latest message for this group
            const messagesData = await AsyncStorage.getItem(`group_messages_${groupId}`);
            let lastMessage = '';
            let lastMessageTime = '';
            
            if (messagesData) {
              const messages = JSON.parse(messagesData);
              if (messages.length > 0) {
                const latestMessage = messages[messages.length - 1];
                if (latestMessage.type === 'system') {
                  lastMessage = latestMessage.text;
                } else {
                  const senderName = latestMessage.senderId === currentUserId ? 'You' : latestMessage.senderName;
                  lastMessage = `${senderName}: ${latestMessage.text}`;
                }
                lastMessageTime = latestMessage.timestamp;
              }
            }

            // Count members
            const memberCount = group.members.length;
            
            loadedGroups.push({
              id: group.id,
              name: group.name,
              description: group.description,
              icon: group.icon,
              members: group.members,
              memberCount,
              isAdmin: group.admin === currentUserId,
              lastMessage: lastMessage || `${memberCount} member${memberCount === 1 ? '' : 's'}`,
              lastMessageTime: lastMessageTime,
              createdAt: group.createdAt,
            });
          }
        }

        // Sort groups by last message time (most recent first)
        loadedGroups.sort((a, b) => {
          if (!a.lastMessageTime) return 1;
          if (!b.lastMessageTime) return -1;
          return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
        });

        setGroups(loadedGroups);
        console.log('📱 Loaded groups from local storage:', loadedGroups.length, 'groups for user', currentUserId);
        setGroupsLoading(false);
      } catch (localError) {
        console.error('❌ Failed to load groups from local storage:', localError);
        setGroups([]);
        setGroupsLoading(false);
      }
    }
  };

  // Check if user has left a group
  const checkIfUserLeftGroup = async (groupId: string) => {
    try {
      const currentUserId = await AsyncStorage.getItem('currentUserId') || 'current_user';
      const groupData = await AsyncStorage.getItem(`group_${groupId}`);
      
      if (groupData) {
        const group = JSON.parse(groupData);
        return !group.members.includes(currentUserId);
      }
      
      return false;
    } catch (error) {
      console.error('Error checking if user left group:', error);
      return false;
    }
  };

  // Clean up all groups (for testing)
  const clearAllGroups = async () => {
    Alert.alert(
      'Clear All Groups',
      'This will remove all groups from your device and backend. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🧹 Starting cleanup process...');
              
              // Clear all group-related data from AsyncStorage
              const keys = await AsyncStorage.getAllKeys();
              const groupKeys = keys.filter(key => 
                key.startsWith('group_') || 
                key.startsWith('groups') || 
                key.startsWith('user_groups_') ||
                key.startsWith('group_messages_')
              );
              
              if (groupKeys.length > 0) {
                await AsyncStorage.multiRemove(groupKeys);
                console.log(`🗑️ Cleared ${groupKeys.length} local storage keys`);
              }
              
              // Clear all groups from backend
              try {
                const response = await api.del('/groups');
                if (response && response.success) {
                  console.log('✅ All groups cleared from backend');
                }
              } catch (apiError) {
                console.error('❌ Failed to clear backend groups:', apiError);
              }
              
              // Refresh the groups list
              setGroups([]);
              
              Alert.alert('Success', 'All groups have been cleared successfully!');
              console.log('✅ Cleanup completed successfully!');
            } catch (error) {
              console.error('❌ Cleanup failed:', error);
              Alert.alert('Error', 'Failed to clear all groups');
            }
          }
        }
      ]
    );
  };

  // Delete group from local storage
  const deleteGroup = async (groupId: string, groupName: string) => {
    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete "${groupName}" from your chat list? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Use backend API to leave group
              await api.del(`/groups/${groupId}`);
              
              // Refresh groups list
              await loadGroups();
              
              Alert.alert('Success', 'You have left the group.');
            } catch (error) {
              console.error('Error leaving group:', error);
              Alert.alert('Error', 'Failed to leave group. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Render group item
  const renderGroupItem = ({ item }: { item: any }) => {
    const formatTime = (timestamp: string) => {
      if (!timestamp) return '';
      
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        // Today - show time
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (diffDays === 1) {
        // Yesterday
        return 'Yesterday';
      } else if (diffDays < 7) {
        // This week - show day name
        return date.toLocaleDateString([], { weekday: 'short' });
      } else {
        // Older - show date
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    };

    // Check if this group shows "You left the group" message
    const hasLeftGroup = item.lastMessage === 'You left the group';

    return (
      <TouchableOpacity
        style={s.conversationItem}
        onPress={() => {
          if (!hasLeftGroup) {
            router.push(`/group-chat/${item.id}?name=${encodeURIComponent(item.name)}` as any);
          }
        }}
      >
        <View style={s.conversationAvatar}>
          {item.icon ? (
            <Image source={{ uri: item.icon }} style={s.conversationAvatarImage} />
          ) : (
            <View style={s.groupAvatarPlaceholder}>
              <Ionicons name="people" size={20} color="#FFFFFF" />
            </View>
          )}
        </View>
        
        <View style={s.conversationInfo}>
          <Text style={s.conversationName}>{item.name}</Text>
          <Text style={[s.conversationMessage, hasLeftGroup && s.leftGroupMessage]} numberOfLines={1}>
            {item.lastMessage || `${item.members?.length || 0} members`}
          </Text>
        </View>
        
        <View style={s.conversationTime}>
          <Text style={s.timeText}>
            {formatTime(item.lastMessageTime)}
          </Text>
          {hasLeftGroup ? (
            <TouchableOpacity
              style={s.groupOptionsButton}
              onPress={() => {
                Alert.alert(
                  'Group Options',
                  `What would you like to do with "${item.name}"?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => deleteGroup(item.id, item.name),
                    },
                  ]
                );
              }}
            >
              <Ionicons name="ellipsis-vertical" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : (
            item.unreadCount > 0 && (
              <View style={s.unreadBadge}>
                <Text style={s.unreadText}>{item.unreadCount}</Text>
              </View>
            )
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Join group by code
  const joinGroupByCode = async () => {
    if (!joinGroupCode.trim()) {
      Alert.alert('Error', 'Please enter a group code');
      return;
    }

    if (joinGroupCode.length !== 6) {
      Alert.alert('Error', 'Group code must be 6 digits');
      return;
    }

    try {
      // Join group via API
      const data = await api.post('/groups/join', {
        joinCode: joinGroupCode.trim(),
      });

      setShowJoinGroupModal(false);
      setJoinGroupCode('');
      Alert.alert('Success', `You have successfully joined "${data.group.name}"!`);
      
      // Refresh groups list (you might want to implement a refresh mechanism)
      // For now, we'll just reload the groups

    } catch (error) {
      console.error('Error joining group:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to join group. Please try again.');
    }
  };

  const renderContent = useMemo(() => {
    // Always render all tabs for proper horizontal scrolling
    return null; // This will be replaced by individual page components
  }, []);

  // Individual page components for proper horizontal scrolling
  const renderChatsPage = useMemo(() => (
    <View style={[s.page, { width: screenWidth }]}>
      {!contactsSynced ? (
        <View style={s.syncContainer}>
          <Text style={s.syncTitle}>Sync Your Contacts</Text>
          <Text style={s.syncSubtitle}>
            Find friends and colleagues who are already using InstantllyCards
          </Text>
          <TouchableOpacity 
            style={s.syncButton} 
            onPress={syncContacts}
            disabled={contactsLoading}
          >
            {contactsLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={s.syncButtonText}>Sync Contacts</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={s.searchContainer}>
            <TextInput
              style={s.searchInput}
              placeholder="Search conversations..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          
          <FlatList
            data={filteredConversations}
            keyExtractor={(item) => item.id}
            renderItem={renderConversationItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.conversationsList}
            refreshing={refreshing}
            onRefresh={onRefresh}
            removeClippedSubviews={true}
            maxToRenderPerBatch={5}
            updateCellsBatchingPeriod={100}
            initialNumToRender={5}
            windowSize={5}
            disableIntervalMomentum={true}
            decelerationRate="fast"
            getItemLayout={(_, index) => ({
              length: 80,
              offset: 80 * index,
              index,
            })}
            ListEmptyComponent={
              <View style={s.emptyState}>
                <Text style={s.emptyText}>No conversations yet</Text>
                <Text style={s.emptySubtext}>Start a conversation by selecting a contact</Text>
              </View>
            }
          />
        </>
      )}
    </View>
  ), [screenWidth, contactsSynced, contactsLoading, searchQuery, filteredConversations, refreshing]);

  const renderGroupsPage = useMemo(() => (
    <View style={[s.page, { width: screenWidth }]}>
      {groupsLoading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={s.loadingText}>Loading groups...</Text>
        </View>
      ) : groups.length === 0 ? (
        <View style={s.emptyState}>
          <Text style={s.emptyText}>No groups yet</Text>
          <Text style={s.emptySubtext}>Create or join a group to start chatting</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroupItem}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={100}
          initialNumToRender={4}
          windowSize={5}
          disableIntervalMomentum={true}
          decelerationRate="fast"
        />
      )}
    </View>
  ), [screenWidth, groupsLoading, groups, refreshing]);

  const renderSentPage = useMemo(() => {
    const sent = sentCardsQuery.data || [];
    const priorityOrder = { sent: 0, delivered: 1, viewed: 2 } as any;
    const ordered = [...sent].sort((a: SentCard, b: SentCard) => (priorityOrder[a.status] || 3) - (priorityOrder[b.status] || 3));

    return (
      <View style={[s.page, { width: screenWidth }]}>
        <FlatList
          data={ordered}
          keyExtractor={(item) => item._id}
          renderItem={renderSentCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 4 }}
          removeClippedSubviews={true}
          maxToRenderPerBatch={4}
          updateCellsBatchingPeriod={100}
          initialNumToRender={3}
          windowSize={4}
          disableIntervalMomentum={true}
          decelerationRate="fast"
          getItemLayout={(data, index) => ({
            length: 240,
            offset: 240 * index,
            index,
          })}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Text style={s.emptyText}>No cards sent yet</Text>
              <Text style={s.emptySubtext}>Share your business cards with contacts</Text>
            </View>
          }
        />
      </View>
    );
  }, [screenWidth, sentCardsQuery.data]);

  const renderReceivedPage = useMemo(() => {
    const received = receivedCardsQuery.data || [];
    const ordered = [...received].sort((a: ReceivedCard, b: ReceivedCard) => 
      (a.isViewed === b.isViewed) ? 
        new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime() : 
        (a.isViewed ? 1 : -1)
    );

    return (
      <View style={[s.page, { width: screenWidth }]}>
        <FlatList
          data={ordered}
          keyExtractor={(item) => item._id}
          renderItem={renderReceivedCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 4 }}
          removeClippedSubviews={true}
          maxToRenderPerBatch={4}
          updateCellsBatchingPeriod={100}
          initialNumToRender={3}
          windowSize={4}
          disableIntervalMomentum={true}
          decelerationRate="fast"
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Text style={s.emptyText}>No cards received yet</Text>
              <Text style={s.emptySubtext}>Cards shared with you will appear here</Text>
            </View>
          }
        />
      </View>
    );
  }, [screenWidth, receivedCardsQuery.data]);

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Messages</Text>
      </View>

      {/* Tab Navigation */}
      <View style={s.tabContainer}>
        <TouchableOpacity
          style={[s.tab, activeTab === 'chats' && s.activeTab]}
          onPress={() => changeTab('chats')}
        >
          <Text style={[s.tabText, activeTab === 'chats' && s.activeTabText]}>Chats</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[s.tab, activeTab === 'groups' && s.activeTab]}
          onPress={() => changeTab('groups')}
        >
          <Text style={[s.tabText, activeTab === 'groups' && s.activeTabText]}>Groups</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[s.tab, activeTab === 'sent' && s.activeTab]}
          onPress={() => changeTab('sent')}
        >
          <Text style={[s.tabText, activeTab === 'sent' && s.activeTabText]}>Sent</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[s.tab, activeTab === 'received' && s.activeTab]}
          onPress={() => changeTab('received')}
        >
          <Text style={[s.tabText, activeTab === 'received' && s.activeTabText]}>Received</Text>
        </TouchableOpacity>
      </View>

      {/* Real Horizontal Sliding Pages */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {renderChatsPage}
        {renderGroupsPage}
        {renderSentPage}
        {renderReceivedPage}
      </ScrollView>

      {/* Floating Action Button for Contact Selection - Only show for chats tab */}
      {contactsSynced && activeTab === 'chats' && <ContactsFAB />}
      
      {/* Floating Action Button for Groups - Only show for groups tab */}
      {activeTab === 'groups' && (
        <GroupsFAB 
          onCreateGroup={() => {
            // Navigate to contact selection for group creation
            router.push("/contacts/select?mode=group" as any);
          }}
          onJoinGroup={() => {
            setShowJoinGroupModal(true);
          }}
          onClearAll={clearAllGroups}
          onCreateGroupSharing={handleCreateGroupSharing}
          onJoinGroupSharing={handleJoinGroupSharing}
        />
      )}

      {/* Join Group Modal */}
      <Modal
        visible={showJoinGroupModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowJoinGroupModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Join Group Via Code</Text>
            <Text style={s.modalSubtitle}>Enter the group code to join</Text>
            
            <TextInput
              style={s.modalInput}
              placeholder="Enter group code"
              value={joinGroupCode}
              onChangeText={setJoinGroupCode}
              autoCapitalize="characters"
            />
            
            <View style={s.modalButtons}>
              <TouchableOpacity
                style={[s.modalButton, s.modalButtonSecondary]}
                onPress={() => setShowJoinGroupModal(false)}
              >
                <Text style={s.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[s.modalButton, s.modalButtonPrimary]}
                onPress={joinGroupByCode}
              >
                <Text style={s.modalButtonTextPrimary}>Join Group</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Group Sharing Modal */}
      <GroupSharingModal
        visible={showGroupSharingModal}
        mode={groupSharingMode}
        onClose={() => setShowGroupSharingModal(false)}
        onSuccess={handleGroupSharingSuccess}
      />

      {/* Group Connection UI */}
      {showGroupConnection && currentGroupSession && (
        <GroupConnectionUI
          visible={showGroupConnection}
          session={currentGroupSession}
          isAdmin={currentGroupSession.adminId === 'current_user'} // TODO: Use actual user ID
          onClose={() => setShowGroupConnection(false)}
          onConnect={handleGroupConnectionComplete}
        />
      )}

      {/* Footer Carousel */}
      <FooterCarousel />
    </SafeAreaView>
  );
}

// FAB Component for Contact Selection
function ContactsFAB() {
  const tabH = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const SIZE = 56;
  const GAP = 10;
  const FOOTER_CAROUSEL_HEIGHT = 100;

  // Position FAB above footer carousel with consistent spacing
  const bottom = FOOTER_CAROUSEL_HEIGHT + 16;

  return (
    <Pressable
      onPress={() => router.push("/contacts/select" as any)}
      style={[fabStyles.fab, { right: 18, bottom, width: SIZE, height: SIZE, borderRadius: SIZE / 2 }]}
      accessibilityRole="button"
      accessibilityLabel="Select contacts"
    >
      <Text style={fabStyles.fabIcon}>+</Text>
    </Pressable>
  );
}

  // FAB Component for Groups
function GroupsFAB({ 
  onCreateGroup, 
  onJoinGroup, 
  onClearAll,
  onCreateGroupSharing,
  onJoinGroupSharing
}: { 
  onCreateGroup: () => void; 
  onJoinGroup: () => void; 
  onClearAll: () => void;
  onCreateGroupSharing: () => void;
  onJoinGroupSharing: () => void;
}) {
  const tabH = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const SIZE = 56;
  const GAP = 10;
  const FOOTER_CAROUSEL_HEIGHT = 100;
  const [showMenu, setShowMenu] = useState(false);

  // Position FAB above footer carousel with consistent spacing
  const bottom = FOOTER_CAROUSEL_HEIGHT + 16;

  return (
    <>
      {/* Menu Options */}
      {showMenu && (
        <View style={[fabStyles.menuContainer, { bottom: bottom + SIZE + 10 }]}>
          <TouchableOpacity 
            style={fabStyles.menuItem}
            onPress={() => {
              setShowMenu(false);
              onCreateGroupSharing();
            }}
          >
            <Text style={fabStyles.menuText}>Create Group Sharing</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={fabStyles.menuItem}
            onPress={() => {
              setShowMenu(false);
              onJoinGroupSharing();
            }}
          >
            <Text style={fabStyles.menuText}>Join Group Sharing</Text>
          </TouchableOpacity>

          <View style={fabStyles.menuDivider} />
          
          <TouchableOpacity 
            style={fabStyles.menuItem}
            onPress={() => {
              setShowMenu(false);
              onCreateGroup();
            }}
          >
            <Text style={fabStyles.menuText}>Create Group Chat</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={fabStyles.menuItem}
            onPress={() => {
              setShowMenu(false);
              onJoinGroup();
            }}
          >
            <Text style={fabStyles.menuText}>Join Group Chat Via Code</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[fabStyles.menuItem, { backgroundColor: '#FF4444', borderBottomWidth: 0 }]}
            onPress={() => {
              setShowMenu(false);
              onClearAll();
            }}
          >
            <Text style={[fabStyles.menuText, { color: '#FFFFFF' }]}>Clear All Groups</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Overlay to close menu */}
      {showMenu && (
        <Pressable 
          style={fabStyles.overlay} 
          onPress={() => setShowMenu(false)} 
        />
      )}
      
      {/* FAB Button */}
      <Pressable
        onPress={() => setShowMenu(!showMenu)}
        style={[fabStyles.fab, { right: 18, bottom, width: SIZE, height: SIZE, borderRadius: SIZE / 2 }]}
        accessibilityRole="button"
        accessibilityLabel="Group options"
      >
        <Text style={fabStyles.fabIcon}>+</Text>
      </Pressable>
    </>
  );
}const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F4F6FA",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#3B82F6",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  activeTabText: {
    color: "#3B82F6",
    fontWeight: "600",
  },
  page: {
    flex: 1,
    padding: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  syncContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  syncTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  syncSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  syncButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  syncButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: "#6B7280",
  },
  contactMeta: {
    alignItems: "flex-end",
  },
  messageTime: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: "#22C55E",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  unreadText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  cardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginVertical: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unseenCard: {
    backgroundColor: "#EFF6FF",
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardIconText: {
    fontSize: 20,
  },
  cardLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6366F1',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitlePrefix: {
    fontSize: 16,
    fontWeight: "400",
    color: "#6B7280",
  },
  cardTitleBold: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },
  cardMeta: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  newBadge: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: 'row',
    flex: 1,
    marginLeft: 12,
    gap: 8,
  },
  iconButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightCard: {
    borderColor: '#FBBF24',
    borderWidth: 2,
    shadowColor: '#FBBF24',
    shadowOpacity: 0.2,
  },
  cardTime: {
    alignItems: "flex-end",
  },
  timeText: {
    fontSize: 10,
    color: "#9CA3AF",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 16,
    textAlign: "center",
  },
  conversationsList: {
    paddingVertical: 8,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  conversationAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4B5563",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    position: "relative",
  },
  conversationAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  conversationAvatarText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  groupAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4B5563",
    justifyContent: "center",
    alignItems: "center",
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22C55E",
    position: "absolute",
    bottom: 1,
    right: 1,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  conversationTime: {
    alignItems: "flex-end",
    minWidth: 50,
  },
  conversationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  conversationMessage: {
    fontSize: 12,
    color: "#9CA3AF",
    flex: 1,
    marginRight: 6,
    lineHeight: 16,
  },
  unreadMessage: {
    color: "#111827",
    fontWeight: "600",
    fontSize: 12,
  },
  leftGroupMessage: {
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  groupOptionsButton: {
    padding: 4,
    marginTop: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    margin: 20,
    minWidth: 300,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: "#F9FAFB",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonSecondary: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  modalButtonPrimary: {
    backgroundColor: "#0066CC",
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
});

const fabStyles = StyleSheet.create({
  fab: {
    position: "absolute",
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 50,
  },
  fabIcon: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  menuContainer: {
    position: "absolute",
    right: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 60,
    minWidth: 200,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  menuDivider: {
    height: 8,
    backgroundColor: "#F3F4F6",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  menuText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 55,
  },
});

