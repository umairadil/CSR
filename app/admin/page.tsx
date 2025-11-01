"use client";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MessageCircle, Users, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';

// Defer heavy widgets to after first paint to speed up dashboard navigation
const ChatWidget = dynamic(() => import('@/components/chat/ChatWidget').then(m => m.ChatWidget), {
  ssr: false,
  loading: () => null,
});
const AgentsModal = dynamic(() => import('@/components/admin/AgentsModal').then(m => m.AgentsModal), {
  ssr: false,
  loading: () => null,
});

interface AdminKPIs {
  totalOrders: number;
  confirmed30d: number;
  cancelled30d: number;
  active30d: number;
  postponed30d: number;
  conversionRate: number;
  activeAgents: number;
  onlineAgents: number;
  todayOrders: number;
  todayCalls: number;
  topAgents: Array<{
    name: string;
    assigned: number;
    confirmed: number;
    conversionRate: number;
  }>;
  agentsWithStatus: Array<{
    id: string;
    name: string;
    email: string;
    status: 'online' | 'offline';
    lastSeen: string | null;
    assigned: number;
    confirmed: number;
    conversionRate: number;
  }>;
  averageOrdersPerAgent: number;
  totalCalls30d: number;
  averageCallsPerOrder: number;
}

export default function AdminDashboardPage() {
  const [kpis, setKpis] = useState<AdminKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAgentsModalOpen, setIsAgentsModalOpen] = useState(false);

  const fetchKPIs = async () => {
    try {
      const response = await fetch('/api/admin/kpis');
      if (response.ok) {
        const data = await response.json();
        setKpis(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/chat/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    fetchKPIs();
    fetchUnreadCount();
    
    // Poll for unread count every 10 seconds
    const unreadInterval = setInterval(fetchUnreadCount, 10000);
    
    // Get current user info
    const getUserInfo = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const session = await response.json();
          if (session?.user?.email) {
            const userResponse = await fetch('/api/admin/users?search=' + session.user.email + '&pageSize=1');
            if (userResponse.ok) {
              const userData = await userResponse.json();
              if (userData.rows?.length > 0) {
                setCurrentUser({
                  id: userData.rows[0].id,
                  role: userData.rows[0].role
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error getting user info:', error);
      }
    };
    
    getUserInfo();
    
    // Fallback: Refresh every 10 seconds if socket is not connected, every 60 seconds if connected
    const fallbackInterval = setInterval(() => {
      if (!socketConnected) {
        console.log('🔄 Fallback refresh - socket not connected');
        fetchKPIs();
      } else {
        console.log('🔄 Periodic refresh - socket connected');
        fetchKPIs();
      }
    }, socketConnected ? 60000 : 10000);
    
    return () => {
      clearInterval(fallbackInterval);
      clearInterval(unreadInterval);
    };
  }, [socketConnected]);

  // Set up real-time updates via Socket.IO (deferred import reduces initial bundle)
  useEffect(() => {
    let socket: any;
    const start = async () => {
      const { io } = await import('socket.io-client');
      socket = io('/orders', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
      });

      socket.on('connect', () => {
        setSocketConnected(true);
        console.log('✅ Admin dashboard connected to socket');
        // Refresh data immediately when connected
        fetchKPIs();
      });

      socket.on('disconnect', (reason: string) => {
        setSocketConnected(false);
        console.log('❌ Admin dashboard disconnected from socket. Reason:', reason);
      });

      socket.on('connect_error', (error: any) => {
        console.error('❌ Admin dashboard socket connection error:', error);
        setSocketConnected(false);
      });

      // Listen for agent status changes
      socket.on('agentStatusChanged', (data: any) => {
        console.log('🔄 Admin dashboard received agentStatusChanged:', data);
        // Refresh KPIs to get updated agent status
        fetchKPIs();
      });

      // Listen for all socket events for debugging
      socket.onAny((event: string, ...args: any[]) => {
        console.log('📡 Admin dashboard received event:', event, args);
      });
    };
    start();

    return () => {
      console.log('🧹 Admin dashboard cleaning up socket connection');
      try { socket?.disconnect?.(); } catch { /* noop */ }
    };
  }, []);

  const stats = kpis ? [
    { title: 'Total Orders', value: kpis.totalOrders.toLocaleString() },
    { title: 'Confirmed (30d)', value: kpis.confirmed30d.toLocaleString() },
    { title: 'Conversion Rate', value: `${kpis.conversionRate}%` },
    { title: 'Online Agents', value: `${kpis.onlineAgents}/${kpis.activeAgents}`, subtitle: `${kpis.activeAgents - kpis.onlineAgents} offline` },
    { title: 'Today\'s Orders', value: kpis.todayOrders.toString() },
    { title: 'Today\'s Calls', value: kpis.todayCalls.toString() },
    { title: 'Avg Orders/Agent', value: kpis.averageOrdersPerAgent.toString() },
    { title: 'Total Calls (30d)', value: kpis.totalCalls30d.toString() },
  ] : [];

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Company performance at a glance</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/chat">
            <Button variant="outline" className="flex items-center gap-2 relative">
              <MessageCircle className="w-4 h-4" />
              Team Chat
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Button>
          </Link>
          <button 
            onClick={fetchKPIs}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            Refresh
          </button>
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-muted-foreground">
              {socketConnected ? 'Real-time Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>
      <section className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          stats.map((s) => (
            <Card key={s.title} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">{s.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{s.value}</div>
                {s.subtitle && (
                  <div className="text-xs text-muted-foreground mt-1">{s.subtitle}</div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </section>
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>Agent Status</span>
                {kpis && kpis.agentsWithStatus.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">
                    {kpis.agentsWithStatus.filter(a => a.status === 'online').length} Online
                  </span>
                )}
              </CardTitle>
              {lastUpdated && (
                <span className="text-xs text-muted-foreground">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                      <div>
                        <div className="h-4 w-24 bg-gray-300 rounded"></div>
                        <div className="h-3 w-32 bg-gray-200 rounded mt-1"></div>
                      </div>
                    </div>
                    <div className="h-4 w-12 bg-gray-300 rounded"></div>
                  </div>
                ))}
              </div>
            ) : kpis && kpis.agentsWithStatus.length > 0 ? (
              <>
                <div className="space-y-2">
                  {kpis.agentsWithStatus
                    .sort((a, b) => {
                      // Sort online first, then offline
                      if (a.status === 'online' && b.status !== 'online') return -1;
                      if (a.status !== 'online' && b.status === 'online') return 1;
                      return 0;
                    })
                    .slice(0, 5)
                    .map((agent, index) => (
                    <div 
                      key={agent.id} 
                      className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-sm group"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${
                            agent.status === 'online' 
                              ? 'from-green-400 to-green-600' 
                              : 'from-gray-300 to-gray-500'
                          } flex items-center justify-center text-white font-semibold text-sm shadow-sm`}>
                            {agent.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                            agent.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {agent.name}
                            </div>
                            {index === 0 && agent.status === 'online' && (
                              <span className="px-1.5 py-0.5 text-[10px] bg-green-100 text-green-700 rounded font-medium">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{agent.email}</div>
                        </div>
                      </div>
                      <div className="text-right ml-3">
                        <div className={`text-xs font-medium ${
                          agent.status === 'online' ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {agent.status === 'online' ? 'Online' : 'Offline'}
                        </div>
                        {agent.lastSeen && agent.status === 'offline' && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(agent.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {kpis.agentsWithStatus.length > 5 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAgentsModalOpen(true)}
                      className="w-full group hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200"
                    >
                      <Users className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                      View All Agents
                      <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 group-hover:bg-blue-100 text-gray-700 group-hover:text-blue-700 rounded-full font-medium transition-colors">
                        {kpis.agentsWithStatus.length}
                      </span>
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No agent data available</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Agents (Conversions)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : kpis && kpis.topAgents.length > 0 ? (
              <div className="space-y-3">
                {kpis.topAgents.map((agent, index) => (
                  <div key={agent.name} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">#{index + 1}</span>
                      <span className="text-sm">{agent.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{agent.conversionRate}%</div>
                      <div className="text-xs text-muted-foreground">{agent.confirmed}/{agent.assigned}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No agent data available</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : kpis ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Avg Calls per Order:</span>
                  <span className="text-sm font-medium">{kpis.averageCallsPerOrder}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Calls (30d):</span>
                  <span className="text-sm font-medium">{kpis.totalCalls30d}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Active Orders:</span>
                  <span className="text-sm font-medium">{kpis.active30d}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Postponed Orders:</span>
                  <span className="text-sm font-medium">{kpis.postponed30d}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>
      </section>
      
      {/* Chat Widget */}
      {currentUser && (
        <ChatWidget 
          currentUserId={currentUser.id} 
          currentUserRole={currentUser.role} 
        />
      )}

      {/* Agents Modal */}
      {kpis && (
        <AgentsModal
          isOpen={isAgentsModalOpen}
          onClose={() => setIsAgentsModalOpen(false)}
          agents={kpis.agentsWithStatus}
        />
      )}
    </main>
  );
}








