"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Users, MessageCircle, Clock } from 'lucide-react';
import { Conversation, User } from '@/lib/types/chat';
import { ConversationItem } from './ConversationItem';
import { UserItem } from './UserItem';
import { cn } from '@/lib/utils';

interface ChatSidebarProps {
  conversations: Conversation[];
  users: User[];
  activeConversation: Conversation | null;
  onConversationSelect: (conversation: Conversation) => void;
  onNewConversation: (user: User) => void;
  currentUser: User;
  isConnected: boolean;
  userStatuses: Record<string, string>;
}

export function ChatSidebar({
  conversations,
  users,
  activeConversation,
  onConversationSelect,
  onNewConversation,
  currentUser,
  isConnected,
  userStatuses,
}: ChatSidebarProps) {
  const [activeTab, setActiveTab] = useState<'conversations' | 'users'>('conversations');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.participants.some(p => 
      p.id !== currentUser.id && 
      (p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       p.email.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  // Sort users: Online first, then offline
  const filteredUsers = users
    .filter(user =>
      user.id !== currentUser.id &&
      (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       user.email.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      const statusA = userStatuses[a.id] || 'offline';
      const statusB = userStatuses[b.id] || 'offline';
      
      if (statusA === 'online' && statusB !== 'online') return -1;
      if (statusA !== 'online' && statusB === 'online') return 1;
      return 0;
    });

  const totalUnreadCount = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Team Chat</h2>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-green-500" : "bg-red-500"
            )} />
            <span className="text-xs text-gray-500">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Tabs */}
        <div className="flex mt-4 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('conversations')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors",
              activeTab === 'conversations'
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <MessageCircle className="w-4 h-4" />
            Conversations
            {totalUnreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {totalUnreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors",
              activeTab === 'users'
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <Users className="w-4 h-4" />
            Team
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'conversations' ? (
          <div className="p-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </p>
                {!searchQuery && (
                  <p className="text-gray-400 text-xs mt-1">
                    Start a conversation with your team
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredConversations.map((conversation, index) => (
                  <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ConversationItem
                      conversation={conversation}
                      currentUser={currentUser}
                      isActive={activeConversation?.id === conversation.id}
                      onClick={() => onConversationSelect(conversation)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-2">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  {searchQuery ? 'No users found' : 'No team members'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredUsers.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <UserItem
                      user={user}
                      onClick={() => onNewConversation(user)}
                      status={userStatuses[user.id] || 'offline'}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
