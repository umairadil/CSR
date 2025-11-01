// Helper to access the Socket.IO server instance created in server.js
// For dev server usage only. In serverless environments, this may be undefined.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getIo(): any | null {
  return global.__io ?? null;
}

export function emitOrderEvent(event: string, payload: unknown) {
  const io = getIo();
  if (!io) return;
  io.of('/orders').emit(event, payload);
}

// Agent-specific real-time events
export function emitOrderUpdate(agentId: string, orderId: string, changes: any) {
  // @ts-expect-error runtime global from server.js
  if (global.emitOrderUpdate) {
    // @ts-expect-error runtime global from server.js
    global.emitOrderUpdate(agentId, orderId, changes);
  }
}

export function emitOrderAssigned(agentId: string) {
  // @ts-expect-error runtime global from server.js
  if (global.emitOrderAssigned) {
    // @ts-expect-error runtime global from server.js
    global.emitOrderAssigned(agentId);
  }
}

export function emitOrderStatusChanged(agentId: string, orderId: string, newStatus: string) {
  // @ts-expect-error runtime global from server.js
  if (global.emitOrderStatusChanged) {
    // @ts-expect-error runtime global from server.js
    global.emitOrderStatusChanged(agentId, orderId, newStatus);
  }
}

export function emitAttemptRecorded(agentId: string, orderId: string, attemptId: string, result: string, attemptNumber: number, reason?: string) {
  // @ts-expect-error runtime global from server.js
  if (global.emitAttemptRecorded) {
    // @ts-expect-error runtime global from server.js
    global.emitAttemptRecorded(agentId, orderId, attemptId, result, attemptNumber, reason);
  }
}








