"use client";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { LiveOrdersGrid } from '@/components/agent/LiveOrdersGrid';
import { Filter, PlayCircle, Eye, CheckCircle, PauseCircle, XCircle, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { CallModal } from '@/components/agent/CallModal';
import { OrderDetailsModal } from '@/components/agent/OrderDetailsModal';
import { OrderDetailsWithCalling } from '@/components/agent/OrderDetailsWithCalling';
import { NoOrdersModal } from '@/components/agent/NoOrdersModal';
import { PostponeModal } from '@/components/agent/PostponeModal';
import { ChatWidget } from '@/components/chat/ChatWidget';
import Link from 'next/link';

interface AgentKPIs {
  totalCalls: number;
  assignedOrders: number;
  confirmed: number;
  cancelled: number;
  active: number;
  postponed: number;
  conversionRate: number;
  todayCalls: number;
  todayOrders: number;
  averageCallsPerOrder: number;
  successRate: number;
}

export default function AgentDashboardPage() {
  const [search, setSearch] = useState('');
  const [openCall, setOpenCall] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [comprehensiveModalOpen, setComprehensiveModalOpen] = useState(false);
  const [modalOrderId, setModalOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'CONFIRMED' | 'POSTPONED' | 'CANCELLED'>('ACTIVE');
  const [noOrdersModalOpen, setNoOrdersModalOpen] = useState(false);
  const [noOrdersMessage, setNoOrdersMessage] = useState('');
  const [postponeModalOpen, setPostponeModalOpen] = useState(false);
  const [postponeOrderId, setPostponeOrderId] = useState<string | null>(null);
  const [postponeCustomerName, setPostponeCustomerName] = useState('');
  const [kpis, setKpis] = useState<AgentKPIs | null>(null);
  const [gridRefreshTrigger, setGridRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isInCallMode, setIsInCallMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchKPIs = async () => {
    try {
      const response = await fetch('/api/agent/kpis');
      if (response.ok) {
        const data = await response.json();
        setKpis(data);
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
            const userResponse = await fetch('/api/agent/kpis');
            if (userResponse.ok) {
              const userData = await userResponse.json();
              setCurrentUser({
                id: userData.agentId,
                role: 'CSR_AGENT'
              });
            }
          }
        }
      } catch (error) {
        console.error('Error getting user info:', error);
      }
    };
    
    getUserInfo();
    
    // Listen for auto-next-call events
    const handleAutoNextCall = (event: CustomEvent) => {
      const { orderId } = event.detail;
      setModalOrderId(orderId);
      setComprehensiveModalOpen(true);
    };
    
    window.addEventListener('autoNextCall', handleAutoNextCall as EventListener);
    
    return () => {
      window.removeEventListener('autoNextCall', handleAutoNextCall as EventListener);
      clearInterval(unreadInterval);
    };
  }, []);

  // Round-robin functionality for Start Calling
  const handleStartCalling = async () => {
    try {
      // Enter call mode
      setIsInCallMode(true);
      
      // Fetch active orders for the agent
      const response = await fetch(`/api/orders?status=ACTIVE&assigned=assigned`);
      if (response.ok) {
        const data = await response.json();
        const activeOrders = data.rows || [];
        
        if (activeOrders.length === 0) {
          setNoOrdersMessage('No active orders available for calling');
          setNoOrdersModalOpen(true);
          setIsInCallMode(false); // Exit call mode if no orders
          return;
        }
        
        // Advanced round-robin: prioritize orders with fewer attempts
        const ordersWithAttempts = await Promise.all(
          activeOrders.map(async (order: any) => {
            const attemptsResponse = await fetch(`/api/orders/${order.id}/attempts`);
            const attempts = attemptsResponse.ok ? await attemptsResponse.json() : [];
            return { ...order, attemptCount: attempts.length };
          })
        );
        
        // Sort by attempt count (ascending) and then by creation date (ascending)
        const sortedOrders = ordersWithAttempts.sort((a, b) => {
          if (a.attemptCount !== b.attemptCount) {
            return a.attemptCount - b.attemptCount;
          }
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        
        const nextOrder = sortedOrders[0];
        
        // Open modal with the selected order
        setModalOrderId(nextOrder.id);
        setComprehensiveModalOpen(true);
      } else {
        console.error('Failed to fetch active orders');
        setNoOrdersMessage('Failed to fetch active orders. Please try again.');
        setNoOrdersModalOpen(true);
        setIsInCallMode(false); // Exit call mode on error
      }
    } catch (error) {
      console.error('Error in Start Calling:', error);
      setNoOrdersMessage('Error starting call session. Please try again.');
      setNoOrdersModalOpen(true);
      setIsInCallMode(false); // Exit call mode on error
    }
  };

  const [postponeLoading, setPostponeLoading] = useState(false);

  const handlePostpone = async (dispatchDate: Date) => {
    if (!postponeOrderId) return;
    
    setPostponeLoading(true);
    try {
      const response = await fetch(`/api/orders/${postponeOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'POSTPONED',
          dispatchDate: dispatchDate.toISOString()
        }),
      });
      
      if (response.ok) {
        // Refresh KPIs and trigger grid refresh
        await fetchKPIs();
        
        // Trigger grid refresh
        setGridRefreshTrigger(prev => prev + 1);
        
        setPostponeModalOpen(false);
        setPostponeOrderId(null);
        setPostponeCustomerName('');
      } else {
        console.error('Failed to postpone order');
      }
    } catch (error) {
      console.error('Error postponing order:', error);
    } finally {
      setPostponeLoading(false);
    }
  };

  const stats = kpis ? [
    { title: 'Total Calls (30d)', value: kpis.totalCalls.toString() },
    { title: 'Assigned Orders (30d)', value: kpis.assignedOrders.toString() },
    { title: 'Confirmed', value: kpis.confirmed.toString() },
    { title: 'Cancelled', value: kpis.cancelled.toString() },
    { title: 'Conversion Rate', value: `${kpis.conversionRate}%` },
    { title: 'Today\'s Calls', value: kpis.todayCalls.toString() },
    { title: 'Today\'s Orders', value: kpis.todayOrders.toString() },
    { title: 'Avg Calls/Order', value: kpis.averageCallsPerOrder.toString() },
    { title: 'Success Rate', value: `${kpis.successRate}%` },
  ] : [];

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Agent Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your performance and live orders</p>
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
        </div>
      </div>

      <section className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 9 }).map((_, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.05 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Loading...</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          stats.map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.05 }}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">{s.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{s.value}</div>
              </CardContent>
            </Card>
          </motion.div>
          ))
        )}
      </section>

      <section className="mt-8">
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <CardTitle>Live Orders</CardTitle>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                {/* Search Bar */}
                <div className="w-full sm:w-auto">
                  <Input 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                    placeholder="Search name / mobile / city / address" 
                    className="w-full sm:w-[260px]" 
                  />
                </div>
                
                {/* Controls Row */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* Tab Buttons */}
                  <div className="flex border rounded-md">
                    <Button 
                      variant={activeTab === 'ACTIVE' ? 'default' : 'ghost'} 
                      size="sm" 
                      onClick={() => setActiveTab('ACTIVE')}
                      className="rounded-r-none"
                    >
                      Active
                    </Button>
                    <Button 
                      variant={activeTab === 'CONFIRMED' ? 'default' : 'ghost'} 
                      size="sm" 
                      onClick={() => setActiveTab('CONFIRMED')}
                      className="rounded-none"
                    >
                      Confirmed
                    </Button>
                    <Button 
                      variant={activeTab === 'POSTPONED' ? 'default' : 'ghost'} 
                      size="sm" 
                      onClick={() => setActiveTab('POSTPONED')}
                      className="rounded-none"
                    >
                      Postponed
                    </Button>
                    <Button 
                      variant={activeTab === 'CANCELLED' ? 'default' : 'ghost'} 
                      size="sm" 
                      onClick={() => setActiveTab('CANCELLED')}
                      className="rounded-l-none"
                    >
                      Cancelled
                    </Button>
                  </div>
                  
                  {/* Start Calling Button */}
                  <Button 
                    size="sm" 
                    onClick={handleStartCalling}
                    variant={isInCallMode ? "default" : "outline"}
                    className={isInCallMode ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    <PlayCircle className="mr-2 h-4 w-4" /> 
                    {isInCallMode ? 'In Call Mode' : 'Start Calling'}
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <LiveOrdersGrid
              search={search}
              status={activeTab}
              refreshTrigger={gridRefreshTrigger}
              onReadySelectFirst={(row) => {
                if (row) setCurrentOrder({ id: row.id, customerName: row.customerName, mobileNumber: row.mobileNumber, address: row.address, codAmount: row.codAmount });
              }}
              onSelectionChange={(row) => {
                console.log('Dashboard selection changed to:', row?.id, row?.customerName);
                setCurrentOrder(row ? { id: row.id, customerName: row.customerName, mobileNumber: row.mobileNumber, address: row.address, codAmount: row.codAmount } : null);
              }}
              onRowDoubleClick={(row) => {
                console.log('=== DOUBLE CLICK DEBUG ===');
                console.log('Double-clicked row ID:', row.id);
                console.log('Double-clicked row customer:', row.customerName);
                console.log('Full row data:', row);
                
                // Direct approach - set modal order ID and open modal
                setModalOrderId(row.id);
                setComprehensiveModalOpen(true);
                console.log('Modal order ID set to:', row.id);
              }}
              onRowClicked={(row) => {
                console.log('=== SINGLE CLICK DEBUG ===');
                console.log('Single-clicked row ID:', row.id);
                console.log('Single-clicked row customer:', row.customerName);
                
                // Also handle single click for testing
                setModalOrderId(row.id);
                setComprehensiveModalOpen(true);
                console.log('Modal order ID set to (single click):', row.id);
              }}
            />
          </CardContent>
        </Card>
      </section>
      <CallModal
        open={openCall}
        order={currentOrder}
        onClose={() => setOpenCall(false)}
        onResolved={() => {
          setOpenCall(false);
        }}
      />
      <OrderDetailsModal open={detailsOpen} orderId={currentOrder?.id ?? null} onClose={() => setDetailsOpen(false)} />
      <OrderDetailsWithCalling 
        key={modalOrderId} // Force re-render when order changes
        open={comprehensiveModalOpen} 
        orderId={modalOrderId} 
        isInCallMode={isInCallMode}
        onClose={() => {
          setComprehensiveModalOpen(false);
          setModalOrderId(null);
          setIsInCallMode(false); // Exit call mode when modal is closed
        }}
        onOrderUpdated={() => {
          fetchKPIs();
          setGridRefreshTrigger(prev => prev + 1);
        }}
        onPostpone={(orderId, customerName) => {
          setPostponeOrderId(orderId);
          setPostponeCustomerName(customerName);
          setPostponeModalOpen(true);
        }}
      />
      
      {/* No Orders Modal */}
      <NoOrdersModal
        open={noOrdersModalOpen}
        onClose={() => setNoOrdersModalOpen(false)}
        onRefresh={async () => {
          setNoOrdersModalOpen(false);
          // Refresh KPIs and grid data
          await fetchKPIs();
          // Trigger grid refresh
          setGridRefreshTrigger(prev => prev + 1);
        }}
        message={noOrdersMessage}
        showRefresh={true}
      />
      
      {/* Postpone Modal */}
      <PostponeModal
        open={postponeModalOpen}
        onClose={() => {
          setPostponeModalOpen(false);
          setPostponeOrderId(null);
          setPostponeCustomerName('');
        }}
        onPostpone={handlePostpone}
        orderId={postponeOrderId || ''}
        customerName={postponeCustomerName}
        loading={postponeLoading}
      />
      
      {/* Chat Widget */}
      {currentUser && (
        <ChatWidget 
          currentUserId={currentUser.id} 
          currentUserRole={currentUser.role} 
        />
      )}
    </main>
  );
}


