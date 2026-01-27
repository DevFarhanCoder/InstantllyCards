import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  messageType: "text" | "image" | "file" | "location" | "system";
  timestamp: Date;
  status: "sent" | "delivered" | "read";
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
  // off(arg0: string, handleNewMessage: (msg: any) => void) {
  //   throw new Error('Method not implemented.');
  // }
  // on(arg0: string, handleNewMessage: (msg: any) => void) {
  //   throw new Error('Method not implemented.');
  // }
  // static leaveConversation(arg0: { groupId: string; }, id: string) {
  //   throw new Error('Method not implemented.');
  // }
  public on(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) return;
    this.socket.on(event, callback);
  }

  public off(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) return;
    this.socket.off(event, callback);
  }

  public static leaveConversation(conversationId?: string, groupId?: string) {
    socketService.leaveConversation(conversationId, groupId);
  }

  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  // Event listeners
  private messageListeners: ((message: MessageData) => void)[] = [];
  private groupMessageListeners: ((message: MessageData) => void)[] = [];
  private onlineUsersListeners: ((users: SocketUser[]) => void)[] = [];
  private typingListeners: ((data: {
    userId: string;
    isTyping: boolean;
  }) => void)[] = [];
  private groupTypingListeners: ((data: {
    userId: string;
    groupId: string;
    isTyping: boolean;
  }) => void)[] = [];
  private connectionListeners: ((connected: boolean) => void)[] = [];
  private messageStatusListeners: ((data: {
    messageId: string;
    status: string;
    readBy?: string;
  }) => void)[] = [];
  private adminTransferListeners: ((data: {
    groupId: string;
    groupName: string;
    message: string;
    fromUser?: string;
    timestamp?: Date;
  }) => void)[] = [];

  async connect(baseUrl?: string): Promise<boolean> {
    const resolvedBase =
      baseUrl || process.env.EXPO_PUBLIC_API_BASE || process.env.API_BASE || "";

    if (!resolvedBase) {
      return false;
    }

    if (this.socket?.connected || this.isConnecting) {
      return true;
    }

    this.isConnecting = true;

    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        this.isConnecting = false;
        return false;
      }

      this.socket = io(resolvedBase, {
        auth: {
          token: token,
        },
        transports: ["websocket", "polling"],
        timeout: 20000,
        reconnection: false, // Disable auto-reconnect to prevent error spam
        reconnectionAttempts: 0,
        autoConnect: true,
        forceNew: true,
      });

      return new Promise((resolve) => {
        if (!this.socket) {
          this.isConnecting = false;
          resolve(false);
          return;
        }

        this.socket.on("connect", () => {
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          this.notifyConnectionListeners(true);
          resolve(true);
        });

        this.socket.on("connect_error", (error) => {
          this.reconnectAttempts++;
          this.isConnecting = false;
          this.notifyConnectionListeners(false);
          resolve(false);
        });

        this.socket.on("disconnect", (reason) => {
          if (reason === "io server disconnect") {
            this.handleReconnect();
          }
          this.notifyConnectionListeners(false);
        });

        this.socket.on("reconnect", (attemptNumber) => {
          this.notifyConnectionListeners(true);
        });

        this.socket.on("reconnect_error", () => {
          // Silent - don't spam logs
        });

        this.socket.on("reconnect_failed", () => {
          this.notifyConnectionListeners(false);
        });

        // Set up message listeners
        this.setupMessageListeners();

        // Add connection timeout
        setTimeout(() => {
          if (this.isConnecting) {
            this.isConnecting = false;
            resolve(false);
          }
        }, 20000);
      });
    } catch (error) {
      this.isConnecting = false;
      return false;
    }
  }

  private setupMessageListeners() {
    if (!this.socket) {
      return;
    }

    // Handle new private messages
    this.socket.on("new_group_message", (message: MessageData) => {
      this.notifyMessageListeners(message);
    });

    // Handle new group messages
    this.socket.on("new_group_message", (message: MessageData) => {
      this.notifyGroupMessageListeners(message);
    });

    // Handle message sent confirmation
    this.socket.on("message_sent", (data: MessageData) => {
      this.notifyMessageListeners(data);
    });

    // Handle group message sent confirmation
    this.socket.on("group_message_sent", (data: MessageData) => {
      this.notifyGroupMessageListeners(data);
    });

    // Handle online users
    this.socket.on("online_users", (users: SocketUser[]) => {
      this.notifyOnlineUsersListeners(users);
    });

    // Handle user online status
    this.socket.on("user_online", (user: Partial<SocketUser>) => {
      // You can handle individual user online status here
    });

    // Handle user offline status
    this.socket.on(
      "user_offline",
      (data: { userId: string; lastSeen: string }) => {
        // You can handle individual user offline status here
      },
    );

    // Handle typing indicators
    this.socket.on(
      "user_typing",
      (data: { userId: string; username: string; isTyping: boolean }) => {
        this.notifyTypingListeners({
          userId: data.userId,
          isTyping: data.isTyping,
        });
      },
    );

    // Handle group typing indicators
    this.socket.on(
      "user_typing_group",
      (data: {
        userId: string;
        username: string;
        groupId: string;
        isTyping: boolean;
      }) => {
        this.notifyGroupTypingListeners({
          userId: data.userId,
          groupId: data.groupId,
          isTyping: data.isTyping,
        });
      },
    );

    // Handle message read status
    this.socket.on(
      "message_read",
      (data: {
        messageId: string;
        readBy: string;
        conversationId?: string;
        groupId?: string;
      }) => {
        this.notifyMessageStatusListeners({
          messageId: data.messageId,
          status: "read",
          readBy: data.readBy,
        });
      },
    );

    // Handle message delivered status
    this.socket.on(
      "message_delivered",
      (data: {
        messageId: string;
        localMessageId?: string;
        status: string;
        deliveredAt: string;
      }) => {
        this.notifyMessageStatusListeners({
          messageId: data.localMessageId || data.messageId,
          status: "delivered",
        });
      },
    );

    // Handle admin transfer notification
    this.socket.on(
      "admin_transferred",
      (data: { groupId: string; groupName: string; message: string }) => {
        this.notifyAdminTransferListeners(data);
      },
    );

    // Handle errors
    this.socket.on("error", (error: any) => {
      // Silent error handling
    });
  }

  async sendMessage(
    receiverId: string,
    content: string,
    messageType: "text" | "image" | "file" | "location" | "system",
    localMessageId?: string,
    metadata?: any,
  ): Promise<boolean> {
    if (!this.socket?.connected) {
      return false;
    }

    try {
      const userData = await AsyncStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : null;

      if (!user) {
        return false;
      }

      const messageData = {
        // senderId: user._id || user.id,
        receiverId,
        content,
        messageType,
        localMessageId,
        metadata,
      };

      this.socket.emit("send_message", messageData);
      return true;
    } catch (error) {
      return false;
    }
  }
  async sendGroupMessage(
    groupId: string,
    content: string,
    messageType: "text" | "image" | "file" | "location" | "system" = "text",
    localMessageId?: string,
    metadata?: any,
  ): Promise<boolean> {
    if (!this.socket?.connected) {
      return false;
    }

    try {
      const userData = await AsyncStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : null;

      if (!user) {
        return false;
      }

      const messageData = {
        // senderId: user._id || user.id,
        groupId,
        content,
        messageType,
        localMessageId,
        metadata,
      };

      this.socket.emit("send_group_message", messageData);
      return true;
    } catch (error) {
      return false;
    }
  }

  markMessageAsRead(
    messageId: string,
    conversationId?: string,
    groupId?: string,
  ) {
    if (this.socket?.connected) {
      this.socket.emit("message_read", {
        messageId,
        conversationId,
        groupId,
      });
    }
  }

  startTyping(receiverId?: string, groupId?: string) {
    if (this.socket?.connected) {
      this.socket.emit("typing_start", {
        receiverId,
        groupId,
      });
    }
  }

  stopTyping(receiverId?: string, groupId?: string) {
    if (this.socket?.connected) {
      this.socket.emit("typing_stop", {
        receiverId,
        groupId,
      });
    }
  }

  joinConversation(conversationId?: string, groupId?: string) {
    if (this.socket?.connected) {
      this.socket.emit("join_conversation", {
        conversationId,
        groupId,
      });
    }
  }

  leaveConversation(conversationId?: string, groupId?: string) {
    if (this.socket?.connected) {
      this.socket.emit("leave_conversation", {
        conversationId,
        groupId,
      });
    }
  }

  requestOnlineUsers() {
    if (this.socket?.connected) {
      this.socket.emit("get_online_users");
    }
  }

  updateStatus(status: "online" | "away" | "busy") {
    if (this.socket?.connected) {
      this.socket.emit("update_status", { status });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.notifyConnectionListeners(false);
  }

  private async handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  // Event listener management
  onMessage(listener: (message: MessageData) => void) {
    this.messageListeners.push(listener);
    return () => {
      this.messageListeners = this.messageListeners.filter(
        (l) => l !== listener,
      );
    };
  }

  onGroupMessage(listener: (message: MessageData) => void) {
    this.groupMessageListeners.push(listener);
    return () => {
      this.groupMessageListeners = this.groupMessageListeners.filter(
        (l) => l !== listener,
      );
    };
  }

  onOnlineUsers(listener: (users: SocketUser[]) => void) {
    this.onlineUsersListeners.push(listener);
    return () => {
      this.onlineUsersListeners = this.onlineUsersListeners.filter(
        (l) => l !== listener,
      );
    };
  }

  onTyping(listener: (data: { userId: string; isTyping: boolean }) => void) {
    this.typingListeners.push(listener);
    return () => {
      this.typingListeners = this.typingListeners.filter((l) => l !== listener);
    };
  }

  onGroupTyping(
    listener: (data: {
      userId: string;
      groupId: string;
      isTyping: boolean;
    }) => void,
  ) {
    this.groupTypingListeners.push(listener);
    return () => {
      this.groupTypingListeners = this.groupTypingListeners.filter(
        (l) => l !== listener,
      );
    };
  }

  onConnection(listener: (connected: boolean) => void) {
    this.connectionListeners.push(listener);
    return () => {
      this.connectionListeners = this.connectionListeners.filter(
        (l) => l !== listener,
      );
    };
  }

  onMessageStatus(
    listener: (data: {
      messageId: string;
      status: string;
      readBy?: string;
    }) => void,
  ) {
    this.messageStatusListeners.push(listener);
    return () => {
      this.messageStatusListeners = this.messageStatusListeners.filter(
        (l) => l !== listener,
      );
    };
  }

  onAdminTransfer(
    listener: (data: {
      groupId: string;
      groupName: string;
      message: string;
      fromUser?: string;
      timestamp?: Date;
    }) => void,
  ) {
    this.adminTransferListeners.push(listener);
    return () => {
      this.adminTransferListeners = this.adminTransferListeners.filter(
        (l) => l !== listener,
      );
    };
  }

  // Private notification methods
  private notifyMessageListeners(message: MessageData) {
    this.messageListeners.forEach((listener) => listener(message));
  }

  private notifyAdminTransferListeners(data: {
    groupId: string;
    groupName: string;
    message: string;
  }) {
    this.adminTransferListeners.forEach((listener) => listener(data));
  }

  private notifyGroupMessageListeners(message: MessageData) {
    this.groupMessageListeners.forEach((listener) => listener(message));
  }

  private notifyOnlineUsersListeners(users: SocketUser[]) {
    this.onlineUsersListeners.forEach((listener) => listener(users));
  }

  private notifyTypingListeners(data: { userId: string; isTyping: boolean }) {
    this.typingListeners.forEach((listener) => listener(data));
  }

  private notifyGroupTypingListeners(data: {
    userId: string;
    groupId: string;
    isTyping: boolean;
  }) {
    this.groupTypingListeners.forEach((listener) => listener(data));
  }

  private notifyConnectionListeners(connected: boolean) {
    this.connectionListeners.forEach((listener) => listener(connected));
  }

  private notifyMessageStatusListeners(data: {
    messageId: string;
    status: string;
    readBy?: string;
  }) {
    this.messageStatusListeners.forEach((listener) => listener(data));
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionId(): string | undefined {
    return this.socket?.id;
  }
}

// Create a singleton instance
export const socketService = new SocketService();
