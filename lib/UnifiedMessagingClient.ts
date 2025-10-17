/**
 * Unified Messaging Client for React Native
 * Supports both Socket.IO (old) and WebSocket (Erlang gateway)
 * Auto-detects which to use
 */

import { io, Socket } from 'socket.io-client';

type MessageHandler = (message: any) => void;
type PresenceHandler = (presence: any) => void;

class UnifiedMessagingClient {
  private socket: Socket | null = null;
  private ws: WebSocket | null = null;
  private useWebSocket: boolean = false;
  private serverUrl: string;
  private userId: string | null = null;
  private deviceId: string;
  private messageHandlers: Set<MessageHandler> = new Set();
  private presenceHandlers: Set<PresenceHandler> = new Set();

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
    this.deviceId = this.generateDeviceId();
  }

  private generateDeviceId(): string {
    return `rn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async connect(userId: string, token: string): Promise<void> {
    this.userId = userId;

    // Try WebSocket (Erlang) first
    try {
      await this.connectWebSocket(userId, token);
      console.log('✅ Connected via WebSocket (Erlang Gateway)');
      this.useWebSocket = true;
    } catch (error) {
      console.log('⚠️  WebSocket failed, falling back to Socket.IO');
      this.connectSocketIO(userId, token);
      this.useWebSocket = false;
    }
  }

  private connectWebSocket(userId: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = this.serverUrl.replace('http', 'ws') + '/ws';
      this.ws = new WebSocket(wsUrl);

      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 5000);

      this.ws.onopen = () => {
        clearTimeout(timeout);
        // Authenticate
        this.ws?.send(JSON.stringify({
          type: 'auth',
          userId: userId,
          deviceId: this.deviceId,
          token: token
        }));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'auth_success') {
            clearTimeout(timeout);
            resolve();
          } else {
            this.handleWebSocketMessage(data);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        // Auto-reconnect
        setTimeout(() => {
          if (this.userId) {
            this.connectWebSocket(this.userId, token);
          }
        }, 5000);
      };
    });
  }

  private connectSocketIO(userId: string, token: string): void {
    this.socket = io(this.serverUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected via Socket.IO');
      this.socket?.emit('user_online', { userId });
    });

    this.socket.on('new_message', (message) => {
      this.messageHandlers.forEach(handler => handler(message));
    });

    this.socket.on('presence_update', (presence) => {
      this.presenceHandlers.forEach(handler => handler(presence));
    });

    this.socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });
  }

  private handleWebSocketMessage(data: any): void {
    switch (data.type) {
      case 'new_message':
        this.messageHandlers.forEach(handler => handler(data));
        break;
      
      case 'presence_update':
        this.presenceHandlers.forEach(handler => handler(data));
        break;
      
      case 'message_ack':
        console.log('Message acknowledged:', data.messageId);
        break;
      
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  sendMessage(receiverId: string, content: string, messageType: string = 'text'): void {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const message = {
      messageId,
      receiverId,
      content,
      messageType,
      timestamp: Date.now()
    };

    if (this.useWebSocket && this.ws) {
      // Send via WebSocket (Erlang)
      this.ws.send(JSON.stringify({
        type: 'send_message',
        ...message
      }));
    } else if (this.socket) {
      // Send via Socket.IO (fallback)
      this.socket.emit('send_message', message);
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onPresence(handler: PresenceHandler): () => void {
    this.presenceHandlers.add(handler);
    return () => this.presenceHandlers.delete(handler);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getConnectionStatus(): { connected: boolean; mode: 'websocket' | 'socketio' | 'disconnected' } {
    if (this.useWebSocket && this.ws?.readyState === WebSocket.OPEN) {
      return { connected: true, mode: 'websocket' };
    } else if (this.socket?.connected) {
      return { connected: true, mode: 'socketio' };
    }
    return { connected: false, mode: 'disconnected' };
  }
}

export default UnifiedMessagingClient;
