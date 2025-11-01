"use client";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy load the heavy grid component to reduce initial bundle size
const OrdersManagementGrid = dynamic(() => import('@/components/admin/OrdersManagementGrid').then(m => m.OrdersManagementGrid), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[520px]">
      <div className="flex items-center gap-2 text-blue-600">
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-medium">Loading orders grid...</span>
      </div>
    </div>
  ),
});

export default function AdminOrdersPage() {
  const [tab, setTab] = useState<'unassigned' | 'assigned'>('unassigned');

  return (
    <main className="container mx-auto px-4 py-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-semibold">Order Management</h1>
          <p className="text-muted-foreground mt-1">Assign and manage orders in real-time</p>
        </div>
        <div className="inline-flex rounded-md border p-1 bg-gray-50">
          <Button 
            variant={tab === 'unassigned' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setTab('unassigned')}
            className="transition-all duration-200"
          >
            Unassigned
          </Button>
          <Button 
            variant={tab === 'assigned' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setTab('assigned')}
            className="transition-all duration-200"
          >
            Assigned
          </Button>
        </div>
      </motion.div>

      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-8"
      >
        <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              {tab === 'unassigned' ? 'Unassigned Orders' : 'Assigned Orders'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <OrdersManagementGrid mode={tab} />
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.section>
    </main>
  );
}







