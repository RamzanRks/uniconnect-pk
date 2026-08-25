let io = null;
const onlineUsers = new Set();

// REAL-TIME ENGINE: Socket.io with JWT authentication + presence tracking
const initSocket = (httpServer) => {
  const { Server } = require('socket.io');
  const jwt = require('jsonwebtoken');

  io = new Server(httpServer, {
    cors: {
      origin: (process.env.FRONTEND_URL || 'http://localhost:5173').split(','),
      credentials: true,
    },
  });

  // SECURITY: only authenticated users may open a socket
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Not authorized'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (e) {
      next(new Error('Not authorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);

    // NEW (Milestone 4): mark online + broadcast presence
    onlineUsers.add(String(socket.userId));
    io.emit('presence', { userId: socket.userId, online: true });

    socket.on('disconnect', () => {
      onlineUsers.delete(String(socket.userId));
      io.emit('presence', { userId: socket.userId, online: false });
    });
  });

  return io;
};

// Push a persistent notification to one user (saved in DB + emitted live)
const notifyUser = async (recipientId, type, text, link = '/') => {
  try {
    const Notification = require('../models/Notification');
    const doc = await Notification.create({ recipient: recipientId, type, text, link });
    if (io) io.to(`user:${recipientId}`).emit('notification', doc);
    return doc;
  } catch (e) {
    console.error('notifyUser failed:', e.message);
  }
};

// Emit any custom event to one user's room (used by DMs)
const emitToUser = (userId, event, payload) => {
  if (io) io.to(`user:${userId}`).emit(event, payload);
};

// NEW (Milestone 4): presence helpers
const isOnline = (userId) => onlineUsers.has(String(userId));
const getOnlineUsers = () => Array.from(onlineUsers);

module.exports = { initSocket, notifyUser, emitToUser, isOnline, getOnlineUsers };