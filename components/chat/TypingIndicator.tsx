"use client";

import { motion } from 'framer-motion';
import { User } from '@/lib/types/chat';

interface TypingIndicatorProps {
  typingUsers: string[];
  users: User[];
}

export function TypingIndicator({ typingUsers, users }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const typingUserNames = typingUsers
    .map(userId => users.find(u => u.id === userId)?.name || users.find(u => u.id === userId)?.email)
    .filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="px-4 py-2"
    >
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="flex space-x-1">
          <motion.div
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
          />
        </div>
        <span>
          {typingUserNames.length === 1 
            ? `${typingUserNames[0]} is typing...`
            : `${typingUserNames.slice(0, -1).join(', ')} and ${typingUserNames[typingUserNames.length - 1]} are typing...`
          }
        </span>
      </div>
    </motion.div>
  );
}


