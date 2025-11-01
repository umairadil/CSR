"use client";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LiveOrdersGrid } from '@/components/agent/LiveOrdersGrid';
import { Eye, PlayCircle } from 'lucide-react';
import { CallModal } from '@/components/agent/CallModal';

export default function AgentOrdersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'CONFIRMED'>('ACTIVE');
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [openCall, setOpenCall] = useState(false);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">My Orders</h1>
          <p className="text-muted-foreground mt-1">Assigned orders and outcomes</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name / mobile / city / address" className="w-[260px]" />
          </div>
          <div className="inline-flex rounded-md border p-1">
            <Button variant={status === 'ACTIVE' ? 'default' : 'ghost'} size="sm" onClick={() => setStatus('ACTIVE')}>Active</Button>
            <Button variant={status === 'CONFIRMED' ? 'default' : 'ghost'} size="sm" onClick={() => setStatus('CONFIRMED')}>Confirmed</Button>
          </div>
          <Button size="sm" onClick={() => currentOrder && setOpenCall(true)} disabled={!currentOrder}><PlayCircle className="mr-2 h-4 w-4" /> Start Calling</Button>
          <Button size="sm" variant="outline" onClick={() => currentOrder && window.open(`/agent/orders/${currentOrder.id}`, '_blank')} disabled={!currentOrder}><Eye className="mr-2 h-4 w-4" /> View Details</Button>
        </div>
      </div>

      <section className="mt-8">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>{status === 'ACTIVE' ? 'Live Orders' : 'Confirmed Orders'}</CardTitle>
          </CardHeader>
          <CardContent>
            <LiveOrdersGrid
              search={search}
              status={status}
              onReadySelectFirst={(row) => {
                if (row) setCurrentOrder({ id: row.id, customerName: row.customerName, mobileNumber: row.mobileNumber, address: row.address, codAmount: row.codAmount });
              }}
              onSelectionChange={(row) => setCurrentOrder(row ? { id: row.id, customerName: row.customerName, mobileNumber: row.mobileNumber, address: row.address, codAmount: row.codAmount } : null)}
              onRowDoubleClick={(row) => { setCurrentOrder({ id: row.id, customerName: row.customerName, mobileNumber: row.mobileNumber, address: row.address, codAmount: row.codAmount }); setOpenCall(true); }}
            />
          </CardContent>
        </Card>
      </section>

      <CallModal open={openCall} order={currentOrder} onClose={() => setOpenCall(false)} onResolved={() => setOpenCall(false)} />
    </main>
  );
}









