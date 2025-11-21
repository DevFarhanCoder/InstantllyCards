
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SocketUser {
  userId: string;
  username: string;
  profilePicture?: string;
  isOnline: boolean;
  lastSeen: Date;
}

interface MessageData {
  _id?: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'location';
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

export class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  // --- Group Call Signaling Helpers ---
  emitSignal(event: string, data: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }
  }

  onSignal(event: string, handler: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  offSignal(event: string, handler: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, handler);
    }
  }
}

// Create a singleton instance (must be after class definition)
export const socketService = new SocketService();



