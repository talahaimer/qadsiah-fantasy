const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const jwt = require('jsonwebtoken');
const { pubClient, subClient } = require('./redis');
const env = require('./env');
const logger = require('./logger');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.CORS_ORIGINS, credentials: true },
    pingTimeout: 30000,
  });

  io.adapter(createAdapter(pubClient, subClient));

  // Optional JWT auth on handshake. Anonymous clients can still join public rooms.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next();
    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
      socket.user = { id: payload.sub, role: payload.role };
    } catch (_e) {
      // invalid token → still allow as anonymous, rooms that require auth will reject.
    }
    return next();
  });

  require('../socket/handlers')(io);

  logger.info('Socket.IO initialized');
  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

module.exports = { initSocket, getIO };
