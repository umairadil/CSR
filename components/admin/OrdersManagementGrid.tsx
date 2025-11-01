"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GetRowIdParams, GridApi, GridReadyEvent } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import io from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type OrderRow = {
  id: string;
  createdAt: string;
  customerName: string;
  mobileNumber: string;
  city: string;
  address: string;
  codAmount: number;
  status: string;
  assignedToId?: string | null;
  assignedTo?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  attemptCount?: number;
  lastAttemptResult?: string | null;
  dispatchDate?: string | null;
  confirmationDate?: string | null;
};

export function OrdersManagementGrid({ mode }: { mode: 'unassigned' | 'assigned' }) {
  const gridApiRef = useRef<GridApi | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [search, setSearch] = useState('');
  const [agents, setAgents] = useState<{ id: string; name: string | null; email: string }[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [cache, setCache] = useState<{ [key: string]: { data: OrderRow[]; timestamp: number } }>({});

  useEffect(() => {
    // load active agents
    setLoadingAgents(true);
    fetch(`/api/admin/users?role=CSR_AGENT&status=ACTIVE&pageSize=500`)
      .then((r) => r.json())
      .then((json) => setAgents(json.rows ?? []))
      .finally(() => setLoadingAgents(false));
  }, []);

  const columnDefs = useMemo<ColDef[]>(
    () => [
      { field: 'id', headerName: 'Order ID', minWidth: 160 },
      { field: 'createdAt', headerName: 'Created', valueFormatter: (p) => new Date(p.value).toLocaleString(), minWidth: 160 },
      { field: 'customerName', headerName: 'Customer', minWidth: 150 },
      { field: 'mobileNumber', headerName: 'Phone', minWidth: 130 },
      { field: 'city', headerName: 'City', minWidth: 120 },
      { field: 'address', headerName: 'Address', flex: 1, minWidth: 200 },
      { field: 'codAmount', headerName: 'COD', valueFormatter: (p) => `Rs ${Number(p.value).toFixed(2)}`, minWidth: 120 },
      { 
        field: 'assignedTo', 
        headerName: 'Assigned Agent', 
        minWidth: 180,
        valueFormatter: (p) => {
          if (!p.value) return 'Unassigned';
          return p.value.name || p.value.email;
        },
        cellRenderer: (params: any) => {
          if (!params.value) {
            return React.createElement('span', { className: 'text-gray-500 italic' }, 'Unassigned');
          }
          return React.createElement('span', { className: 'text-blue-600 font-medium' }, params.value.name || params.value.email);
        }
      },
      { 
        field: 'status', 
        headerName: 'Status', 
        minWidth: 120,
        cellRenderer: (params: any) => {
          const status = params.value;
          let bgColor = 'bg-gray-200';
          let textColor = 'text-gray-800';
          if (status === 'CONFIRMED') {
            bgColor = 'bg-green-100';
            textColor = 'text-green-800';
          } else if (status === 'CANCELLED') {
            bgColor = 'bg-red-100';
            textColor = 'text-red-800';
          } else if (status === 'POSTPONED') {
            bgColor = 'bg-yellow-100';
            textColor = 'text-yellow-800';
          } else if (status === 'ACTIVE') {
            bgColor = 'bg-blue-100';
            textColor = 'text-blue-800';
          }
          return React.createElement('span', { className: `px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}` }, status);
        }
      },
      { 
        field: 'attemptCount', 
        headerName: 'Attempts', 
        minWidth: 100,
        cellRenderer: (params: any) => {
          const count = params.value || 0;
          let bgColor = 'bg-gray-200';
          let textColor = 'text-gray-800';
          if (count > 0 && count <= 2) {
            bgColor = 'bg-blue-100';
            textColor = 'text-blue-800';
          } else if (count > 2 && count <= 4) {
            bgColor = 'bg-yellow-100';
            textColor = 'text-yellow-800';
          } else if (count > 4) {
            bgColor = 'bg-red-100';
            textColor = 'text-red-800';
          }
          return React.createElement('span', { className: `px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}` }, count);
        }
      },
      { 
        field: 'lastAttemptResult', 
        headerName: 'Last Result', 
        minWidth: 140,
        cellRenderer: (params: any) => {
          const result = params.value;
          if (!result) {
            return React.createElement('span', { className: 'text-gray-400 italic' }, 'No attempts');
          }
          let bgColor = 'bg-gray-200';
          let textColor = 'text-gray-800';
          if (result === 'CONFIRMED') {
            bgColor = 'bg-green-100';
            textColor = 'text-green-800';
          } else if (result === 'CANCELLED') {
            bgColor = 'bg-red-100';
            textColor = 'text-red-800';
          } else if (result === 'POSTPONED') {
            bgColor = 'bg-yellow-100';
            textColor = 'text-yellow-800';
          } else {
            bgColor = 'bg-blue-100';
            textColor = 'text-blue-800';
          }
          return React.createElement('span', { className: `px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}` }, result.replace(/_/g, ' '));
        }
      },
      { 
        field: 'dispatchDate', 
        headerName: 'Dispatch Date', 
        minWidth: 140,
        valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString() : 'N/A'
      },
      { 
        field: 'confirmationDate', 
        headerName: 'Confirmed Date', 
        minWidth: 140,
        valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString() : 'N/A'
      },
    ],
    []
  );

  const getRowId = useCallback((params: GetRowIdParams) => params.data.id, []);

  const loadRows = useCallback(async (currentSearch: string) => {
    const cacheKey = `${mode}-${currentSearch}`;
    const now = Date.now();
    const CACHE_DURATION = 60000; // 60 seconds cache (increased from 30s)
    
    // Check cache first
    if (cache[cacheKey] && (now - cache[cacheKey].timestamp) < CACHE_DURATION) {
      console.log('Using cached data for', cacheKey);
      setRows(cache[cacheKey].data);
      return;
    }
    
    setLoading(true);
    try {
      const assigned = mode;
      const res = await fetch(`/api/orders?page=1&pageSize=500&sortBy=createdAt&sortDir=desc&assigned=${assigned}&search=${encodeURIComponent(currentSearch || '')}`, { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const text = await res.text();
      let json: any = null;
      try { json = text ? JSON.parse(text) : null; } catch (e) {
        setLastError(`Orders API ${res.status}: invalid JSON`);
      }
      if (!res.ok) {
        setLastError(`Orders API ${res.status}`);
        setRows([]);
        return;
      }
      setLastError(null);
      const orders = json?.rows ?? [];
      
      // Batch fetch all attempts at once instead of individual calls
      const orderIds = orders.map((order: any) => order.id);
      let allAttempts: { [orderId: string]: any[] } = {};
      
      if (orderIds.length > 0) {
        try {
          // Create a single batch request for all attempts
          const batchResponse = await fetch('/api/orders/batch-attempts', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            },
            body: JSON.stringify({ orderIds })
          });
          
          if (batchResponse.ok) {
            allAttempts = await batchResponse.json();
          }
        } catch (error) {
          console.warn('Batch attempts fetch failed, falling back to individual calls');
          // Fallback to individual calls if batch fails
          const attemptPromises = orderIds.map(async (orderId: string) => {
            try {
              const attemptsResponse = await fetch(`/api/orders/${orderId}/attempts`, { 
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' }
              });
              const attempts = attemptsResponse.ok ? await attemptsResponse.json() : [];
              return { orderId, attempts };
            } catch (error) {
              console.error(`Error fetching attempts for order ${orderId}:`, error);
              return { orderId, attempts: [] };
            }
          });
          
          const attemptResults = await Promise.all(attemptPromises);
          allAttempts = attemptResults.reduce((acc, { orderId, attempts }) => {
            acc[orderId] = attempts;
            return acc;
          }, {} as { [orderId: string]: any[] });
        }
      }
      
      // Enhance orders with attempt data and agent information
      const enhancedOrders = orders.map((order: any) => {
        const attempts = allAttempts[order.id] || [];
        
        // Get agent information if assigned
        let assignedTo = null;
        if (order.assignedToId) {
          const agent = agents.find(a => a.id === order.assignedToId);
          if (agent) {
            assignedTo = agent;
          }
        }
        
        return {
          ...order,
          assignedTo,
          attemptCount: attempts.length,
          lastAttemptResult: attempts.length > 0 ? attempts[attempts.length - 1].result : null
        };
      });
      
      // Cache the results
      setCache(prev => ({
        ...prev,
        [cacheKey]: { data: enhancedOrders, timestamp: now }
      }));
      
      setRows(enhancedOrders);
    } catch (e) {
      setLastError('Network error');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [mode, agents, cache]);

  const onGridReady = useCallback(async (e: GridReadyEvent) => {
    gridApiRef.current = e.api;
    await loadRows(search);
  }, [loadRows, search]);

  useEffect(() => {
    loadRows(search);
  }, [loadRows, search, mode]);

  async function assignSelected(toAgentId: string | null) {
    const api = gridApiRef.current;
    const selected = api?.getSelectedRows() ?? [];
    if (selected.length === 0) return;
    
    setAssigning(true);
    try {
      const orderIds = selected.map((r: any) => r.id);
      const response = await fetch('/api/orders/assign', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ orderIds, agentId: toAgentId }) 
      });
      
      if (response.ok) {
        // Clear selection after successful assignment
        api?.deselectAll();
        setSelectedAgentId('');
        
        // Clear cache to force refresh
        setCache({});
        await loadRows(search);
      } else {
        setLastError('Failed to assign orders');
      }
    } catch (error) {
      setLastError('Network error during assignment');
    } finally {
      setAssigning(false);
    }
  }

  useEffect(() => {
    // Use polling-first for production (SmartASP doesn't support WebSocket well)
    const transports = process.env.NODE_ENV === 'production' 
      ? ['polling', 'websocket'] 
      : ['websocket', 'polling'];
    
    const socket = io('/orders', { 
      transports, 
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 10000
    });
    
    function onConnect() { setSocketConnected(true); }
    function onDisconnect() { setSocketConnected(false); }
    function refresh() { 
      setCache({}); // Clear cache on socket events
      loadRows(search); 
    }
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('orderAssigned', refresh);
    socket.on('orderUpdated', refresh);
    socket.on('orderStatusChanged', refresh);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('orderAssigned', refresh);
      socket.off('orderUpdated', refresh);
      socket.off('orderStatusChanged', refresh);
      socket.close();
    };
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="Search name / mobile / city / address" 
          className="w-[260px] transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
        />
        <div className="ml-auto flex items-center gap-2">
          <select 
            className="h-9 rounded border bg-background px-2 text-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            value={selectedAgentId} 
            onChange={(e) => setSelectedAgentId(e.target.value)}
            disabled={loadingAgents}
          >
            <option value="">
              {loadingAgents ? 'Loading agents...' : 'Select agent…'}
            </option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.name ?? a.email}</option>
            ))}
          </select>
          {mode === 'unassigned' && (
            <Button 
              size="sm" 
              onClick={() => selectedAgentId && assignSelected(selectedAgentId)} 
              disabled={!selectedAgentId || assigning || loadingAgents}
              loading={assigning}
              loadingText="Assigning..."
            >
              Assign
            </Button>
          )}
          {mode === 'assigned' && (
            <>
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={() => selectedAgentId && assignSelected(selectedAgentId)} 
                disabled={!selectedAgentId || assigning || loadingAgents}
                loading={assigning}
                loadingText="Reassigning..."
              >
                Reassign
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => assignSelected(null)}
                disabled={assigning}
                loading={assigning}
                loadingText="Removing..."
              >
                Remove
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="ag-theme-quartz relative" style={{ height: 520 }}>
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium">Loading orders...</span>
            </div>
          </div>
        )}
        <AgGridReact
          columnDefs={columnDefs}
          getRowId={getRowId}
          rowData={rows}
          onGridReady={onGridReady}
          animateRows
          suppressAggFuncInHeader
          rowSelection="multiple"
          defaultColDef={{ sortable: true, resizable: true, filter: true, minWidth: 100 }}
        />
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-orange-500'}`}></div>
              <span>Socket: {socketConnected ? 'Connected' : 'Connecting...'}</span>
            </div>
            {loading && (
              <div className="flex items-center gap-1 text-blue-600">
                <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading...</span>
              </div>
            )}
          </div>
          <div className="text-right">
            {rows.length > 0 && <span>{rows.length} orders</span>}
          </div>
        </div>
        {lastError && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
            {lastError}. Check auth and DB.
          </div>
        )}
        {!lastError && !loading && rows.length === 0 && (
          <div className="mt-2 p-4 text-center text-sm text-muted-foreground bg-gray-50 rounded">
            No orders found for this view.
          </div>
        )}
      </div>
    </div>
  );
}


