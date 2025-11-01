"use client";

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message, User } from '@/lib/types/chat';
import { MessageBubble } from './MessageBubble';
import { LoadingSkeleton } from './LoadingSkeleton';
import { cn } from '@/lib/utils';

interface MessageListProps {
  messages: Message[];
  currentUser: User;
  isLoading?: boolean;
  onLoadMore?: () => void;
  className?: string;
}

export function MessageList({
  messages,
  currentUser,
  isLoading = false,
  onLoadMore,
  className = '',
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className={cn("flex-1 overflow-y-auto p-4", className)}>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className={cn("flex-1 overflow-y-auto p-4 space-y-4", className)} ref={listRef}>
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date}>
          {/* Date Separator */}
          <div className="flex items-center justify-center my-6">
            <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
              {formatDate(date)}
            </div>
          </div>

          {/* Messages for this date */}
          <div className="space-y-3">
            {dateMessages.map((message, index) => {
              const prevMessage = index > 0 ? dateMessages[index - 1] : null;
              const nextMessage = index < dateMessages.length - 1 ? dateMessages[index + 1] : null;
              
              const isFirstInGroup = !prevMessage || prevMessage.senderId !== message.senderId;
              const isLastInGroup = !nextMessage || nextMessage.senderId !== message.senderId;
              const showAvatar = isLastInGroup;
              const showTime = isLastInGroup;

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "flex items-end gap-2",
                    message.senderId === currentUser.id ? "justify-end" : "justify-start"
                  )}
                >
                  {/* Avatar (only for other users) */}
                  {message.senderId !== currentUser.id && (
                    <div className="flex-shrink-0">
                      {showAvatar ? (
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {message.sender.name?.[0] || message.sender.email[0].toUpperCase()}
                        </div>
                      ) : (
                        <div className="w-8 h-8" /> // Spacer
                      )}
                    </div>
                  )}

                  {/* Message Content */}
                  <div className={cn(
                    "flex flex-col max-w-[70%]",
                    message.senderId === currentUser.id ? "items-end" : "items-start"
                  )}>
                    {/* Sender Name (only for other users, first message in group) */}
                    {message.senderId !== currentUser.id && isFirstInGroup && (
                      <div className="text-xs text-gray-500 mb-1 px-3">
                        {message.sender.name || message.sender.email}
                      </div>
                    )}

                    {/* Message Bubble */}
                    <MessageBubble
                      message={message}
                      isOwn={message.senderId === currentUser.id}
                      isFirstInGroup={isFirstInGroup}
                      isLastInGroup={isLastInGroup}
                      showTime={showTime}
                    />

                    {/* Time (only for last message in group) */}
                    {showTime && (
                      <div className={cn(
                        "text-xs text-gray-400 mt-1 px-3",
                        message.senderId === currentUser.id ? "text-right" : "text-left"
                      )}>
                        {formatTime(message.createdAt)}
                        {message.isOptimistic && (
                          <span className="ml-1 text-blue-500">Sending...</span>
                        )}
                        {message.hasError && (
                          <span className="ml-1 text-red-500">Failed</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Avatar (only for current user) */}
                  {message.senderId === currentUser.id && (
                    <div className="flex-shrink-0">
                      {showAvatar ? (
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {currentUser.name?.[0] || currentUser.email[0].toUpperCase()}
                        </div>
                      ) : (
                        <div className="w-8 h-8" /> // Spacer
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Loading indicator for pagination */}
      {isLoading && messages.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}


