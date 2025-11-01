"use client";

import { Conversation, User } from '@/lib/types/chat';

interface ChatMainProps {
  conversation: Conversation;
  currentUser: User;
  isConnected: boolean;
}

export function ChatMain({ conversation, currentUser, isConnected }: ChatMainProps) {
  // This component is a placeholder for future chat main functionality
  // Currently handled by ChatLayout directly
  return null;
}


