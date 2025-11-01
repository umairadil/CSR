"use client";
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

type Props = { open: boolean; orderId: string | null; onClose: () => void };

export function OrderDetailsModal({ open, orderId, onClose }: Props) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !orderId) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/orders/${orderId}`)
      .then(async (r) => ({ ok: r.ok, json: r.ok ? await r.json() : null }))
      .then(({ ok, json }) => { if (!cancelled) setData(ok ? json : null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, orderId]);

  return (
    <AnimatePresence>
      {open && orderId ? (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="w-full max-w-2xl rounded-xl border bg-background p-6 shadow-lg" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>
            <div className="mb-4 flex items-center justify-between">
              <div className="text-lg font-semibold">Order Details</div>
              <Button variant="ghost" onClick={onClose}>Close</Button>
            </div>
            {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
            {!loading && data && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Order ID:</span> {data.id}</div>
                <div><span className="text-muted-foreground">Created:</span> {new Date(data.createdAt).toLocaleString()}</div>
                <div><span className="text-muted-foreground">Customer:</span> {data.customerName}</div>
                <div><span className="text-muted-foreground">Phone:</span> {data.mobileNumber}</div>
                <div className="md:col-span-2"><span className="text-muted-foreground">Address:</span> {data.address}</div>
                <div><span className="text-muted-foreground">City:</span> {data.city}</div>
                <div><span className="text-muted-foreground">COD:</span> Rs {Number(data.codAmount).toFixed(2)}</div>
                <div><span className="text-muted-foreground">Status:</span> {data.status}</div>
                <div className="md:col-span-2">
                  <div className="text-muted-foreground">Products</div>
                  <div className="mt-1 rounded border p-2">
                    {(() => { try { const items = JSON.parse(data.productsJson || '[]'); return items.map((i: any, idx: number) => (<div key={idx}>{i.name} ×{i.qty} — Rs {Number(i.price).toFixed(2)}</div>)); } catch { return <div>-</div>; } })()}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-muted-foreground mb-2">Call Attempts ({data.attempts?.length || 0})</div>
                  <div className="mt-1 rounded border p-3 max-h-48 overflow-y-auto">
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
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}





