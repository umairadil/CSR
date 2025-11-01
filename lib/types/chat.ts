export interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status?: 'online' | 'offline' | 'away';
  lastSeen?: string | null;
  avatar?: string | null;
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string | null;
  createdAt: string;
  updatedAt: string;
  isRead: boolean;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  attachments?: Attachment[];
  sender: User;
  receiver: User | null;
  // Optimistic UI fields
  isOptimistic?: boolean;
  isSending?: boolean;
  hasError?: boolean;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage: Message | null;
  unreadCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

export interface ChatState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  typingUsers: TypingUser[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface SendMessagePayload {
  content: string;
  senderId: string;
  receiverId: string;
  conversationId?: string;
  attachments?: any[];
  messageType?: 'TEXT' | 'IMAGE' | 'FILE';
}

export interface SocketEvents {
  'message:sent': Message;
  'message:received': Message;
  'message:read': { messageId: string; readBy: string; readAt: string };
  'typing:start': { userId: string; conversationId: string };
  'typing:stop': { userId: string; conversationId: string };
  'user:online': { userId: string; status: 'online' | 'away' };
  'user:offline': { userId: string; lastSeen: string };
  'conversation:created': Conversation;
  'conversation:updated': Conversation;
}
