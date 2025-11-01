"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Search, Users, Clock, Paperclip, Smile, Send } from 'lucide-react';
import { motion } from 'framer-motion';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status?: 'online' | 'offline';
  lastSeen?: string;
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

export default function AdminChatPage() {
  const [agents, setAgents] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Load agents and conversations
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load agents
        const agentsResponse = await fetch('/api/admin/users?role=CSR_AGENT&status=ACTIVE&pageSize=100');
        if (agentsResponse.ok) {
          const agentsData = await agentsResponse.json();
          setAgents(agentsData.rows || []);
        }

        // Load conversations
        const conversationsResponse = await fetch('/api/chat/conversations');
        if (conversationsResponse.ok) {
          const conversationsData = await conversationsResponse.json();
          setConversations(conversationsData.conversations || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Load messages when agent is selected
  useEffect(() => {
    if (selectedAgent) {
      const loadMessages = async () => {
        try {
          const response = await fetch(`/api/chat/messages?receiverId=${selectedAgent.id}`);
          if (response.ok) {
            const data = await response.json();
            setMessages(data.messages || []);
          }
        } catch (error) {
          console.error('Error loading messages:', error);
        }
      };

      loadMessages();
    }
  }, [selectedAgent]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedAgent) return;

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage.trim(),
          receiverId: selectedAgent.id,
          messageType: 'TEXT'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return email[0].toUpperCase();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredAgents = agents.filter(agent =>
    agent.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredConversations = conversations.filter(conv =>
    conv.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading chat...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Team Chat
            </h1>
            <p className="text-gray-600 mt-1">Connect and collaborate with your team</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Modern Agents List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="h-[600px] shadow-xl border-0 overflow-hidden bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  Team Members
                </CardTitle>
                <div className="relative mt-4">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search agents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 py-3 rounded-xl border-0 bg-white/20 text-white placeholder-gray-300 focus:bg-white focus:text-gray-900 transition-all duration-200"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {filteredAgents.map((agent, index) => (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, backgroundColor: '#f8fafc' }}
                      className="group flex items-center gap-4 p-4 border-b border-gray-100 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200"
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center text-sm font-semibold shadow-lg">
                          {getInitials(agent.name, agent.email)}
                        </div>
                        {agent.status === 'online' && (
                          <motion.div 
                            className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                          {agent.name || agent.email}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {agent.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`w-2 h-2 rounded-full ${agent.status === 'online' ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                          <span className="text-xs text-gray-400">
                            {agent.status === 'online' ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Modern Conversations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-[600px] shadow-xl border-0 overflow-hidden bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  Recent Chats
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {filteredConversations.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-8 text-center text-gray-500"
                    >
                      <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="w-8 h-8 text-green-500" />
                      </div>
                      <p className="text-sm font-medium">No conversations yet</p>
                      <p className="text-xs text-gray-400 mt-1">Start chatting with your team</p>
                    </motion.div>
                  ) : (
                    filteredConversations.map((conversation, index) => (
                      <motion.div
                        key={conversation.user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02, backgroundColor: '#f0fdf4' }}
                        className="group flex items-center gap-4 p-4 border-b border-gray-100 cursor-pointer hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200"
                        onClick={() => setSelectedAgent(conversation.user)}
                      >
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-semibold shadow-lg">
                            {getInitials(conversation.user.name, conversation.user.email)}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-green-600 transition-colors">
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
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Modern Chat Area */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-[600px] shadow-xl border-0 overflow-hidden bg-white/80 backdrop-blur-sm">
              <CardHeader className={`p-6 ${selectedAgent ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'bg-gradient-to-r from-gray-600 to-gray-700 text-white'}`}>
                <CardTitle>
                  {selectedAgent ? (
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-sm font-semibold">
                          {getInitials(selectedAgent.name, selectedAgent.email)}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-lg font-semibold">
                          {selectedAgent.name || selectedAgent.email}
                        </p>
                        <p className="text-purple-100 text-sm">
                          {selectedAgent.role} • Online
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold">Select an agent to start chatting</p>
                        <p className="text-gray-200 text-sm">Choose from the team members</p>
                      </div>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {selectedAgent ? (
                  <div className="h-96 flex flex-col">
                    {/* Modern Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
                      {messages.length === 0 ? (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-center py-12"
                        >
                          <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageCircle className="w-8 h-8 text-purple-500" />
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
                            className={`flex ${message.sender.id === selectedAgent.id ? 'justify-start' : 'justify-end'}`}
                          >
                            <div className="flex items-end gap-2 max-w-[80%]">
                              {message.sender.id === selectedAgent.id && (
                                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                                  {getInitials(message.sender.name, message.sender.email)}
                                </div>
                              )}
                              <div
                                className={`relative px-4 py-3 rounded-2xl text-sm shadow-sm ${
                                  message.sender.id === selectedAgent.id
                                    ? 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-md'
                                }`}
                                style={{
                                  boxShadow: message.sender.id === selectedAgent.id 
                                    ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
                                    : '0 4px 12px rgba(168, 85, 247, 0.3)'
                                }}
                              >
                                <p className="leading-relaxed">{message.content}</p>
                                <p className={`text-xs mt-2 ${
                                  message.sender.id === selectedAgent.id
                                    ? 'text-gray-500'
                                    : 'text-purple-100'
                                }`}>
                                  {formatTime(message.createdAt)}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
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
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Type a message..."
                            className="w-full pl-4 pr-12 py-3 rounded-full border-2 border-gray-200 focus:border-purple-500 focus:ring-0 transition-all duration-200 bg-gray-50 focus:bg-white"
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
                          className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg disabled:shadow-none"
                        >
                          <Send className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="h-96 flex items-center justify-center text-gray-500"
                  >
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MessageCircle className="w-10 h-10 text-gray-400" />
                      </div>
                      <p className="text-lg font-medium text-gray-600 mb-2">Choose an agent to start a conversation</p>
                      <p className="text-sm text-gray-400">Select from the team members on the left</p>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
