import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../middleware/auth';

let io: SocketIOServer;

export const initSocket = (server: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Auth middleware for socket connections
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      // Allow unauthenticated for USSD simulator
      socket.data.role = 'guest';
      return next();
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JWTPayload;
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as JWTPayload | undefined;

    if (user) {
      const isCB = ['CBSuperAdmin', 'FXInterventionDesk', 'Supervisor', 'Auditor'].includes(user.role);
      if (isCB) {
        socket.join('central-bank');
      } else if (user.dealerId) {
        socket.join(`dealer:${user.dealerId}`);
        socket.join('dealers'); // broadcast room for all dealers
      }
    } else {
      // USSD simulator or public clients
      socket.join('public');
    }

    socket.on('disconnect', () => {
      // cleanup handled by socket.io automatically
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

// ─── EMIT HELPERS ────────────────────────────────────────────────────────────

export const emitTransactionNew = (transaction: object) => {
  const io = getIO();
  io.to('central-bank').emit('transaction:new', transaction);
  const tx = transaction as { dealerId?: string };
  if (tx.dealerId) {
    io.to(`dealer:${tx.dealerId}`).emit('transaction:new', transaction);
  }
};

export const emitAMLAlert = (alert: object) => {
  getIO().to('central-bank').emit('aml:alert_created', alert);
};

export const emitOMOStatusChanged = (sessionId: string, status: string) => {
  const io = getIO();
  io.to('central-bank').emit('omo:status_changed', { sessionId, status });
  io.to('dealers').emit('omo:status_changed', { sessionId, status });
};

export const emitOMOAllocated = (sessionId: string, dealerIds: string[], results: object) => {
  const io = getIO();
  io.to('central-bank').emit('omo:allocated', { sessionId, results });
  dealerIds.forEach(id => io.to(`dealer:${id}`).emit('omo:allocated', { sessionId, results }));
};

export const emitNotification = (dealerId: string | null, notification: object) => {
  const io = getIO();
  if (dealerId) {
    io.to(`dealer:${dealerId}`).emit('notification:new', notification);
  } else {
    io.to('dealers').emit('notification:new', notification);
  }
};

export const emitRateUpdated = (controls: object) => {
  const io = getIO();
  io.to('central-bank').emit('rate:updated', controls);
  io.to('dealers').emit('rate:updated', controls);
};
