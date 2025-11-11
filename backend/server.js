const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

// Import routes
const authRoutes = require('./routes/auth');
const examRoutes = require('./routes/exams');
const studentRoutes = require('./routes/students');
const certificateRoutes = require('./routes/certificates');
const analyticsRoutes = require('./routes/analytics');
const notificationRoutes = require('./routes/notifications');

// Middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow localhost and local network IPs for development
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://10.129.131.23:3000', // Your current frontend origin
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // In development, allow all origins (be careful with this in production)
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Static files for certificate uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting for auth routes (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later.'
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '..', 'frontend', 'build');
  console.log('Production mode: serving frontend from', buildPath);
  app.use(express.static(buildPath));

  app.get('*', (req, res) => {
    // If the request looks like an API call, return 404 JSON
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ success: false, message: 'API endpoint not found' });
    }
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} else {
  // 404 handler for non-production (API only)
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'API endpoint not found'
    });
  });
}

// Database connection
console.log('🔄 Connecting to MongoDB...');
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set (' + process.env.MONGODB_URI.substring(0, 20) + '...)' : 'Not set');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/secureexam', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((err) => {
  console.error('MongoDB connection error:', err.message);
  console.log('Server will continue without database connection for testing purposes');
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

module.exports = app;