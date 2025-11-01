"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Search, Filter, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Agent {
  id: string;
  name: string;
  email: string;
  status: 'online' | 'offline';
  lastSeen: string | null;
  assigned: number;
  confirmed: number;
  conversionRate: number;
}

interface AgentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: Agent[];
}

export function AgentsModal({ isOpen, onClose, agents }: AgentsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'conversion'>('status');

  // Reset filters when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setStatusFilter('all');
      setSortBy('status');
    }
  }, [isOpen]);

  // Filter and sort agents
  const filteredAgents = agents
    .filter(agent => {
      const matchesSearch = 
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' || agent.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'status') {
        if (a.status === 'online' && b.status !== 'online') return -1;
        if (a.status !== 'online' && b.status === 'online') return 1;
        return 0;
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        return b.conversionRate - a.conversionRate;
      }
    });

  const onlineCount = agents.filter(a => a.status === 'online').length;
  const offlineCount = agents.filter(a => a.status === 'offline').length;

  const getStatusColor = (status: string) => {
    return status === 'online' ? 'bg-green-500' : 'bg-gray-400';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-4 md:inset-8 lg:inset-16 xl:inset-24 bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">All Agents</h2>
                  <p className="text-blue-100 text-sm mt-0.5">
                    {agents.length} total · {onlineCount} online · {offlineCount} offline
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Filters */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex gap-2">
                  {(['all', 'online', 'offline'] as const).map((status) => (
                    <motion.button
                      key={status}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setStatusFilter(status)}
                      className={cn(
                        "px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                        statusFilter === status
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                          : "bg-white text-gray-700 border border-gray-300 hover:border-blue-300"
                      )}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                      {status === 'online' && onlineCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                          {onlineCount}
                        </span>
                      )}
                      {status === 'offline' && offlineCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                          {offlineCount}
                        </span>
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* Sort */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white cursor-pointer"
                  >
                    <option value="status">Sort by Status</option>
                    <option value="name">Sort by Name</option>
                    <option value="conversion">Sort by Conversion</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Agents List */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredAgents.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full text-center py-12"
                >
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Users className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No agents found</h3>
                  <p className="text-sm text-gray-500">
                    {searchQuery 
                      ? "Try adjusting your search or filters" 
                      : "No agents match the current filter"}
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredAgents.map((agent, index) => (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className={cn(
                            "w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg shadow-md",
                            agent.status === 'online'
                              ? "from-green-400 to-green-600"
                              : "from-gray-300 to-gray-500"
                          )}>
                            {agent.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div className={cn(
                            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                            getStatusColor(agent.status)
                          )} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                              {agent.name}
                            </h3>
                            <span className={cn(
                              "px-2 py-0.5 text-xs font-medium rounded-full",
                              agent.status === 'online'
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            )}>
                              {agent.status === 'online' ? 'Online' : 'Offline'}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 truncate mb-3">{agent.email}</p>

                          {/* Stats */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-blue-50 rounded-lg px-3 py-2">
                              <p className="text-xs text-blue-600 font-medium mb-0.5">Assigned</p>
                              <p className="text-lg font-bold text-blue-900">{agent.assigned}</p>
                            </div>
                            <div className="bg-green-50 rounded-lg px-3 py-2">
                              <p className="text-xs text-green-600 font-medium mb-0.5">Confirmed</p>
                              <p className="text-lg font-bold text-green-900">{agent.confirmed}</p>
                            </div>
                            <div className="bg-purple-50 rounded-lg px-3 py-2">
                              <p className="text-xs text-purple-600 font-medium mb-0.5">Rate</p>
                              <p className="text-lg font-bold text-purple-900">{agent.conversionRate}%</p>
                            </div>
                          </div>

                          {/* Last Seen */}
                          {agent.status === 'offline' && agent.lastSeen && (
                            <p className="text-xs text-gray-500 mt-2">
                              Last seen: {new Date(agent.lastSeen).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredAgents.length}</span> of{' '}
                <span className="font-semibold text-gray-900">{agents.length}</span> agents
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}



