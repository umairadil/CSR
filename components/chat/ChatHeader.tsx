"use client";

import { motion } from 'framer-motion';
import { Conversation, User } from '@/lib/types/chat';
import { Menu, Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  conversation: Conversation;
  currentUser: User;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  userStatuses?: Record<string, string>;
}

export function ChatHeader({
  conversation,
  currentUser,
  onToggleSidebar,
  sidebarOpen,
  userStatuses = {},
}: ChatHeaderProps) {
  const otherUser = conversation.participants.find(p => p.id !== currentUser.id);
  
  if (!otherUser) return null;

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

  const getStatusText = (status?: string, lastSeen?: string | null) => {
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'offline': return lastSeen ? `Last seen ${new Date(lastSeen).toLocaleDateString()}` : 'Offline';
      default: return 'Offline';
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - User info */}
        <div className="flex items-center gap-3">
          {/* Mobile back button */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>

          {/* Avatar */}
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
              {getInitials(otherUser.name, otherUser.email)}
            </div>
            
            {/* Online status - use real-time status from socket */}
            <div className={cn(
              "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
              getStatusColor(userStatuses[otherUser.id] || 'offline')
            )} />
          </div>

          {/* User details */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {otherUser.name || otherUser.email}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {getStatusText(userStatuses[otherUser.id] || 'offline', otherUser.lastSeen)}
              </span>
            </div>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Call buttons */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Voice call"
          >
            <Phone className="w-5 h-5 text-gray-600" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Video call"
          >
            <Video className="w-5 h-5 text-gray-600" />
          </motion.button>

          {/* More options */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="More options"
          >
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
