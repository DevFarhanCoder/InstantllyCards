// lib/groupSharingService.ts - Full Production Version with Backend Integration
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export interface GroupSharingSession {
  id: string;
  code: string;
  adminId: string;
  adminName: string;
  adminPhoto?: string;
  participants: GroupParticipant[];
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  status: 'waiting' | 'connected' | 'sharing' | 'completed' | 'expired';
}

export interface GroupParticipant {
  id: string;
  name: string;
  photo?: string;
  phone: string;
  isOnline: boolean;
  joinedAt: string;
  cardsToShare: string[];
  defaultCardId?: string;
}

export interface CardShare {
  id: string;
  fromUserId: string;
  toUserId: string;
  cardId: string;
  sessionId: string;
  sharedAt: string;
  isAlreadyShared?: boolean;
}

class GroupSharingService {
  private currentSession: GroupSharingSession | null = null;
  private pollingInterval: any = null;
  private isPolling = false;
  
  // Helper method to get current user ID
  private async getUserId(): Promise<string> {
    try {
      const userDataStr = await AsyncStorage.getItem('user');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        return userData._id || userData.id || `user_${Date.now()}`;
      }
      const storedUserId = await AsyncStorage.getItem('currentUserId');
      return storedUserId || `user_${Date.now()}`;
    } catch (error) {
      console.error('⚠️ Error getting user ID:', error);
      return `user_${Date.now()}`;
    }
  }
  
  // Generate 4-digit numeric code
  generateGroupCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  // Create a new group sharing session (Admin only)
  async createGroupSession(): Promise<{ session: GroupSharingSession; code: string }> {
    try {
      console.log('🔄 Starting group session creation...');
      const code = this.generateGroupCode();
      console.log('📝 Generated code:', code);
      
      // Get user data with fallbacks
      let userId = '';
      let userName = 'User';
      let userPhone = '';
      let userPhoto = '';
      
      try {
        const storedUserId = await AsyncStorage.getItem('currentUserId');
        const storedUserName = await AsyncStorage.getItem('user_name');
        const storedUserPhone = await AsyncStorage.getItem('user_phone');
        
        const userDataStr = await AsyncStorage.getItem('user');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          userId = userData._id || userData.id || storedUserId || `user_${Date.now()}`;
          userName = userData.name || storedUserName || 'User';
          userPhone = userData.phone || storedUserPhone || '';
          userPhoto = userData.profilePhoto || '';
        } else {
          userId = storedUserId || `user_${Date.now()}`;
          userName = storedUserName || 'User';
          userPhone = storedUserPhone || '';
        }
        
        console.log('👤 User data retrieved:', { userId: userId.substring(0, 8), userName, hasPhone: !!userPhone });
      } catch (userError) {
        console.error('⚠️ Error getting user data, using defaults:', userError);
        userId = `user_${Date.now()}`;
      }
      
      // Call backend API
      console.log('📡 Calling backend API to create session...');
      const response = await api.post('/group-sharing/create', {
        code,
        adminId: userId,
        adminName: userName,
        adminPhone: userPhone,
        adminPhoto: userPhoto,
        expirationMinutes: 10
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create session');
      }
      
      const session: GroupSharingSession = response.session;
      
      // Store session locally
      this.currentSession = session;
      await AsyncStorage.setItem('currentGroupSession', JSON.stringify(session));
      
      console.log('🔄 Starting polling...');
      this.startPolling();
      
      console.log('✅ Group session created successfully:', session.id);
      return { session, code };
      
    } catch (error: any) {
      console.error('❌ Failed to create group session:', error);
      console.error('❌ Error stack:', error?.stack);
      throw new Error('Failed to create group session: ' + (error?.message || 'Unknown error'));
    }
  }

  // Join an existing group session
  async joinGroupSession(code: string): Promise<GroupSharingSession> {
    try {
      console.log('🔗 Joining group session with code:', code);
      
      // Get user data with fallbacks (same as createGroupSession)
      let userId = '';
      let userName = 'User';
      let userPhone = '';
      let userPhoto = '';
      
      try {
        const storedUserId = await AsyncStorage.getItem('currentUserId');
        const storedUserName = await AsyncStorage.getItem('user_name');
        const storedUserPhone = await AsyncStorage.getItem('user_phone');
        
        const userDataStr = await AsyncStorage.getItem('user');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          userId = userData._id || userData.id || storedUserId || `user_${Date.now()}`;
          userName = userData.name || storedUserName || 'User';
          userPhone = userData.phone || storedUserPhone || '';
          userPhoto = userData.profilePhoto || '';
        } else {
          userId = storedUserId || `user_${Date.now()}`;
          userName = storedUserName || 'User';
          userPhone = storedUserPhone || '';
        }
        
        console.log('👤 User data retrieved:', { userId: userId.substring(0, 8), userName, hasPhone: !!userPhone });
      } catch (userError) {
        console.error('⚠️ Error getting user data, using defaults:', userError);
        userId = `user_${Date.now()}`;
      }

      // Call backend API
      console.log('📡 Calling backend API to join session...');
      const response = await api.post('/group-sharing/join', {
        code,
        userId,
        userName,
        userPhone,
        userPhoto
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to join session');
      }

      const session: GroupSharingSession = response.session;
      
      // Store session locally
      this.currentSession = session;
      await AsyncStorage.setItem('currentGroupSession', JSON.stringify(session));
      
      console.log('🔄 Starting polling...');
      this.startPolling();
      
      console.log('✅ Joined group session successfully');
      return session;
      
    } catch (error: any) {
      console.error('❌ Failed to join group session:', error);
      throw new Error('Failed to join group: ' + (error?.message || 'Invalid code or expired'));
    }
  }

  // Get current session status
  async getSessionStatus(): Promise<GroupSharingSession | null> {
    if (!this.currentSession) return null;
    
    try {
      console.log('📊 Fetching session status from backend...');
      const response = await api.get(`/group-sharing/session/${this.currentSession.id}`);
      
      if (!response.success) {
        console.log('⚠️ Session not found or expired');
        return null;
      }
      
      this.currentSession = response.session;
      await AsyncStorage.setItem('currentGroupSession', JSON.stringify(this.currentSession));
      
      return this.currentSession;
      
    } catch (error) {
      console.error('❌ Failed to get session status:', error);
      return null;
    }
  }

  // Start real-time polling for session updates
  private startPolling() {
    if (this.isPolling || !this.currentSession) return;
    
    this.isPolling = true;
    console.log('🔄 Starting group sharing polling...');
    
    this.pollingInterval = setInterval(async () => {
      try {
        const session = await this.getSessionStatus();
        if (!session) {
          console.log('⏰ Session expired or not found');
          this.stopPolling();
        }
      } catch (error) {
        console.error('❌ Polling error:', error);
      }
    }, 3000); // Poll every 3 seconds
  }

  // Stop polling
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
    console.log('🛑 Stopped group sharing polling');
  }

  // Connect all participants (Admin action)
  async connectAllParticipants(): Promise<boolean> {
    if (!this.currentSession) return false;
    
    try {
      console.log('🔗 Connecting all participants...');
      
      const userId = await this.getUserId();
      
      const response = await api.post(`/group-sharing/connect/${this.currentSession.id}`, {
        adminId: userId
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to connect participants');
      }
      
      this.currentSession = response.session;
      await AsyncStorage.setItem('currentGroupSession', JSON.stringify(this.currentSession));
      
      console.log('✅ All participants connected successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to connect participants:', error);
      return false;
    }
  }

  // Set user's cards to share
  async setCardsToShare(cardIds: string[], defaultCardId?: string): Promise<boolean> {
    if (!this.currentSession) return false;
    
    try {
      console.log('📋 Setting cards to share:', cardIds.length, 'cards');
      
      const userId = await this.getUserId();
      
      const response = await api.post(`/group-sharing/set-cards/${this.currentSession.id}`, {
        userId,
        cardIds,
        defaultCardId
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to set cards');
      }
      
      // Update local session
      const participant = this.currentSession.participants.find(p => p.id === userId);
      if (participant) {
        participant.cardsToShare = cardIds;
        participant.defaultCardId = defaultCardId;
        await AsyncStorage.setItem('currentGroupSession', JSON.stringify(this.currentSession));
      }
      
      console.log('✅ Cards set successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to set cards to share:', error);
      return false;
    }
  }

  // Execute card sharing between all participants
  async executeCardSharing(): Promise<{ success: boolean; results: CardShare[]; duplicates: CardShare[]; summary?: any }> {
    if (!this.currentSession) return { success: false, results: [], duplicates: [] };
    
    try {
      console.log('🚀 Executing card sharing...');
      
      const userId = await this.getUserId();
      
      const response = await api.post(`/group-sharing/execute/${this.currentSession.id}`, {
        adminId: userId
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to execute sharing');
      }
      
      console.log('✅ Card sharing executed:', response.summary);
      
      return {
        success: true,
        results: response.results || [],
        duplicates: response.duplicates || [],
        summary: response.summary
      };
      
    } catch (error) {
      console.error('❌ Failed to execute card sharing:', error);
      return { success: false, results: [], duplicates: [] };
    }
  }

  // End session
  async endSession(): Promise<boolean> {
    try {
      if (!this.currentSession) return false;
      
      console.log('🛑 Ending session...');
      
      const userId = await this.getUserId();
      
      await api.post(`/group-sharing/end/${this.currentSession.id}`, {
        userId
      });
      
      this.stopPolling();
      this.currentSession = null;
      await AsyncStorage.removeItem('currentGroupSession');
      
      console.log('✅ Session ended successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to end session:', error);
      return false;
    }
  }

  // Get current session
  getCurrentSession(): GroupSharingSession | null {
    return this.currentSession;
  }

  // Clear current session (local cleanup)
  clearSession() {
    this.stopPolling();
    this.currentSession = null;
  }
}

export default new GroupSharingService();
