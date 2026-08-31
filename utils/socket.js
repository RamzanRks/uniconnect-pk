let io = null;
const onlineUsers = new Set();
const User = require('../models/User');
const Notification = require('../models/Notification');

const initSocket = (httpServer) => {
  const { Server } = require('socket.io');
  const jwt = require('jsonwebtoken');

  io = new Server(httpServer, {
    cors: {
      origin: (process.env.FRONTEND_URL || 'http://localhost:5173').split(','),
      credentials: true,
    },
  });

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
    onlineUsers.add(String(socket.userId));
    io.emit('presence', { userId: socket.userId, online: true });

    // Join conversation rooms for DM typing & live messages
    socket.on('join_conversation', (convoId) => {
      socket.join(`convo:${convoId}`);
    });
    socket.on('leave_conversation', (convoId) => {
      socket.leave(`convo:${convoId}`);
    });

    // Typing indicator
    socket.on('typing', ({ convoId, isTyping }) => {
      socket.to(`convo:${convoId}`).emit('user_typing', { userId: socket.userId, convoId, isTyping });
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(String(socket.userId));
      io.emit('presence', { userId: socket.userId, online: false });
    });
  });

  return io;
};

const PREF_MAP = { message: 'messages', reaction: 'reactions', comment: 'comments', follow: 'follows', application: 'applications' };
const CRITICAL = ['system', 'warning', 'strike', 'verification_approved', 'verification_rejected', 'name_change_approved', 'name_change_rejected'];

const notifyUser = async (userId, type, text, link) => {
  try {
    const target = await User.findById(userId);
    if (!target) return null;
    const prefs = target.notifPrefs || {};
    const muted = target.muteAllUntil && new Date(target.muteAllUntil) > new Date();
    if (muted && !CRITICAL.includes(type)) return null;
    const key = PREF_MAP[type];
    if (key && prefs[key] === false) return null;
    const n = await Notification.create({ recipient: userId, type, text, link });
    if (io) io.to(`user:${userId}`).emit('notification', n);
    return n;
  } catch (e) {
    return null;
  }
};

const emitToUser = (userId, event, payload) => {
  if (io) io.to(`user:${userId}`).emit(event, payload);
};

const isOnline = (userId) => onlineUsers.has(String(userId));
const getOnlineUsers = () => Array.from(onlineUsers);

module.exports = { initSocket, notifyUser, emitToUser, isOnline, getOnlineUsers };