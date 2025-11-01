const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // ============================================================================
  // SOCKET.IO CONFIGURATION FOR SMARTASP (POLLING TRANSPORT)
  // ============================================================================
  const corsOrigin = process.env.CORS_ORIGIN || 'https://csr.darjaah-hub.com';
  
  const io = new Server(server, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io',
    // ✅ CRITICAL FOR SMARTASP: Use polling first (WebSocket not supported)
    transports: ['polling', 'websocket'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  console.log('Socket.IO server initialized');

  // Store global io instance
  global.__io = io;
  
  // ============================================================================
  // ORDERS NAMESPACE (/orders)
  // ============================================================================
  const ordersNamespace = io.of('/orders');
  const connectedAgents = new Map();

  ordersNamespace.on('connection', (socket) => {
    console.log(`✅ Client connected to orders namespace, socket ID: ${socket.id}`);

    socket.on('join-agent-room', (agentId) => {
      console.log(`📡 Received join-agent-room request for agent: ${agentId}`);
      
      if (!agentId) {
        console.log('❌ No agentId provided');
        return;
      }

      socket.join(`agent-${agentId}`);
      
      if (!connectedAgents.has(agentId)) {
        connectedAgents.set(agentId, new Set());
      }
      connectedAgents.get(agentId).add(socket.id);

      console.log(`✅ Agent ${agentId} joined their room: agent-${agentId}`);
      console.log(`📊 Current connected users:`, Array.from(connectedAgents.keys()));

      socket.emit('joined-room', { agentId });
      console.log(`📤 Sent joined-room confirmation to agent ${agentId}`);

      ordersNamespace.emit('agentStatusChanged', {
        agentId,
        status: 'online',
        timestamp: new Date().toISOString()
      });
      console.log(`📤 Emitted agentStatusChanged for agent ${agentId}`);

      const chatNamespace = io.of('/chat');
      chatNamespace.emit('userStatusChanged', {
        userId: agentId,
        status: 'online',
        timestamp: new Date().toISOString()
      });
      console.log(`📤 Emitted userStatusChanged to chat namespace for agent ${agentId}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`❌ Client disconnected from orders namespace. Reason: ${reason}`);
      
      let disconnectedAgentId = null;
      connectedAgents.forEach((sockets, agentId) => {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            connectedAgents.delete(agentId);
            disconnectedAgentId = agentId;
            console.log(`📤 Agent ${agentId} marked as offline (all connections closed)`);
          }
        }
      });

      if (disconnectedAgentId) {
        ordersNamespace.emit('agentStatusChanged', {
          agentId: disconnectedAgentId,
          status: 'offline',
          timestamp: new Date().toISOString()
        });

        const chatNamespace = io.of('/chat');
        chatNamespace.emit('userStatusChanged', {
          userId: disconnectedAgentId,
          status: 'offline',
          timestamp: new Date().toISOString()
        });
      }
    });
  });

  // Global functions for order updates
  global.emitOrderUpdate = (agentId, orderId, changes) => {
    ordersNamespace.to(`agent-${agentId}`).emit('order-updated', {
      orderId,
      changes,
      timestamp: new Date().toISOString()
    });
  };

  global.emitOrderAssigned = (agentId) => {
    ordersNamespace.to(`agent-${agentId}`).emit('order-assigned', {
      timestamp: new Date().toISOString()
    });
  };

  global.emitOrderStatusChanged = (agentId, orderId, newStatus) => {
    ordersNamespace.to(`agent-${agentId}`).emit('order-status-changed', {
      orderId,
      newStatus,
      timestamp: new Date().toISOString()
    });
  };

  global.emitAttemptRecorded = (agentId, orderId, attemptId, result, reason, attemptNumber) => {
    ordersNamespace.to(`agent-${agentId}`).emit('attempt-recorded', {
      orderId,
      attemptId,
      result,
      reason,
      attemptNumber,
      timestamp: new Date().toISOString()
    });
  };

  global.getAgentStatus = () => {
    const statuses = {};
    connectedAgents.forEach((sockets, agentId) => {
      if (sockets.size > 0) {
        const socketArray = Array.from(sockets);
        statuses[agentId] = {
          status: 'online',
          lastSeen: new Date(),
          socketId: socketArray[0]
        };
      }
    });
    return statuses;
  };

  // ============================================================================
  // CHAT NAMESPACE (/chat)
  // ============================================================================
  const chatNamespace = io.of('/chat');
  const connectedChatUsers = new Map();

  chatNamespace.on('connection', (socket) => {
    console.log(`✅ Client connected to chat namespace, socket ID: ${socket.id}`);

    socket.on('join-chat', (userId) => {
      console.log(`📡 User joined chat: ${userId}`);
      
      if (!userId) {
        console.log('❌ No userId provided');
        return;
      }

      socket.join(`user-${userId}`);
      
      if (!connectedChatUsers.has(userId)) {
        connectedChatUsers.set(userId, new Set());
      }
      connectedChatUsers.get(userId).add(socket.id);

      console.log(`✅ Chat user ${userId} marked as online`);
      console.log(`📊 Current connected users:`, Array.from(connectedChatUsers.keys()));

      chatNamespace.emit('userStatusChanged', {
        userId,
        status: 'online',
        timestamp: new Date().toISOString()
      });
    });

    socket.on('send-message', async (data) => {
      const { senderId, receiverId, content, attachments } = data;
      console.log(`📨 Chat message sent from ${senderId} to ${receiverId}`);

      chatNamespace.to(`user-${receiverId}`).emit('new-message', {
        senderId,
        receiverId,
        content,
        attachments,
        timestamp: new Date().toISOString()
      });

      chatNamespace.to(`user-${senderId}`).emit('message-sent', {
        receiverId,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('start-typing', (data) => {
      const { conversationId, userId } = data;
      chatNamespace.to(`user-${conversationId}`).emit('user-typing', {
        userId,
        conversationId
      });
    });

    socket.on('stop-typing', (data) => {
      const { conversationId, userId } = data;
      chatNamespace.to(`user-${conversationId}`).emit('user-stopped-typing', {
        userId,
        conversationId
      });
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected from chat namespace`);
      
      let disconnectedUserId = null;
      connectedChatUsers.forEach((sockets, userId) => {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            connectedChatUsers.delete(userId);
            disconnectedUserId = userId;
            console.log(`📤 Chat user ${userId} marked as offline (all connections closed)`);
          }
        }
      });

      if (disconnectedUserId) {
        chatNamespace.emit('userStatusChanged', {
          userId: disconnectedUserId,
          status: 'offline',
          timestamp: new Date().toISOString()
        });
      }
    });
  });

  global.getChatUserStatus = () => {
    const statuses = {};
    connectedChatUsers.forEach((sockets, userId) => {
      if (sockets.size > 0) {
        statuses[userId] = {
          status: 'online',
          lastSeen: new Date()
        };
      }
    });
    return statuses;
  };

  // ============================================================================
  // START SERVER
  // ============================================================================
  server.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO server running on http://${hostname}:${port}`);
  });
});
