"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GetRowIdParams, GridApi, GridReadyEvent } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import io from 'socket.io-client';

type OrderRow = {
  id: string;
  createdAt: string;
  customerName: string;
  mobileNumber: string;
  productsJson: string;
  quantity: number;
  city: string;
  address: string;
  codAmount: number;
  remarks?: string | null;
  status: string;
};

export function LiveOrdersGrid({ search, status = 'ALL', onReadySelectFirst, onSelectionChange, onRowDoubleClick, onRowClicked, refreshTrigger }: { search: string; status?: string; onReadySelectFirst?: (row: OrderRow | null) => void; onSelectionChange?: (row: OrderRow | null) => void; onRowDoubleClick?: (row: OrderRow) => void; onRowClicked?: (row: OrderRow) => void; refreshTrigger?: number }) {
  const gridApiRef = useRef<GridApi | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);

  const columnDefs = useMemo<ColDef[]>(
    () => [
      { field: 'id', headerName: 'Order ID', minWidth: 180 },
      { 
        field: 'attemptCount', 
        headerName: 'Attempts', 
        minWidth: 100,
        valueFormatter: (p) => p.value || '0',
        cellRenderer: (params: any) => {
          const count = params.value || 0;
          const color = count === 0 ? 'text-green-600' : count <= 2 ? 'text-yellow-600' : 'text-red-600';
          return React.createElement('span', { 
            className: `${color} font-semibold` 
          }, count);
        }
      },
      { 
        field: 'lastAttemptResult', 
        headerName: 'Last Result', 
        minWidth: 120,
        valueFormatter: (p) => p.value || 'No attempts',
        cellRenderer: (params: any) => {
          const result = params.value;
          if (!result) {
            return React.createElement('span', { 
              className: 'text-gray-500' 
            }, 'No attempts');
          }
          
          const colorMap: { [key: string]: string } = {
            'CONFIRMED': 'text-green-600',
            'CANCELLED': 'text-red-600', 
            'POSTPONED': 'text-yellow-600',
            'NO_ANSWER': 'text-orange-600',
            'BUSY': 'text-orange-600',
            'WRONG_NUMBER': 'text-red-600',
            'CUSTOMER_ASKED_TO_CALL_LATER': 'text-blue-600',
            'CUSTOMER_NOT_INTERESTED': 'text-red-600',
            'OTHER': 'text-gray-600'
          };
          
          const color = colorMap[result] || 'text-gray-600';
          const displayText = result.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase());
          return React.createElement('span', { 
            className: `${color} text-xs font-medium` 
          }, displayText);
        }
      },
      { field: 'createdAt', headerName: 'Created At', valueFormatter: (p) => (p.value ? new Date(p.value).toLocaleString() : ''), minWidth: 160 },
      { field: 'customerName', headerName: 'Customer Name', minWidth: 150 },
      { field: 'mobileNumber', headerName: 'Mobile Number', minWidth: 140 },
      { field: 'productsJson', headerName: 'Product(s)', valueFormatter: (p) => {
          try { const items = JSON.parse(p.value || '[]'); return items.map((i: any) => `${i.name} x${i.qty}`).join(', '); } catch { return ''; }
        }, minWidth: 200 },
      { field: 'quantity', headerName: 'Qty', editable: true, maxWidth: 100 },
      { field: 'city', headerName: 'City', minWidth: 120 },
      { field: 'address', headerName: 'Address', editable: true, flex: 1, minWidth: 220 },
      { field: 'codAmount', headerName: 'COD', editable: true, valueFormatter: (p) => `Rs ${Number(p.value).toFixed(2)}`, minWidth: 120 },
      { field: 'remarks', headerName: 'Remarks', editable: true, minWidth: 180 },
      { field: 'status', headerName: 'Status', minWidth: 120 },
      { 
        field: 'dispatchDate', 
        headerName: 'Dispatch Date', 
        minWidth: 140,
        valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString() : '',
        cellRenderer: (params: any) => {
          if (!params.value) return React.createElement('span', { className: 'text-gray-400' }, 'Not set');
          const date = new Date(params.value);
          const isPast = date < new Date();
          const color = isPast ? 'text-red-600' : 'text-blue-600';
          return React.createElement('span', { 
            className: `${color} text-sm font-medium` 
          }, date.toLocaleDateString());
        }
      },
    ],
    []
  );

  const getRowId = useCallback((params: GetRowIdParams) => params.data.id, []);

  // Get current agent ID
  const getAgentId = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const session = await response.json();
        const user = session?.user;
        if (user?.email) {
          // Get user ID from database by fetching user info
          const userResponse = await fetch('/api/agent/kpis');
          if (userResponse.ok) {
            const kpis = await userResponse.json();
            // The KPIs response should contain the agent ID
            return kpis.agentId || user.email; // Fallback to email if agentId not available
          }
        }
      }
    } catch (error) {
      console.error('Error getting agent ID:', error);
    }
    return null;
  }, []);

      const loadRows = useCallback(async (currentSearch: string, currentStatus: string) => {
        setLoading(true);
        try {
          const res = await fetch(`/api/orders?page=1&pageSize=500&sortBy=createdAt&sortDir=desc&status=${encodeURIComponent(currentStatus)}&search=${encodeURIComponent(currentSearch || '')}`, { 
            cache: 'no-store',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (!res.ok) {
            setLastError(`Orders API ${res.status}`);
            setRows([]);
            return;
          }
          
          const json = await res.json();
          setLastError(null);
          const orders: any[] = json?.rows ?? [];
      
      // Batch fetch attempts for all orders to improve performance
      const orderIds = orders.map((order: any) => order.id);
      let attemptMap = new Map<string, any[]>();
      
      if (orderIds.length > 0) {
        try {
          // Use batch API for better performance
          const batchResponse = await fetch('/api/orders/batch-attempts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderIds })
          });
          
          if (batchResponse.ok) {
            const allAttempts = await batchResponse.json();
            attemptMap = new Map(Object.entries(allAttempts));
          }
        } catch (error) {
          console.warn('Batch attempts fetch failed, falling back to individual calls');
          // Fallback to individual calls if batch fails
          const attemptPromises = orderIds.map(async (orderId: string) => {
            try {
              const attemptsResponse = await fetch(`/api/orders/${orderId}/attempts`, { cache: 'no-store' });
              const attempts = attemptsResponse.ok ? await attemptsResponse.json() : [];
              return { orderId, attempts };
            } catch (error) {
              console.error(`Error fetching attempts for order ${orderId}:`, error);
              return { orderId, attempts: [] };
            }
          });
          
          const attemptResults = await Promise.all(attemptPromises);
          attemptMap = new Map(attemptResults.map(r => [r.orderId, r.attempts]));
        }
      }
      
      // Enhance orders with attempt information
      const enhancedRows = orders.map((order: any) => {
        const attempts = attemptMap.get(order.id) || [];
        return {
          ...order,
          attemptCount: attempts.length,
          lastAttemptResult: attempts.length > 0 ? attempts[attempts.length - 1].result : null
        };
      });
      
      setRows(enhancedRows);
      if (enhancedRows.length && onReadySelectFirst) onReadySelectFirst(enhancedRows[0]);
    } catch (err) {
      setLastError('Network error');
      console.error('Orders fetch error', err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onGridReady = useCallback(async (e: GridReadyEvent) => {
    gridApiRef.current = e.api;
    await loadRows(search, status);
  }, [loadRows, search, status]);

  // Reload rows when search/status changes or refreshTrigger changes
  useEffect(() => {
    loadRows(search, status);
  }, [search, status, refreshTrigger]);

  const onCellValueChanged = useCallback(async (e: any) => {
    const id = e.data.id as string;
    const updates: any = {};
    if (e.colDef.field === 'codAmount') updates.codAmount = Number(e.newValue);
    if (e.colDef.field === 'quantity') updates.quantity = Number(e.newValue);
    if (e.colDef.field === 'address') updates.address = String(e.newValue);
    if (e.colDef.field === 'remarks') updates.remarks = String(e.newValue);
    if (Object.keys(updates).length === 0) return;
    // optimistic: already updated in grid; send to server
    await fetch(`/api/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
  }, []);

  useEffect(() => {
    console.log('Initializing socket connection...');
    const socket = io('/orders', { 
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: true,
      transports: ['websocket', 'polling']
    });
    
    function onConnect() { 
      setSocketConnected(true);
      console.log('✅ Socket connected to orders namespace');
    }
    
    function onDisconnect(reason: any) { 
      setSocketConnected(false);
      console.log('❌ Socket disconnected from orders namespace. Reason:', reason);
    }

    function onConnectError(error: any) {
      console.error('❌ Socket connection error:', error);
      setSocketConnected(false);
    }

    function onReconnect(attemptNumber: number) {
      console.log('🔄 Socket reconnecting... attempt:', attemptNumber);
    }

    function onReconnectError(error: any) {
      console.error('❌ Socket reconnection error:', error);
    }
    
    // Real-time order updates - reload grid for better consistency
    function onOrderUpdated(payload: { id: string; changes: Partial<OrderRow> }) {
      console.log('Received real-time order update:', payload);
      console.log('Reloading grid due to order update...');
      // Reload the entire grid to ensure data consistency
      loadRows(search, status);
    }
    
    // Real-time order assignment - only reload if on ACTIVE tab
    function onOrderAssigned() {
      console.log('Received order assigned event');
      if (status === 'ACTIVE') {
        loadRows(search, status);
      }
    }
    
    // Real-time status changes - always reload for status changes
    function onOrderStatusChanged(payload: { orderId: string; newStatus: string }) {
      console.log('Received real-time status change:', payload);
      console.log('Reloading grid due to status change...');
      // Always reload the grid when there's a status change to ensure data consistency
      loadRows(search, status);
    }
    
    // Real-time attempt recording - reload grid to show updated attempt counts
    function onAttemptRecorded(payload: { orderId: string; attemptId: string; result: string; reason?: string; attemptNumber: number }) {
      console.log('Received real-time attempt recorded:', payload);
      console.log('Reloading grid due to attempt recording...');
      // Reload the grid to show updated attempt counts
      loadRows(search, status);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('reconnect', onReconnect);
    socket.on('reconnect_error', onReconnectError);
        socket.on('joined-room', (data) => {
          console.log('✅ Successfully joined agent room:', data);
        });

        // Send heartbeat every 30 seconds to maintain online status
        const heartbeatInterval = setInterval(() => {
          if (agentId && socket.connected) {
            console.log('💓 Sending heartbeat for agent:', agentId);
            socket.emit('agent-heartbeat', agentId);
          }
        }, 30000);
    socket.on('orderUpdated', onOrderUpdated);
    socket.on('orderAssigned', onOrderAssigned);
    socket.on('orderStatusChanged', onOrderStatusChanged);
    socket.on('attemptRecorded', onAttemptRecorded);
    
    // Join agent-specific room for targeted updates
    const joinAgentRoom = async () => {
      console.log('🔍 Getting agent ID...');
      const currentAgentId = await getAgentId();
      console.log('🔍 Agent ID received:', currentAgentId);
      if (currentAgentId) {
        setAgentId(currentAgentId);
        console.log('📡 Emitting join-agent-room with ID:', currentAgentId);
        socket.emit('join-agent-room', currentAgentId);
        console.log('📡 Join agent room request sent');
      } else {
        console.warn('⚠️ No agent ID available, cannot join agent room');
      }
    };

    // Wait for socket to connect before joining room
    if (socket.connected) {
      joinAgentRoom();
    } else {
      socket.on('connect', () => {
        console.log('🔗 Socket connected, now joining agent room...');
        joinAgentRoom();
      });
    }
    
        return () => {
          console.log('🧹 Cleaning up socket connection...');
          clearInterval(heartbeatInterval);
          socket.off('connect', onConnect);
          socket.off('disconnect', onDisconnect);
          socket.off('connect_error', onConnectError);
          socket.off('reconnect', onReconnect);
          socket.off('reconnect_error', onReconnectError);
          socket.off('joined-room');
          socket.off('orderUpdated', onOrderUpdated);
          socket.off('orderAssigned', onOrderAssigned);
          socket.off('orderStatusChanged', onOrderStatusChanged);
          socket.off('attemptRecorded', onAttemptRecorded);
          socket.disconnect();
        };
  }, [getAgentId, loadRows, search, status]);

      // Fallback periodic refresh only if socket is disconnected
      useEffect(() => {
        const id = setInterval(() => {
          if (!socketConnected) {
            console.log('Socket disconnected, performing fallback refresh');
            loadRows(search, status);
          }
        }, 30000); // Refresh every 30 seconds if socket is down
        return () => clearInterval(id);
      }, [socketConnected, search, status, loadRows]);

  return (
    <div className="ag-theme-quartz" style={{ height: 520 }}>
      <AgGridReact
        columnDefs={columnDefs}
        getRowId={getRowId}
        rowData={rows}
        onGridReady={onGridReady}
        animateRows
        suppressAggFuncInHeader
        onCellValueChanged={onCellValueChanged}
            rowSelection="single"
        onSelectionChanged={() => {
          const api = gridApiRef.current;
          const row = api?.getSelectedRows()?.[0] as OrderRow | undefined;
          onSelectionChange?.(row ?? null);
        }}
        onRowDoubleClicked={(e) => {
          if (onRowDoubleClick) onRowDoubleClick(e.data as OrderRow);
        }}
        onRowClicked={(e) => {
          if (onRowClicked) onRowClicked(e.data as OrderRow);
        }}
        defaultColDef={{ sortable: true, resizable: true, filter: true, minWidth: 100 }}
        loading={loading}
      />
          <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 ${socketConnected ? 'text-green-600' : 'text-orange-600'}`}>
                <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                {socketConnected ? 'Real-time connected' : 'Connecting...'}
              </span>
              {loading && <span className="ml-2 text-blue-600">Loading orders...</span>}
              {agentId && <span className="ml-2 text-gray-500">Agent: {agentId}</span>}
            </div>
            <button 
              onClick={() => loadRows(search, status)} 
              className="text-blue-600 hover:text-blue-800 underline"
              disabled={loading}
            >
              Refresh
            </button>
          </div>
      {lastError && <div className="mt-1 text-xs text-destructive">{lastError}. Make sure you are signed in and DB is seeded.</div>}
    </div>
  );
}


