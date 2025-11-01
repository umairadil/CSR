import { useState, useEffect, useCallback } from 'react';
import { Message, Conversation, User } from '@/lib/types/chat';

interface UseChatMessagesOptions {
  conversationId: string | null;
  userId: string;
}

interface UseChatMessagesReturn {
  messages: Message[];
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string, attachments?: File[]) => Promise<void>;
  loadMessages: () => Promise<void>;
  loadConversations: () => Promise<void>;
  addOptimisticMessage: (message: Omit<Message, 'id'> | Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  removeOptimisticMessage: (tempId: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export function useChatMessages({ conversationId, userId }: UseChatMessagesOptions): UseChatMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/chat/messages?conversationId=${conversationId}`);
      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  const loadConversations = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat/conversations');
      if (!response.ok) {
        throw new Error('Failed to load conversations');
      }

      const data = await response.json();
      setConversations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const sendMessage = useCallback(async (content: string, attachments?: File[]) => {
    if (!conversationId) return;

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          conversationId,
          attachments: attachments?.map(file => ({
            filename: file.name,
            mimeType: file.type,
            size: file.size,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const newMessage = await response.json();
      setMessages(prev => [...prev, newMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  }, [conversationId]);

  const addOptimisticMessage = useCallback((message: Omit<Message, 'id'> | Message) => {
    // Check if message already has an ID (real message from server)
    const finalMessage: Message = 'id' in message ? message as Message : {
      ...message,
      id: `temp-${Date.now()}`,
      isOptimistic: true,
      isSending: true,
    };

    // Check if message already exists in the list
    setMessages(prev => {
      const exists = prev.some(msg => msg.id === finalMessage.id);
      if (exists) return prev;
      return [...prev, finalMessage];
    });
  }, []);

  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    );
  }, []);

  const removeOptimisticMessage = useCallback((tempId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== tempId));
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Load conversations when user changes
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    messages,
    conversations,
    isLoading,
    error,
    sendMessage,
    loadMessages,
    loadConversations,
    addOptimisticMessage,
    updateMessage,
    removeOptimisticMessage,
    setMessages,
  };
}