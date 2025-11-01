"use client";
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, PhoneOff, Clock, XCircle, UserX, MessageSquare, CheckCircle, PauseCircle } from 'lucide-react';

type Props = { 
  open: boolean; 
  orderId: string | null; 
  onClose: () => void;
  onOrderUpdated?: () => void;
  onPostpone?: (orderId: string, customerName: string) => void;
  isInCallMode?: boolean;
};

export function OrderDetailsWithCalling({ open, orderId, onClose, onOrderUpdated, onPostpone, isInCallMode = false }: Props) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<'CONFIRMED' | 'CANCELLED' | 'POSTPONED' | 'ATTEMPT' | null>(null);
  const [showAttemptForm, setShowAttemptForm] = useState(false);
  const [attemptResult, setAttemptResult] = useState<'NO_ANSWER' | 'BUSY' | 'WRONG_NUMBER' | 'CUSTOMER_ASKED_TO_CALL_LATER' | 'CUSTOMER_NOT_INTERESTED' | 'OTHER'>('NO_ANSWER');
  const [attemptNotes, setAttemptNotes] = useState('');
  const [reason, setReason] = useState('No Response');

  // Reset form state when order changes
  useEffect(() => {
    setShowAttemptForm(false);
    setAttemptResult('NO_ANSWER');
    setAttemptNotes('');
    setReason('No Response');
  }, [orderId]);

  // Add ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    // Always clear data when orderId changes
    setData(null);
    setLoading(false);
    
    if (!open || !orderId) {
      return;
    }
    
    let cancelled = false;
    setLoading(true);
    
    // Add a small delay to ensure previous data is cleared
    const timeoutId = setTimeout(() => {
      fetch(`/api/orders/${orderId}`)
        .then(async (r) => ({ ok: r.ok, json: r.ok ? await r.json() : null }))
        .then(({ ok, json }) => { 
          if (!cancelled) {
            setData(ok ? json : null);
          }
        })
        .catch((error) => {
          console.error('Error fetching order data:', error);
          if (!cancelled) setData(null);
        })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 50);
    
    return () => { 
      cancelled = true; 
      clearTimeout(timeoutId);
    };
  }, [open, orderId]);

  const refreshData = async () => {
    if (!orderId) return;
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const orderData = await response.json();
        setData(orderData);
        if (onOrderUpdated) onOrderUpdated();
      }
    } catch (error) {
      console.error('Error refreshing order data:', error);
    }
  };

  const recordAttempt = async () => {
    if (!orderId) return;
    setActionLoading('ATTEMPT');
    try {
      await fetch(`/api/orders/${orderId}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          result: attemptResult, 
          reason: attemptResult === 'OTHER' ? attemptNotes : undefined,
          notes: attemptNotes 
        }),
      });
      setActionLoading(null);
      setShowAttemptForm(false);
      setAttemptNotes('');
      await refreshData();
      if (onOrderUpdated) onOrderUpdated();
      
      // Auto-next-call functionality - ALSO for Record Attempt when in call mode
      if (isInCallMode) {
        // Small delay to ensure the attempt is recorded before opening next
        setTimeout(async () => {
          try {
            // Fetch next active order with better round-robin logic
            const nextResponse = await fetch(`/api/orders?status=ACTIVE&assigned=assigned`);
            if (nextResponse.ok) {
              const nextData = await nextResponse.json();
              const activeOrders = nextData.rows || [];
              
              if (activeOrders.length > 0) {
                // Sort by attempt count (prioritize orders with fewer attempts) and then by creation date
                const sortedOrders = activeOrders.sort((a: any, b: any) => {
                  const aAttempts = a.attemptCount || 0;
                  const bAttempts = b.attemptCount || 0;
                  
                  // First sort by attempt count (ascending - fewer attempts first)
                  if (aAttempts !== bAttempts) {
                    return aAttempts - bAttempts;
                  }
                  
                  // Then sort by creation date (ascending - older orders first)
                  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                });
                
                // Get the next order (first in sorted list)
                const nextOrder = sortedOrders[0];
                
                // Trigger next call by dispatching a custom event
                window.dispatchEvent(new CustomEvent('autoNextCall', { 
                  detail: { orderId: nextOrder.id } 
                }));
              } else {
                // No more active orders, close the modal
                onClose();
              }
            } else {
              // Error fetching orders, close the modal
              onClose();
            }
          } catch (error) {
            console.error('Error fetching next order:', error);
            // Close modal on error
            onClose();
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error recording attempt:', error);
      setActionLoading(null);
    }
  };

  const takeAction = async (action: 'CONFIRMED' | 'CANCELLED' | 'POSTPONED') => {
    if (!orderId) return;
    setActionLoading(action);
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action, 
          reason: action === 'CANCELLED' ? reason : undefined 
        }),
      });
      setActionLoading(null);
      await refreshData();
      if (onOrderUpdated) onOrderUpdated();
      
      // Auto-next-call functionality - ONLY when in call mode
      if (isInCallMode && (action === 'CONFIRMED' || action === 'CANCELLED' || action === 'POSTPONED')) {
        // Small delay to ensure the action completes before opening next
        setTimeout(async () => {
          try {
            // Fetch next active order with better round-robin logic
            const nextResponse = await fetch(`/api/orders?status=ACTIVE&assigned=assigned`);
            if (nextResponse.ok) {
              const nextData = await nextResponse.json();
              const activeOrders = nextData.rows || [];
              
              if (activeOrders.length > 0) {
                // Sort by attempt count (prioritize orders with fewer attempts) and then by creation date
                const sortedOrders = activeOrders.sort((a: any, b: any) => {
                  const aAttempts = a.attemptCount || 0;
                  const bAttempts = b.attemptCount || 0;
                  
                  // First sort by attempt count (ascending - fewer attempts first)
                  if (aAttempts !== bAttempts) {
                    return aAttempts - bAttempts;
                  }
                  
                  // Then sort by creation date (ascending - older orders first)
                  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                });
                
                // Get the next order (first in sorted list)
                const nextOrder = sortedOrders[0];
                
                // Trigger next call by dispatching a custom event
                window.dispatchEvent(new CustomEvent('autoNextCall', { 
                  detail: { orderId: nextOrder.id } 
                }));
              } else {
                // No more active orders, close the modal
                onClose();
              }
            } else {
              // Error fetching orders, close the modal
              onClose();
            }
          } catch (error) {
            console.error('Error fetching next order:', error);
            // Close modal on error
            onClose();
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error taking action:', error);
      setActionLoading(null);
    }
  };

  return (
    <AnimatePresence>
      {open && orderId ? (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={(e) => {
            // Close modal when clicking on the backdrop
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div 
            className="w-full max-w-4xl max-h-[90vh] rounded-xl border bg-background shadow-lg overflow-hidden" 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 20, opacity: 0 }}
            onClick={(e) => {
              // Prevent modal from closing when clicking inside the modal content
              e.stopPropagation();
            }}
          >
            <div className="flex h-full">
              {/* Left Panel - Order Details */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-lg font-semibold">
                    Order Details {orderId && `(ID: ${orderId.slice(-8)})`}
                    {data && (
                      <span className="ml-2 text-sm font-normal text-blue-600">
                        - {data.customerName}
                      </span>
                    )}
                  </div>
                  <Button variant="ghost" onClick={onClose}>Close</Button>
                </div>
                
                
                {loading && (
                  <div className="text-sm text-muted-foreground">
                    Loading order data for ID: {orderId?.slice(-8)}...
                  </div>
                )}
                
                {!loading && data && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Order ID:</span> {data.id}</div>
                      <div><span className="text-muted-foreground">Created:</span> {new Date(data.createdAt).toLocaleString()}</div>
                      <div><span className="text-muted-foreground">Customer:</span> {data.customerName}</div>
                      <div><span className="text-muted-foreground">Phone:</span> {data.mobileNumber}</div>
                      <div className="md:col-span-2"><span className="text-muted-foreground">Address:</span> {data.address}</div>
                      <div><span className="text-muted-foreground">City:</span> {data.city}</div>
                      <div><span className="text-muted-foreground">COD:</span> Rs {Number(data.codAmount).toFixed(2)}</div>
                      <div><span className="text-muted-foreground">Status:</span> 
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          data.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                          data.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          data.status === 'POSTPONED' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {data.status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-muted-foreground mb-2">Products</div>
                      <div className="rounded border p-3">
                        {(() => { 
                          try { 
                            const items = JSON.parse(data.productsJson || '[]'); 
                            return items.map((i: any, idx: number) => (
                              <div key={idx} className="flex justify-between">
                                <span>{i.name} ×{i.qty}</span>
                                <span>Rs {Number(i.price).toFixed(2)}</span>
                              </div>
                            )); 
                          } catch { 
                            return <div>-</div>; 
                          } 
                        })()}
                      </div>
                    </div>

                    <div>
                      <div className="text-muted-foreground mb-2">Call Attempts ({data.attempts?.length || 0})</div>
                      <div className="rounded border p-3 max-h-48 overflow-y-auto">
                        {(data.attempts ?? []).length === 0 && <div className="text-sm text-muted-foreground">No attempts recorded yet</div>}
                        {(data.attempts ?? []).map((a: any, index: number) => (
                          <div key={a.id} className={`flex items-start justify-between p-2 rounded ${index > 0 ? 'mt-2 border-t' : ''}`}>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">#{a.attemptNumber}</span>
                                <span className={`text-sm font-medium ${
                                  a.result === 'CONFIRMED' ? 'text-green-600' :
                                  a.result === 'CANCELLED' ? 'text-red-600' :
                                  a.result === 'POSTPONED' ? 'text-yellow-600' :
                                  'text-gray-600'
                                }`}>
                                  {a.result.replace(/_/g, ' ')}
                                </span>
                              </div>
                              {a.reason && (
                                <div className="text-xs text-muted-foreground mt-1">Reason: {a.reason}</div>
                              )}
                              {a.agent && (
                                <div className="text-xs text-muted-foreground">Agent: {a.agent.name || a.agent.email}</div>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground ml-2">
                              {new Date(a.createdAt).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Panel - Calling Actions */}
              <div className="w-80 border-l bg-gray-50 p-6">
                <div className="text-lg font-semibold mb-4">Call Actions</div>
                
                {data && (
                  <div className="space-y-4">
                    {/* Customer Info */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Customer Info</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-sm space-y-1">
                          <div className="font-medium">{data.customerName}</div>
                          <div className="text-muted-foreground">{data.mobileNumber}</div>
                          <div className="text-muted-foreground text-xs">{data.address}</div>
                          <div className="text-muted-foreground text-xs">
                            COD: Rs {Number(data.codAmount).toFixed(2)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Attempt Recording */}
                    {data.status === 'ACTIVE' && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Record Call Attempt</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {!showAttemptForm ? (
                            <Button 
                              variant="outline" 
                              onClick={() => setShowAttemptForm(true)}
                              className="w-full flex items-center gap-2"
                              disabled={!!actionLoading}
                            >
                              <Phone className="h-4 w-4" />
                              Record Attempt
                            </Button>
                          ) : (
                            <div className="space-y-3">
                              <select 
                                className="w-full rounded-md border px-3 py-2 text-sm" 
                                value={attemptResult} 
                                onChange={(e) => setAttemptResult(e.target.value as any)}
                              >
                                <option value="NO_ANSWER">No Answer</option>
                                <option value="BUSY">Busy</option>
                                <option value="WRONG_NUMBER">Wrong Number</option>
                                <option value="CUSTOMER_ASKED_TO_CALL_LATER">Customer Asked to Call Later</option>
                                <option value="CUSTOMER_NOT_INTERESTED">Customer Not Interested</option>
                                <option value="OTHER">Other</option>
                              </select>
                              <textarea
                                className="w-full rounded-md border px-3 py-2 text-sm"
                                placeholder="Additional notes (optional)"
                                value={attemptNotes}
                                onChange={(e) => setAttemptNotes(e.target.value)}
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={recordAttempt} 
                                  disabled={actionLoading === 'ATTEMPT'}
                                  loading={actionLoading === 'ATTEMPT'}
                                  loadingText="Recording..."
                                  className="flex-1"
                                >
                                  Record
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => setShowAttemptForm(false)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Final Actions */}
                    {data.status === 'ACTIVE' && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Final Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-2">
                          <Button 
                            onClick={() => takeAction('CONFIRMED')} 
                            disabled={!!actionLoading} 
                            loading={actionLoading === 'CONFIRMED'}
                            loadingText="Confirming..."
                            className="w-full"
                            variant="success"
                          >
                            ✅ Confirm Order
                          </Button>
                          <div className="grid grid-cols-2 gap-2">
                            <Button 
                              variant="secondary" 
                              onClick={() => {
                                if (onPostpone && orderId && data?.customerName) {
                                  onPostpone(orderId, data.customerName);
                                }
                              }} 
                              disabled={!!actionLoading}
                            >
                              ⏰ Postpone
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => takeAction('CANCELLED')} 
                              disabled={!!actionLoading}
                              loading={actionLoading === 'CANCELLED'}
                              loadingText="Cancelling..."
                            >
                              ❌ Cancel
                            </Button>
                          </div>
                          <select 
                            className="w-full rounded-md border px-3 py-2 text-sm" 
                            value={reason} 
                            onChange={(e) => setReason(e.target.value)}
                          >
                            {['No Response','Incorrect Number','Did Not Order','Price Too High','Duplicate','Other'].map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </CardContent>
                      </Card>
                    )}

                    {data.status !== 'ACTIVE' && (
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-sm text-muted-foreground text-center">
                            Order is {data.status.toLowerCase()}. No actions available.
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
