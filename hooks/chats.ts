import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { socketService } from '../lib/socket';
import api from '../lib/api';

export interface MessageData {
  _id?: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'location' | 'system' ;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  localMessageId?: string;
  sender?: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileUrl?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface ConversationData {
  _id: string;
  otherUser: {
    _id: string;
    name: string;
    profilePicture?: string;
    email?: string;
  };
  lastMessage: MessageData;
  unreadCount: number;
}

export interface GroupData {
  _id: string;
  group: {
    _id: string;
    name: string;
    description?: string;
    icon?: string;
    members: number;
    admin: string;
  };
  lastMessage: MessageData;
  unreadCount: number;
}

export const useChatSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: boolean }>({});
  const queryClient = useQueryClient();

  console.log('🔍 useChatSocket: Hook initialized, isConnected:', isConnected);

  const connect = useCallback(async () => {
    console.log('🔄 useChatSocket: Starting connection attempt...');
    try {
      console.log('🔌 useChatSocket: Calling socketService.connect()...');
      const connected = await socketService.connect();
      console.log('🔌 useChatSocket: socketService.connect() returned:', connected);
      setIsConnected(connected);
      console.log('🔌 useChatSocket: isConnected state set to:', connected);
      return connected;
    } catch (error) {
      console.error('❌ useChatSocket: Failed to connect to chat:', error);
      setIsConnected(false);
      return false;
    }
  }, []);

  const disconnect = useCallback(() => {
    socketService.disconnect();
    setIsConnected(false);
  }, []);

  useEffect(() => {
    // Only set up connection and online users listeners (not message listeners to avoid duplicates)
    const unsubscribeConnection = socketService.onConnection(setIsConnected);
    const unsubscribeOnlineUsers = socketService.onOnlineUsers(setOnlineUsers);
    
    const unsubscribeTyping = socketService.onTyping((data) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.userId]: data.isTyping
      }));
      
      // Clear typing after 3 seconds
      if (data.isTyping) {
        setTimeout(() => {
          setTypingUsers(prev => ({
            ...prev,
            [data.userId]: false
          }));
        }, 3000);
      }
    });

    // Auto-connect when hook is used
    connect();

    return () => {
      unsubscribeConnection();
      unsubscribeOnlineUsers();
      unsubscribeTyping();
    };
  }, [connect]);

  return {
    isConnected,
    onlineUsers,
    typingUsers,
    connect,
    disconnect,
    socketService
  };
};

export const useConversations = () => {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await api.get('/chats/conversations');
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch conversations');
      }

      return response.conversations as ConversationData[];
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: true,
  });
};

export const useGroups = () => {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const response = await api.get('/chats/groups');

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch groups');
      }

      return response.groups as GroupData[];
    },
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
};

export const useConversation = (userId: string) => {
  return useQuery({
    queryKey: ['conversation', userId],
    queryFn: async () => {
      const response = await api.get(`/chats/conversation/${userId}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch conversation');
      }

      return response.messages as MessageData[];
    },
    enabled: !!userId,
    staleTime: 10000, // Consider data fresh for 10 seconds
    refetchOnWindowFocus: true,
  });
};

export const useGroupMessages = (groupId: string) => {
  return useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const response = await api.get(`/chats/group/${groupId}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch group messages');
      }

      return {
        messages: response.messages as MessageData[],
        group: response.group
      };
    },
    enabled: !!groupId,
    staleTime: 10000,
    refetchOnWindowFocus: true,
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['unreadCount'],
    queryFn: async () => {
      const response = await api.get('/chats/unread-count');

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch unread count');
      }

      return response;
    },
    staleTime: 5000, // Refresh every 5 seconds
    refetchInterval: 10000, // Auto-refetch every 10 seconds
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  const sendMessage = useCallback(async (
    receiverId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' | 'location' | 'system' = 'text',
    metadata?: any
  ) => {
    try {
      const localMessageId = `local_${Date.now()}_${Math.random()}`;
      
      // Send via socket for real-time delivery
      const success = await socketService.sendMessage(receiverId, content, messageType, localMessageId, metadata);
      
      if (success) {
        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['conversation', receiverId] });
        queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      }
      
      return success;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }, [queryClient]);

  const sendGroupMessage = useCallback(async (
    groupId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' | 'location' | 'system',
    metadata?: any
  ) => {
    try {
      const localMessageId = `local_${Date.now()}_${Math.random()}`;
      
      // Send via socket for real-time delivery
      const success = await socketService.sendGroupMessage(groupId, content, messageType, localMessageId, metadata);
      
      if (success) {
        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['groups'] });
        queryClient.invalidateQueries({ queryKey: ['group', groupId] });
        queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      }
      
      return success;
    } catch (error) {
      console.error('Error sending group message:', error);
      return false;
    }
  }, [queryClient]);

  return {
    sendMessage,
    sendGroupMessage
  };
};