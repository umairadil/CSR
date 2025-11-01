"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Phone, PhoneOff, Clock, XCircle, UserX, MessageSquare } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  order: {
    id: string;
    customerName: string;
    mobileNumber: string;
    address: string;
    codAmount: number | string;
  } | null;
  onResolved: (action: 'CONFIRMED' | 'CANCELLED' | 'POSTPONED') => void;
};

export function CallModal({ open, onClose, order, onResolved }: Props) {
  const [loading, setLoading] = useState<'CONFIRMED' | 'CANCELLED' | 'POSTPONED' | 'ATTEMPT' | null>(null);
  const [reason, setReason] = useState('No Response');
  const [attemptResult, setAttemptResult] = useState<'NO_ANSWER' | 'BUSY' | 'WRONG_NUMBER' | 'CUSTOMER_ASKED_TO_CALL_LATER' | 'CUSTOMER_NOT_INTERESTED' | 'OTHER'>('NO_ANSWER');
  const [attemptNotes, setAttemptNotes] = useState('');
  const [showAttemptForm, setShowAttemptForm] = useState(false);

  async function recordAttempt() {
    if (!order) return;
    setLoading('ATTEMPT');
    try {
      await fetch(`/api/orders/${order.id}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          result: attemptResult, 
          reason: attemptResult === 'OTHER' ? attemptNotes : undefined,
          notes: attemptNotes 
        }),
      });
      setLoading(null);
      setShowAttemptForm(false);
      setAttemptNotes('');
    } catch (error) {
      console.error('Error recording attempt:', error);
      setLoading(null);
    }
  }

  async function act(action: 'CONFIRMED' | 'CANCELLED' | 'POSTPONED') {
    if (!order) return;
    setLoading(action);
    await fetch(`/api/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason: action === 'CANCELLED' ? reason : undefined }),
    });
    setLoading(null);
    onResolved(action);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && order ? (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-lg" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>
            <div className="mb-4 text-lg font-semibold">Call Actions</div>
            <div className="space-y-1 text-sm">
              <div className="font-medium">{order.customerName}</div>
              <div className="text-muted-foreground">{order.mobileNumber}</div>
              <div className="text-muted-foreground">{order.address}</div>
            <div className="text-muted-foreground">
              {(() => {
                const cod = Number((order as any).codAmount);
                const formatted = Number.isFinite(cod) ? cod.toFixed(2) : String((order as any).codAmount ?? '');
                return <>COD: Rs {formatted}</>;
              })()}
            </div>
            </div>
            <div className="mt-4 grid gap-2">
              {/* Attempt Recording Section */}
              {!showAttemptForm ? (
                <Button 
                  variant="outline" 
                  onClick={() => setShowAttemptForm(true)}
                  className="flex items-center gap-2"
                  disabled={!!loading}
                >
                  <Phone className="h-4 w-4" />
                  Record Call Attempt
                </Button>
              ) : (
                <div className="space-y-3 p-3 border rounded-md bg-gray-50">
                  <div className="text-sm font-medium">Record Call Attempt</div>
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
                      disabled={loading === 'ATTEMPT'}
                      className="flex-1"
                    >
                      {loading === 'ATTEMPT' ? 'Recording...' : 'Record Attempt'}
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

              {/* Final Actions Section */}
              <div className="border-t pt-3">
                <div className="text-sm font-medium mb-2">Final Actions</div>
                <Button onClick={() => act('CONFIRMED')} disabled={!!loading} className="w-full">
                  {loading === 'CONFIRMED' ? 'Confirming…' : '✅ Confirm Order'}
                </Button>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button variant="secondary" onClick={() => act('POSTPONED')} disabled={!!loading}>
                    ⏰ Postpone
                  </Button>
                  <Button variant="outline" onClick={() => act('CANCELLED')} disabled={!!loading}>
                    ❌ Cancel
                  </Button>
                </div>
                <select className="mt-2 w-full rounded-md border px-3 py-2 text-sm" value={reason} onChange={(e) => setReason(e.target.value)}>
                  {['No Response','Incorrect Number','Did Not Order','Price Too High','Duplicate','Other'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <Button variant="ghost" onClick={onClose} className="w-full">Close</Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}


