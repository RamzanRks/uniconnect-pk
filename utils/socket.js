let io = null;

const initSocket = (httpServer) => {
  const { Server } = require('socket.io');
  const jwt = require('jsonwebtoken');

  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // SECURITY: only logged-in users can open a socket
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
    socket.join(`user:${socket.userId}`); // personal room per user
  });

  return io;
};

// Create DB notification + push it live to the user's browser
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

const emitToUser = (userId, event, payload) => {
  if (io) io.to(`user:${userId}`).emit(event, payload);
};

module.exports = { initSocket, notifyUser, emitToUser };