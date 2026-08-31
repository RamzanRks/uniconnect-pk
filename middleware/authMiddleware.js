const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      // Set current session ID from token
      req.currentSid = decoded.sid;
      
      // Validate session is still active (admin can invalidate via "logout others")
      if (decoded.sid && !(req.user.sessions || []).some((s) => s.sid === decoded.sid)) {
        res.status(401);
        throw new Error('This session was ended. Please login again.');
      }
    } catch (error) {
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  if (req.user.isBanned) {
    res.status(403);
    throw new Error('Your account has been suspended.');
  }

  next();
});

// ADMIN-ONLY GATE: Blocks everyone except role='admin'
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as admin');
  }
};

module.exports = { protect, adminOnly };