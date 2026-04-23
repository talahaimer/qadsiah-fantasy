const logger = require('../config/logger');

module.exports = function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    logger.debug({ sid: socket.id, userId: socket.user?.id }, 'socket connected');

    if (socket.user?.id) socket.join(`user:${socket.user.id}`);

    socket.on('join_match', (matchId) => {
      if (typeof matchId === 'string' && matchId.length <= 64) {
        socket.join(`match:${matchId}`);
      }
    });

    socket.on('leave_match', (matchId) => {
      if (typeof matchId === 'string') socket.leave(`match:${matchId}`);
    });

    socket.on('disconnect', () => {
      logger.debug({ sid: socket.id }, 'socket disconnected');
    });
  });
};
