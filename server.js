const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const http = require('http');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { initSocket } = require('./utils/socket');
const { notFound, globalErrorHandler } = require('./middleware/errorMiddleware');

dotenv.config();
connectDB();

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: (process.env.FRONTEND_URL || 'http://localhost:5173').split(','), credentials: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: { message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10kb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/authRoutes'));
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

// ⏰ Auto Weekly Digest (Runs every Monday at 9:00 AM)
const cron = require('node-cron');
const { spawn } = require('child_process');

cron.schedule('0 9 * * 1', () => {
  console.log('⏰ [CRON] Triggering weekly email digest...');
  const digestPath = path.join(__dirname, 'digest.js');
  const child = spawn('node', [digestPath], { stdio: 'inherit' });
  child.on('exit', (code) => console.log(`✅ Digest finished with code ${code}`));
}, { timezone: "Asia/Karachi" }); // Change timezone if needed!
initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});