"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { MessageCircle } from 'lucide-react';
import { useChatSocket } from '@/lib/hooks/useChatSocket';
import { useChatMessages } from '@/lib/hooks/useChatMessages';
import { useUsers } from '@/lib/hooks/useUsers';
import { ChatSidebar } from './ChatSidebar';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ErrorBoundary } from './ErrorBoundary';
import { Conversation, Message, User } from '@/lib/types/chat';
import { cn } from '@/lib/utils';

interface ChatLayoutProps {
  className?: string;
}

export function ChatLayout({ className = '' }: ChatLayoutProps) {
  const { data: session } = useSession();
  
  // Memoize currentUser to prevent re-renders
  const currentUser = useMemo(() => {
    if (!session?.user) return null;
    return {
      id: (session.user as any).id,
      name: session.user.name,
      email: session.user.email,
      role: (session.user as any).role,
    } as User;
  }, [session?.user?.id, session?.user?.name, session?.user?.email, (session?.user as any)?.role]);
  
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [userStatuses, setUserStatuses] = useState<Record<string, string>>({});

  // Initialize socket with all handlers
  const { socket, isConnected, sendMessage, startTyping, stopTyping } = useChatSocket({
    userId: currentUser?.id || '',
    userRole: currentUser?.role || '',
    onNewMessage: useCallback((message: Message) => {
      console.log('📨 Received new message:', message);
    }, []),
    onMessageSent: useCallback((message: Message) => {
      console.log('✅ Message sent confirmation:', message);
    }, []),
    onTypingStart: useCallback((data: { userId: string; conversationId: string }) => {
      console.log('⌨️ User started typing:', data);
      if (data.conversationId === activeConversation?.id && data.userId !== currentUser?.id) {
        setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
      }
    }, [activeConversation?.id, currentUser?.id]),
    onTypingStop: useCallback((data: { userId: string; conversationId: string }) => {
      console.log('⌨️ User stopped typing:', data);
      if (data.conversationId === activeConversation?.id) {
        setTypingUsers(prev => prev.filter(id => id !== data.userId));
      }
    }, [activeConversation?.id]),
    onUserStatusChanged: useCallback((data: { userId: string; status: string }) => {
      console.log('👤 User status changed:', data);
      console.log('📊 Current user statuses before update:', userStatuses);
      setUserStatuses(prev => {
        const updated = {
          ...prev,
          [data.userId]: data.status,
        };
        console.log('📊 Updated user statuses:', updated);
        return updated;
      });
    }, []),
    onError: useCallback((error: string) => {
      console.error('❌ Chat error:', error);
    }, []),
  });

  // Initialize messages and conversations hooks
  const {
    messages,
    conversations,
    isLoading,
    error,
    addOptimisticMessage,
    updateMessage,
    removeOptimisticMessage,
    loadConversations,
    setMessages,
  } = useChatMessages({
    conversationId: activeConversation?.id || null,
    userId: currentUser?.id || '',
  });

  const { users } = useUsers({ role: 'CSR_AGENT', status: 'ACTIVE' });

  // Debug: Log when userStatuses changes
  useEffect(() => {
    console.log('🔄 User statuses updated:', userStatuses);
  }, [userStatuses]);

  // Listen to socket events and update messages/conversations
  useEffect(() => {
    if (!socket) return;

    const handleNewMessageEvent = (message: Message) => {
      console.log('📨 Processing new message:', message);
      if (message.receiverId === currentUser?.id) {
        if (activeConversation && message.senderId === activeConversation.participants.find(p => p.id !== currentUser?.id)?.id) {
          addOptimisticMessage({
            ...message,
            isOptimistic: false,
            isSending: false,
          });
        }
        loadConversations();
      }
    };

    const handleMessageSentEvent = (message: Message) => {
      console.log('✅ Processing message sent:', message);
      setMessages(prev => {
        const optimisticIndex = prev.findIndex(msg => 
          msg.isOptimistic && 
          msg.senderId === message.senderId && 
          msg.receiverId === message.receiverId &&
          msg.content === message.content
        );
        
        if (optimisticIndex !== -1) {
          const newMessages = [...prev];
          newMessages[optimisticIndex] = {
            ...message,
            isOptimistic: false,
            isSending: false,
          };
          return newMessages;
        }
        
        return [...prev, { ...message, isOptimistic: false, isSending: false }];
      });
    };

    socket.on('new-message', handleNewMessageEvent);
    socket.on('message-sent', handleMessageSentEvent);

    return () => {
      socket.off('new-message', handleNewMessageEvent);
      socket.off('message-sent', handleMessageSentEvent);
    };
  }, [socket, currentUser?.id, activeConversation, addOptimisticMessage, loadConversations, setMessages]);

  const handleSendMessage = useCallback(async (content: string, attachments?: File[]) => {
    if (!activeConversation || (!content.trim() && (!attachments || attachments.length === 0)) || !currentUser) return;

    const otherUser = activeConversation.participants.find(p => p.id !== currentUser.id);
    if (!otherUser) return;

    try {
      // Upload attachments first if any
      let uploadedAttachments: any[] = [];
      if (attachments && attachments.length > 0) {
        uploadedAttachments = await Promise.all(
          attachments.map(async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch('/api/chat/upload', {
              method: 'POST',
              body: formData,
            });
            
            if (!response.ok) {
              throw new Error(`Failed to upload ${file.name}`);
            }
            
            return await response.json();
          })
        );
      }

      // Add optimistic message
      const optimisticMessage: Omit<Message, 'id'> = {
        content,
        senderId: currentUser.id,
        receiverId: otherUser.id,
        isRead: false,
        messageType: uploadedAttachments.length > 0 ? 'FILE' : 'TEXT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sender: currentUser,
        receiver: otherUser,
        isOptimistic: true,
        isSending: true,
        attachments: uploadedAttachments,
      };

      addOptimisticMessage(optimisticMessage);

      // Send message with uploaded attachment URLs
      await sendMessage({
        content,
        receiverId: otherUser.id,
        senderId: currentUser.id,
        messageType: uploadedAttachments.length > 0 ? 'FILE' : 'TEXT',
        attachments: uploadedAttachments,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      removeOptimisticMessage(`temp-${Date.now()}`);
      // Show error to user
      alert('Failed to send message. Please try again.');
    }
  }, [activeConversation, currentUser, sendMessage, addOptimisticMessage, removeOptimisticMessage]);

  const handleConversationSelect = useCallback(async (conversation: Conversation) => {
    setActiveConversation(conversation);
    
    // Mark all messages in this conversation as read
    if (currentUser?.id) {
      try {
        await fetch(`/api/chat/messages/mark-read`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId: conversation.id,
            userId: currentUser.id,
          }),
        });
        
        // Reload conversations to update unread count
        loadConversations();
      } catch (error) {
        console.error('Failed to mark messages as read:', error);
      }
    }
  }, [currentUser, loadConversations]);

  const handleNewConversation = useCallback((user: User) => {
    if (!currentUser) return;
    
    const newConversation: Conversation = {
      id: user.id,
      participants: [currentUser, user],
      lastMessage: null,
      unreadCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setActiveConversation(newConversation);
  }, [currentUser]);

  const handleStartTyping = useCallback(() => {
    if (activeConversation && currentUser?.id) {
      const otherUser = activeConversation.participants.find(p => p.id !== currentUser.id);
      if (otherUser) {
        startTyping(activeConversation.id, otherUser.id);
      }
    }
  }, [activeConversation, currentUser?.id, startTyping]);

  const handleStopTyping = useCallback(() => {
    if (activeConversation && currentUser?.id) {
      const otherUser = activeConversation.participants.find(p => p.id !== currentUser.id);
      if (otherUser) {
        stopTyping(activeConversation.id, otherUser.id);
      }
    }
  }, [activeConversation, currentUser?.id, stopTyping]);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`flex h-screen bg-gray-50 ${className}`}>
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-shrink-0 border-r border-gray-200 bg-white"
            >
              <ChatSidebar
                conversations={conversations}
                users={users}
                activeConversation={activeConversation}
                onConversationSelect={handleConversationSelect}
                onNewConversation={handleNewConversation}
                currentUser={currentUser}
                isConnected={isConnected}
                userStatuses={userStatuses}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <ChatHeader
                conversation={activeConversation}
                currentUser={currentUser}
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                sidebarOpen={sidebarOpen}
                userStatuses={userStatuses}
              />

              {/* Messages */}
              <div className="flex-1 overflow-hidden">
                {isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <MessageList
                    messages={messages}
                    currentUser={currentUser}
                  />
                )}
              </div>

              {/* Typing Indicator - above input */}
              {typingUsers.length > 0 && (
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                  <TypingIndicator
                    typingUsers={typingUsers}
                    users={users}
                  />
                </div>
              )}

              {/* Message Input - always at bottom */}
              <MessageInput
                onSendMessage={handleSendMessage}
                onStartTyping={handleStartTyping}
                onStopTyping={handleStopTyping}
                disabled={!isConnected}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Select a conversation</h2>
                <p className="text-gray-500">Choose a user from the sidebar to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}