"use client";
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, X, Send, Users, Phone, Video, MoreVertical, Smile, Paperclip, Mic, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: User;
  receiver: User | null;
  isRead: boolean;
  messageType: string;
}

interface Conversation {
  user: User;
  lastMessage: Message;
  unreadCount: number;
}

interface ChatWidgetProps {
  currentUserId: string;
  currentUserRole: string;
}

export function ChatWidget({ currentUserId, currentUserRole }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<any>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('/orders', {
      transports: ['websocket', 'polling'],
      reconnection: true
    });

    newSocket.on('connect', () => {
      setSocketConnected(true);
      console.log('Chat socket connected');
    });

    newSocket.on('disconnect', () => {
      setSocketConnected(false);
      console.log('Chat socket disconnected');
    });

    newSocket.on('new-message', (message: Message) => {
      setMessages(prev => [...prev, message]);
      // Update conversations
      setConversations(prev => {
        const updated = [...prev];
        const convIndex = updated.findIndex(c => c.user.id === message.sender.id);
        if (convIndex >= 0) {
          updated[convIndex] = {
            ...updated[convIndex],
            lastMessage: message,
            unreadCount: updated[convIndex].unreadCount + 1
          };
        }
        return updated;
      });
    });

    newSocket.on('user-typing', (data: { senderId: string; isTyping: boolean }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (data.isTyping) {
          newSet.add(data.senderId);
        } else {
          newSet.delete(data.senderId);
        }
        return newSet;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const response = await fetch('/api/chat/conversations');
        if (response.ok) {
          const data = await response.json();
          setConversations(data.conversations);
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
      }
    };

    loadConversations();
  }, []);

  // Load messages when user is selected
  useEffect(() => {
    if (selectedUser) {
      const loadMessages = async () => {
        try {
          const response = await fetch(`/api/chat/messages?receiverId=${selectedUser.id}`);
          if (response.ok) {
            const data = await response.json();
            setMessages(data.messages);
          }
        } catch (error) {
          console.error('Error loading messages:', error);
        }
      };

      loadMessages();
    }
  }, [selectedUser]);

  // Mark messages as read when user is selected
  useEffect(() => {
    if (selectedUser && socket) {
      socket.emit('mark-read', { senderId: selectedUser.id });
    }
  }, [selectedUser, socket]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !socket) return;

    const messageData = {
      content: newMessage.trim(),
      receiverId: selectedUser.id,
      senderId: currentUserId,
      messageType: 'TEXT'
    };

    socket.emit('send-message', messageData);
    setNewMessage('');
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (selectedUser && socket) {
      socket.emit('typing-start', { receiverId: selectedUser.id, senderId: currentUserId });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing-stop', { receiverId: selectedUser.id, senderId: currentUserId });
      }, 1000);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return email[0].toUpperCase();
  };

  return (
    <>
      {/* Modern Chat Toggle Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl border-0 transition-all duration-300"
          size="lg"
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
          </motion.div>
          
          {conversations && conversations.some(c => c.unreadCount > 0) && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2"
            >
              <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs min-w-[24px] h-6 flex items-center justify-center rounded-full shadow-lg animate-pulse">
                {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
              </Badge>
            </motion.div>
          )}
          
          {/* Pulsing ring effect */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-blue-400"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </Button>
      </motion.div>

      {/* Modern Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, x: 0, scale: 1, y: 0 }}
            exit={{ opacity: 0, x: 400, scale: 0.8, y: 20 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300,
              duration: 0.4 
            }}
            className="fixed bottom-6 right-6 z-40 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border-0 overflow-hidden backdrop-blur-xl bg-white/95"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)'
            }}
          >
            <div className="h-full flex flex-col">
              {/* Modern Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      {socketConnected && (
                        <motion.div
                          className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Team Chat</h3>
                      <p className="text-blue-100 text-sm">
                        {socketConnected ? 'Connected' : 'Connecting...'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20 rounded-full w-8 h-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 flex flex-col p-0">
                {!selectedUser ? (
                  // Modern Conversations List
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="w-4 h-4 text-gray-500" />
                        <h3 className="text-sm font-semibold text-gray-700">Recent Conversations</h3>
                      </div>
                      {!conversations || conversations.length === 0 ? (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-center py-12"
                        >
                          <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageCircle className="w-8 h-8 text-blue-500" />
                          </div>
                          <p className="text-sm text-gray-500 font-medium">No conversations yet</p>
                          <p className="text-xs text-gray-400 mt-1">Start chatting with your team</p>
                        </motion.div>
                      ) : (
                        <div className="space-y-2">
                          {conversations && conversations.map((conversation, index) => (
                            <motion.div
                              key={conversation.user.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              onClick={() => setSelectedUser(conversation.user)}
                              className="group flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer transition-all duration-200 border border-transparent hover:border-blue-100 hover:shadow-sm"
                            >
                              <div className="relative">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center text-sm font-semibold shadow-lg">
                                  {getInitials(conversation.user.name, conversation.user.email)}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                                    {conversation.user.name || conversation.user.email}
                                  </p>
                                  {conversation.unreadCount > 0 && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-sm"
                                    >
                                      {conversation.unreadCount}
                                    </motion.div>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 truncate mt-1">
                                  {conversation.lastMessage.content}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {formatTime(conversation.lastMessage.createdAt)}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Modern Chat Messages
                  <>
                    {/* Modern Chat Header */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedUser(null)}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                        >
                          ←
                        </motion.button>
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center text-sm font-semibold shadow-lg">
                            {getInitials(selectedUser.name, selectedUser.email)}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800">
                            {selectedUser.name || selectedUser.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            {selectedUser.role} • Online
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                          >
                            <Phone className="w-4 h-4 text-gray-600" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                          >
                            <Video className="w-4 h-4 text-gray-600" />
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    {/* Modern Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
                      {messages.length === 0 ? (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-center py-12"
                        >
                          <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageCircle className="w-8 h-8 text-blue-500" />
                          </div>
                          <p className="text-sm text-gray-500 font-medium">No messages yet</p>
                          <p className="text-xs text-gray-400 mt-1">Start the conversation</p>
                        </motion.div>
                      ) : (
                        messages.map((message, index) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className={`flex ${message.sender.id === currentUserId ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className="flex items-end gap-2 max-w-[80%]">
                              {message.sender.id !== currentUserId && (
                                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                                  {getInitials(message.sender.name, message.sender.email)}
                                </div>
                              )}
                              <div
                                className={`relative px-4 py-3 rounded-2xl text-sm shadow-sm ${
                                  message.sender.id === currentUserId
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-md'
                                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                                }`}
                                style={{
                                  boxShadow: message.sender.id === currentUserId 
                                    ? '0 4px 12px rgba(59, 130, 246, 0.3)' 
                                    : '0 2px 8px rgba(0, 0, 0, 0.1)'
                                }}
                              >
                                <p className="leading-relaxed">{message.content}</p>
                                <p className={`text-xs mt-2 ${
                                  message.sender.id === currentUserId
                                    ? 'text-blue-100'
                                    : 'text-gray-500'
                                }`}>
                                  {formatTime(message.createdAt)}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                      
                      {/* Modern Typing Indicator */}
                      {typingUsers.has(selectedUser.id) && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-start"
                        >
                          <div className="flex items-end gap-2">
                            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                              {getInitials(selectedUser.name, selectedUser.email)}
                            </div>
                            <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
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
                            </div>
                          </div>
                        </motion.div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Modern Message Input */}
                    <div className="p-4 bg-white border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                        >
                          <Paperclip className="w-4 h-4 text-gray-600" />
                        </motion.button>
                        <div className="flex-1 relative">
                          <Input
                            value={newMessage}
                            onChange={handleTyping}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Type a message..."
                            className="w-full pl-4 pr-12 py-3 rounded-full border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-all duration-200 bg-gray-50 focus:bg-white"
                          />
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                          >
                            <Smile className="w-4 h-4 text-gray-600" />
                          </motion.button>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={sendMessage}
                          disabled={!newMessage.trim()}
                          className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg disabled:shadow-none"
                        >
                          <Send className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
