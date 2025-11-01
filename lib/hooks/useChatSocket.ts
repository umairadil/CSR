import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message, User, Conversation, TypingUser, SendMessagePayload } from '@/lib/types/chat';

interface UseChatSocketOptions {
  userId: string;
  userRole: string;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onNewMessage?: (message: Message) => void;
  onMessageSent?: (message: Message) => void;
  onTypingStart?: (data: { userId: string; conversationId: string }) => void;
  onTypingStop?: (data: { userId: string; conversationId: string }) => void;
  onUserStatusChanged?: (data: { userId: string; status: string }) => void;
  onError?: (error: string) => void;
}

interface UseChatSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (payload: SendMessagePayload) => Promise<void>;
  markAsRead: (messageId: string) => void;
  startTyping: (conversationId: string, receiverId: string) => void;
  stopTyping: (conversationId: string, receiverId: string) => void;
  uploadAttachment: (file: File) => Promise<string>;
}

export function useChatSocket({
  userId,
  userRole,
  onConnect,
  onDisconnect,
  onNewMessage,
  onMessageSent,
  onTypingStart,
  onTypingStop,
  onUserStatusChanged,
  onError,
}: UseChatSocketOptions): UseChatSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use refs to store the latest callbacks to avoid re-running useEffect
  const callbacksRef = useRef({
    onConnect,
    onDisconnect,
    onNewMessage,
    onMessageSent,
    onTypingStart,
    onTypingStop,
    onUserStatusChanged,
    onError,
  });
  
  // Update refs when callbacks change
  useEffect(() => {
    callbacksRef.current = {
      onConnect,
      onDisconnect,
      onNewMessage,
      onMessageSent,
      onTypingStart,
      onTypingStop,
      onUserStatusChanged,
      onError,
    };
  }, [onConnect, onDisconnect, onNewMessage, onMessageSent, onTypingStart, onTypingStop, onUserStatusChanged, onError]);

  useEffect(() => {
    if (!userId) {
      console.log('⚠️ Chat socket: No userId provided, skipping connection');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    if (socketRef.current && socketRef.current.connected) {
      console.log('✅ Chat socket already connected, skipping new connection');
      return;
    }

    console.log('🔌 Connecting to chat namespace with userId:', userId);
    
    const newSocket = io('/chat', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: true,
      query: { userId, userRole },
   });

    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      console.log('✅ Chat socket connected');
      setIsConnected(true);
      newSocket.emit('join-chat', userId);
      callbacksRef.current.onConnect?.();
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Chat socket disconnected:', reason);
      setIsConnected(false);
      callbacksRef.current.onDisconnect?.(reason);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Chat socket connection error:', error);
      setIsConnected(false);
      callbacksRef.current.onError?.(error.message);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Chat socket reconnecting... attempt:', attemptNumber);
      newSocket.emit('join-chat', userId); // Re-join chat on reconnect
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('❌ Chat socket reconnection error:', error);
    });

    newSocket.on('chat-connected', (data) => {
      console.log('✅ Chat socket joined chat:', data);
      // If server sends initial user statuses, emit them one by one
      if (data.userStatuses) {
        console.log('📥 Received initial user statuses:', data.userStatuses);
        for (const [userId, status] of Object.entries(data.userStatuses)) {
          callbacksRef.current.onUserStatusChanged?.({ userId, status: status as string });
        }
      }
    });

    // Register all event listeners using callbacksRef
    newSocket.on('new-message', (message) => {
      console.log('📨 Received new message:', message);
      callbacksRef.current.onNewMessage?.(message);
    });

    newSocket.on('message-sent', (message) => {
      console.log('✅ Message sent confirmation:', message);
      callbacksRef.current.onMessageSent?.(message);
    });

    newSocket.on('user-typing', (data) => {
      console.log('⌨️ User started typing:', data);
      callbacksRef.current.onTypingStart?.(data);
    });

    newSocket.on('user-typing-stop', (data) => {
      console.log('⌨️ User stopped typing:', data);
      callbacksRef.current.onTypingStop?.(data);
    });

    newSocket.on('userStatusChanged', (data) => {
      console.log('👤 User status changed:', data);
      callbacksRef.current.onUserStatusChanged?.(data);
    });

    newSocket.on('chat-error', (error: { message: string }) => {
      console.error('❌ Chat error:', error);
      callbacksRef.current.onError?.(error.message);
    });

    setSocket(newSocket);

    return () => {
      console.log('🧹 Chat socket cleanup');
      newSocket.off('connect');
      newSocket.off('disconnect');
      newSocket.off('connect_error');
      newSocket.off('reconnect');
      newSocket.off('reconnect_error');
      newSocket.off('chat-connected');
      newSocket.off('new-message');
      newSocket.off('message-sent');
      newSocket.off('user-typing');
      newSocket.off('user-typing-stop');
      newSocket.off('userStatusChanged');
      newSocket.off('chat-error');
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [userId]); // Only depend on userId

  const sendMessage = useCallback(async (payload: SendMessagePayload) => {
    if (!socketRef.current || !isConnected) {
      throw new Error('Socket not connected');
    }
    socketRef.current.emit('send-message', payload);
  }, [isConnected]);

  const markAsRead = useCallback((messageId: string) => {
    if (!socketRef.current || !isConnected) return;
    socketRef.current.emit('mark-as-read', messageId);
  }, [isConnected]);

  const startTyping = useCallback((conversationId: string, receiverId: string) => {
    if (!socketRef.current || !isConnected) return;
    socketRef.current.emit('typing-start', { conversationId, senderId: userId, receiverId });
  }, [isConnected, userId]);

  const stopTyping = useCallback((conversationId: string, receiverId: string) => {
    if (!socketRef.current || !isConnected) return;
    socketRef.current.emit('typing-stop', { conversationId, senderId: userId, receiverId });
  }, [isConnected, userId]);

  const uploadAttachment = useCallback(async (file: File): Promise<string> => {
    // Placeholder for actual upload logic
    console.log('Uploading attachment:', file.name);
    return new Promise(resolve => setTimeout(() => resolve(`/uploads/${file.name}`), 1000));
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    uploadAttachment,
  };
}
