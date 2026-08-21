const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const http = require('http');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { initSocket } = require('./utils/socket');
const { notFound, globalErrorHandler } = require('./middleware/errorMiddleware');

dotenv.config();
connectDB();

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow frontend (different port) to load images
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

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

app.use(notFound);
app.use(globalErrorHandler);

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});