import { Server as SocketIOServer } from 'socket.io';

declare global {
  // eslint-disable-next-line no-var
  var __io: SocketIOServer | null;
  // eslint-disable-next-line no-var
  var __connectedUsers: Map<string, any> | undefined;
  
  namespace NodeJS {
    interface Global {
      __io: SocketIOServer | null;
      __connectedUsers: Map<string, any> | undefined;
      emitOrderUpdate?: (agentId: string, orderId: string, changes: any) => void;
      emitOrderAssigned?: (agentId: string) => void;
      emitOrderStatusChanged?: (agentId: string, orderId: string, newStatus: string) => void;
      emitAttemptRecorded?: (
        agentId: string,
        orderId: string,
        attemptId: string,
        result: string,
        reason: string,
        attemptNumber: number
      ) => void;
      getAgentStatus?: () => Record<string, any>;
      getChatUserStatus?: () => Record<string, any>;
    }
  }
}

export {};



