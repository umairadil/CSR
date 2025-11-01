"use client";

import { motion } from 'framer-motion';
import { User } from '@/lib/types/chat';
import { cn } from '@/lib/utils';

interface UserItemProps {
  user: User;
  onClick: () => void;
  status?: string;
}

export function UserItem({ user, onClick, status = 'offline' }: UserItemProps) {
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'CSR_AGENT': return 'bg-blue-100 text-blue-800';
      case 'MANAGER': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full p-3 rounded-lg hover:bg-gray-50 transition-all duration-200 text-left"
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
            {getInitials(user.name, user.email)}
          </div>
          
          {/* Online status */}
          <div className={cn(
            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
            getStatusColor(status)
          )} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {user.name || user.email}
            </h3>
            
            <span className={cn(
              "text-xs px-2 py-1 rounded-full font-medium",
              getRoleColor(user.role)
            )}>
              {user.role.replace('_', ' ')}
            </span>
          </div>

          <p className="text-sm text-gray-600 truncate">
            {user.email}
          </p>

          <p className="text-xs text-gray-500 mt-1">
            {status === 'online' ? 'Online' : 
             status === 'away' ? 'Away' : 
             status === 'offline' ? 'Offline' : status}
          </p>
        </div>
      </div>
    </motion.button>
  );
}
