import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useChatSocket, useConversations, useGroups, useUnreadCount } from '@/hooks/chats';
import { getCurrentUserId } from '@/lib/useUser';

interface ChatItemProps {
  item: any;
  currentUserId: string;
  onPress: () => void;
}

const ChatItem: React.FC<ChatItemProps> = ({ item, currentUserId, onPress }) => {
  const isGroup = !!item.group;
  const user = isGroup ? null : item.otherUser;
  const group = isGroup ? item.group : null;
  const lastMessage = item.lastMessage;
  const unreadCount = item.unreadCount || 0;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffHours < 168) { // Less than a week
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getLastMessageText = () => {
    if (!lastMessage) return 'No messages yet';
    
    const isOwnMessage = lastMessage.senderId === currentUserId;
    const prefix = isGroup ? (isOwnMessage ? 'You: ' : `${lastMessage.sender?.name}: `) : (isOwnMessage ? 'You: ' : '');
    
    switch (lastMessage.messageType) {
      case 'image':
        return `${prefix}📷 Photo`;
      case 'file':
        return `${prefix}📎 File`;
      case 'location':
        return `${prefix}📍 Location`;
      default:
        return `${prefix}${lastMessage.content}`;
    }
  };

  return (
    <TouchableOpacity style={styles.chatItem} onPress={onPress}>
      <View style={styles.avatarContainer}>
        {(user?.profilePicture || group?.icon) ? (
          <Image 
            source={{ uri: user?.profilePicture || group?.icon }} 
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.defaultAvatar]}>
            <Ionicons 
              name={isGroup ? "people" : "person"} 
              size={24} 
              color="#666" 
            />
          </View>
        )}
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName} numberOfLines={1}>
            {isGroup ? group?.name : user?.name}
          </Text>
          <Text style={styles.chatTime}>
            {lastMessage ? formatTime(lastMessage.timestamp) : ''}
          </Text>
        </View>
        
        <View style={styles.messagePreview}>
          <Text 
            style={[
              styles.lastMessage,
              unreadCount > 0 && styles.unreadMessage
            ]} 
            numberOfLines={1}
          >
            {getLastMessageText()}
          </Text>
          {lastMessage?.status && !isGroup && lastMessage.senderId === currentUserId && (
            <Ionicons 
              name={
                lastMessage.status === 'read' ? "checkmark-done" :
                lastMessage.status === 'delivered' ? "checkmark-done" : "checkmark"
              }
              size={16}
              color={lastMessage.status === 'read' ? "#4CAF50" : "#999"}
              style={styles.messageStatus}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ChatsScreen: React.FC = () => {
  console.log('🏠 ChatsScreen component rendered');
  const [activeTab, setActiveTab] = useState<'chats' | 'groups'>('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  const { isConnected, connect } = useChatSocket();
  console.log('🔌 ChatsScreen - isConnected:', isConnected);
  const { data: conversations, isLoading: loadingConversations, refetch: refetchConversations } = useConversations();
  const { data: groups, isLoading: loadingGroups, refetch: refetchGroups } = useGroups();
  const { data: unreadData } = useUnreadCount();

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const userId = await getCurrentUserId();
        if (userId) {
          setCurrentUserId(userId);
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };

    initializeUser();
  }, []);

  useEffect(() => {
    console.log('🔍 ChatsScreen: Connection status check:', { isConnected });
    if (!isConnected) {
      console.log('🔌 ChatsScreen: Attempting to connect Socket.IO...');
      connect().then(success => {
        console.log('🔌 ChatsScreen: Socket.IO connection result:', success);
      }).catch(error => {
        console.error('❌ ChatsScreen: Socket.IO connection error:', error);
      });
    } else {
      console.log('✅ ChatsScreen: Socket.IO already connected');
    }
  }, [isConnected, connect]);

  const filteredConversations = conversations?.filter(conv =>
    conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredGroups = groups?.filter(group =>
    group.group.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleChatPress = (item: any) => {
    if (activeTab === 'groups') {
      router.push(`/group-chat/${item.group._id}`);
    } else {
      router.push(`/chat/${item.otherUser._id}`);
    }
  };

  const handleNewChat = () => {
    if (activeTab === 'groups') {
      router.push('/group-info');
    } else {
      router.push('/contacts/select');
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons 
        name={activeTab === 'groups' ? "people-outline" : "chatbubble-outline"} 
        size={64} 
        color="#ccc" 
      />
      <Text style={styles.emptyTitle}>
        No {activeTab === 'groups' ? 'groups' : 'chats'} yet
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'groups' 
          ? 'Create a group to start chatting with multiple people'
          : 'Start a conversation with your contacts'
        }
      </Text>
      <TouchableOpacity style={styles.startButton} onPress={handleNewChat}>
        <Text style={styles.startButtonText}>
          {activeTab === 'groups' ? 'Create Group' : 'Start Chat'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderConnectionStatus = () => {
    if (!isConnected) {
      return (
        <View style={styles.connectionBanner}>
          <Ionicons name="warning-outline" size={16} color="#FF9800" />
          <Text style={styles.connectionText}>Connecting to chat...</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderConnectionStatus()}
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Messages</Text>
          {unreadData && (unreadData.privateUnread > 0 || unreadData.groupUnread > 0) && (
            <View style={styles.totalUnreadBadge}>
              <Text style={styles.totalUnreadText}>
                {unreadData.totalUnread > 99 ? '99+' : unreadData.totalUnread}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={handleNewChat} style={styles.newChatButton}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'chats' && styles.activeTab]}
          onPress={() => setActiveTab('chats')}
        >
          <Text style={[styles.tabText, activeTab === 'chats' && styles.activeTabText]}>
            Chats
          </Text>
          {unreadData?.privateUnread > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>
                {unreadData.privateUnread > 99 ? '99+' : unreadData.privateUnread}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'groups' && styles.activeTab]}
          onPress={() => setActiveTab('groups')}
        >
          <Text style={[styles.tabText, activeTab === 'groups' && styles.activeTabText]}>
            Groups
          </Text>
          {unreadData?.groupUnread > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>
                {unreadData.groupUnread > 99 ? '99+' : unreadData.groupUnread}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Chat List */}
      <View style={styles.chatList}>
        {(loadingConversations && activeTab === 'chats') || (loadingGroups && activeTab === 'groups') ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading {activeTab}...</Text>
          </View>
        ) : (
          <FlatList<any>
            data={activeTab === 'chats' ? filteredConversations : filteredGroups}
            keyExtractor={(item) => activeTab === 'chats' ? item._id : item.group._id}
            renderItem={({ item }) => (
              <ChatItem 
                item={item} 
                currentUserId={currentUserId}
                onPress={() => handleChatPress(item)}
              />
            )}
            onRefresh={activeTab === 'chats' ? refetchConversations : refetchGroups}
            refreshing={(loadingConversations && activeTab === 'chats') || (loadingGroups && activeTab === 'groups')}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              (activeTab === 'chats' ? filteredConversations : filteredGroups).length === 0 
                ? styles.emptyListContainer 
                : undefined
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  connectionBanner: {
    backgroundColor: '#FFF3CD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  connectionText: {
    color: '#856404',
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  totalUnreadBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  totalUnreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  newChatButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  tabBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  chatList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultAvatar: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginRight: 8,
  },
  chatTime: {
    fontSize: 12,
    color: '#999',
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  unreadMessage: {
    fontWeight: '600',
    color: '#000',
  },
  messageStatus: {
    marginLeft: 4,
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChatsScreen;