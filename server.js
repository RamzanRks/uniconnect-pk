// Polyfill for dependencies that incorrectly expect `crypto` to be a global variable
const nodeCrypto = require('crypto');
if (!globalThis.crypto) {
  globalThis.crypto = nodeCrypto;
}
if (typeof crypto === 'undefined') {
  global.crypto = nodeCrypto;
}

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const http = require('http');
const connectDB = require('./config/db');
const { initSocket } = require('./utils/socket');
const { notFound, globalErrorHandler } = require('./middleware/errorMiddleware');
const { validateCsrf, attachCsrfToken } = require('./middleware/csrfMiddleware');
const {
  globalLimiter,
  loginLimiter,
  registerLimiter,
  resetLimiter,
  resendLimiter,
  twoFALimiter,
} = require('./middleware/rateLimitMiddleware');

dotenv.config();
connectDB();

const app = express();

// ═══════════════════════════════════════════
// 🔒 SECURITY: Helmet with CSP headers
// ═══════════════════════════════════════════
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: [
          "'self'",
          process.env.FRONTEND_URL || 'http://localhost:5173',
          'ws:',
          'wss:',
        ],
        frameSrc: ["'self'", 'https://accounts.google.com'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    hsts: process.env.NODE_ENV === 'production'
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
    frameguard: { action: 'deny' },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// ═══════════════════════════════════════════
// 🔒 SECURITY: CORS with explicit origins
// ═══════════════════════════════════════════
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',');
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Requested-With',
    ],
    exposedHeaders: ['X-CSRF-Token'],
  })
);

// ═══════════════════════════════════════════
// 🔒 SECURITY: Global rate limiter
// ═══════════════════════════════════════════
app.use('/api/', globalLimiter);

// Body parsing with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ═══════════════════════════════════════════
// 🔒 SECURITY: CSRF protection on mutations
// ═══════════════════════════════════════════
app.use('/api/', validateCsrf);

// ═══════════════════════════════════════════
// Routes with specific rate limiters
// ═══════════════════════════════════════════

// Auth routes with granular rate limiting
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth/forgot-password', resetLimiter);
app.use('/api/auth/reset-password', resetLimiter);
app.use('/api/auth/resend-code', resendLimiter);
app.use('/api/auth/verify-2fa', twoFALimiter);
app.use('/api/auth', authRoutes);

// Other routes
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/qa', require('./routes/qaRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/bookmarks', require('./routes/bookmarkRoutes'));
app.use('/api/ratings', require('./routes/ratingRoutes'));
app.use('/api/reactions', require('./routes/reactionRoutes'));
app.use('/api/endorsements', require('./routes/endorsementRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/api/files', require('./routes/fileRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/leaderboard', require('./routes/leaderboardRoutes'));
app.use('/api/hubs', require('./routes/hubRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/polls', require('./routes/pollRoutes'));
app.use('/api/audit', require('./routes/auditRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/particle', require('./routes/particleRoutes'));

// Production: serve frontend build
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, 'uniconnect-frontend', 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
}

app.use(notFound);
app.use(globalErrorHandler);

const server = http.createServer(app);

// ⏰ Auto Weekly Digest
const cron = require('node-cron');
const { spawn } = require('child_process');
cron.schedule(
  '0 9 * * 1',
  () => {
    console.log('⏰ [CRON] Triggering weekly email digest...');
    const digestPath = path.join(__dirname, 'digest.js');
    const child = spawn('node', [digestPath], { stdio: 'inherit' });
    child.on('exit', (code) => console.log(`✅ Digest finished with code ${code}`));
  },
  { timezone: 'Asia/Karachi' }
);

initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`🔒 Security: CSRF=${process.env.NODE_ENV !== 'test'}, Rate Limiting=ON, Helmet CSP=ON`);
});