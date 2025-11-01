"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Conversation, User } from '@/lib/types/chat';
import { cn } from '@/lib/utils';

interface ConversationItemProps {
  conversation: Conversation;
  currentUser: User;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationItem({
  conversation,
  currentUser,
  isActive,
  onClick,
}: ConversationItemProps) {
  const otherUser = conversation.participants.find(p => p.id !== currentUser.id);
  
  if (!otherUser) return null;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return email[0].toUpperCase();
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full p-3 rounded-lg transition-all duration-200 text-left",
        isActive
          ? "bg-blue-50 border border-blue-200"
          : "hover:bg-gray-50 border border-transparent"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
            {getInitials(otherUser.name, otherUser.email)}
          </div>
          
          {/* Online status */}
          <div className={cn(
            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
            getStatusColor(otherUser.status)
          )} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className={cn(
              "text-sm font-semibold truncate",
              isActive ? "text-blue-900" : "text-gray-900"
            )}>
              {otherUser.name || otherUser.email}
            </h3>
            
            {conversation.lastMessage && (
              <span className={cn(
                "text-xs",
                isActive ? "text-blue-600" : "text-gray-500"
              )}>
                {formatTime(conversation.lastMessage.createdAt)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <p className={cn(
              "text-sm truncate",
              isActive ? "text-blue-700" : "text-gray-600",
              conversation.unreadCount > 0 && "font-medium"
            )}>
              {conversation.lastMessage?.content || 'No messages yet'}
            </p>

            {/* Unread badge */}
            <AnimatePresence>
              {conversation.unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold min-w-[20px] text-center"
                >
                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.button>
  );
}


