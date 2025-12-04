import { socketService } from '../lib/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';
import { router } from 'expo-router';
import { QueryClient } from '@tanstack/react-query';
import { showInAppNotification } from './notifications-expo-go';

class ChatNotificationService {
  private isInitialized = false;
  private queryClient: QueryClient | null = null;

  initialize(queryClient: QueryClient) {
    if (this.isInitialized) {
      console.log('🔔 Chat notification service already initialized');
      return;
    }

    console.log('🔔 Initializing chat notification service...');
    this.queryClient = queryClient;
    this.setupGlobalListeners();
    this.isInitialized = true;
  }

  private setupGlobalListeners() {
    console.log('🎧 Setting up global chat notification listeners...');

    // Handle private messages
    socketService.onMessage(async (message) => {
      console.log('🎯 Global private message handler:', message);
      
      // Invalidate conversations query to refresh the list
      this.queryClient?.invalidateQueries({ queryKey: ['conversations'] });
      this.queryClient?.invalidateQueries({ queryKey: ['conversation', message.senderId] });
      this.queryClient?.invalidateQueries({ queryKey: ['unreadCount'] });
      
      // Show notification if user is not in the current private chat
      try {
        const currentUser = await AsyncStorage.getItem('user');
        const activeChat = await AsyncStorage.getItem('currentActiveChat');
        
        if (currentUser && message.sender) {
          const userData = JSON.parse(currentUser);
          const currentUserId = userData.id || userData._id;
          
          // Extract sender ID from populated sender object or fallback to senderId field
          const messageSenderId = typeof message.sender === 'object' 
            ? message.sender._id
            : message.sender;
          
          // Only show notification if:
          // 1. Message is not from current user
          // 2. User is not currently in this private chat
          if (messageSenderId !== currentUserId && activeChat !== messageSenderId) {
            const senderName = typeof message.sender === 'object' 
              ? (message.sender.name || 'Unknown')
              : 'Unknown';
              
            console.log('🔔 Showing private message notification:', {
              sender: senderName,
              content: message.content,
              activeChat,
              currentUserId,
              messageSenderId
            });
            
            await showInAppNotification(
              senderName,
              message.content,
              () => {
                // Navigate to the private chat when notification is tapped
                // Pass both userId and name to avoid "Unknown" header
                router.push(`/chat/${messageSenderId}?name=${encodeURIComponent(senderName)}` as any);
              }
            );
          }
        }
      } catch (error) {
        console.error('Error showing private message notification:', error);
      }
    });

    // Handle group messages
    socketService.onGroupMessage(async (message) => {
      console.log('🎯 Global group message handler:', message);
      
      // Invalidate groups query to refresh the list
      this.queryClient?.invalidateQueries({ queryKey: ['groups'] });
      this.queryClient?.invalidateQueries({ queryKey: ['group', message.groupId] });
      this.queryClient?.invalidateQueries({ queryKey: ['unreadCount'] });
      
      // Show notification if user is not in the current group chat
      try {
        const currentUser = await AsyncStorage.getItem('user');
        const activeChat = await AsyncStorage.getItem('currentActiveChat');
        
        if (currentUser && message.sender) {
          const userData = JSON.parse(currentUser);
          const currentUserId = userData.id || userData._id;
          
          // Extract sender ID from populated sender object or fallback to senderId field
          const messageSenderId = typeof message.sender === 'object' 
            ? message.sender._id
            : message.sender;
          
          // Only show notification if:
          // 1. Message is not from current user
          // 2. User is not currently in this group chat
          if (messageSenderId !== currentUserId && activeChat !== `group_${message.groupId}`) {
            // Get group name for better notification
            let groupName = 'Group';
            try {
              const groupsResponse = await api.get('/groups');
              if (groupsResponse?.success && groupsResponse.groups) {
                const group = groupsResponse.groups.find((g: any) => g._id === message.groupId);
                if (group) {
                  groupName = group.name;
                }
              }
            } catch (error) {
              console.log('Could not fetch group name for notification');
            }
            
            const senderName = typeof message.sender === 'object' 
              ? (message.sender.name || 'Unknown')
              : 'Unknown';
            
            console.log('🔔 Showing group notification:', {
              groupName,
              sender: senderName,
              content: message.content,
              activeChat,
              currentUserId,
              messageSenderId
            });
            
            await showInAppNotification(
              `${groupName}: ${senderName}`,
              message.content,
              () => {
                // Navigate to the group chat when notification is tapped
                router.push(`/group-chat/${message.groupId}?name=${encodeURIComponent(groupName)}` as any);
              }
            );
          }
        }
      } catch (error) {
        console.error('Error showing group message notification:', error);
      }
    });

    console.log('✅ Global chat notification listeners setup complete');
  }
}

// Create singleton instance
export const chatNotificationService = new ChatNotificationService();