const express = require('express');
require('express-async-errors');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { sequelize } = require('./models');
const config = require('./config/config');
const logger = require('./config/logger');

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
  origin: config.cors.origin === '*' ? true : config.cors.origin,
  credentials: true
}));
app.use(compression());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Static files for certificate uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting for auth routes (stricter)
const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
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
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    message,
    ...(config.env === 'development' && { error: err.message, stack: err.stack })
  });
});

// 404 handler
// Serve React frontend in production
if (config.env === 'production') {
  const buildPath = path.join(__dirname, '..', 'frontend', 'build');
  logger.info(`Production mode: serving frontend from ${buildPath}`);
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

// Database connection and server startup
async function startServer() {
  try {
    // Test database connection
    logger.info('🔄 Connecting to MySQL database...');
    await sequelize.authenticate();
    logger.info('✅ MySQL database connected successfully');

    // Sync database models
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    logger.info('✅ Database models synced successfully');

    // Start server
    const PORT = config.port;
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📝 Environment: ${config.env}`);
      logger.info(`🌐 Frontend URL: ${config.frontend.url}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async () => {
      logger.info('Shutting down gracefully...');
      server.close(async () => {
        try {
          await sequelize.close();
          logger.info('✅ MySQL connection closed');
          process.exit(0);
        } catch (err) {
          logger.error('Error closing database connection:', err);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after graceful shutdown timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (err) {
    logger.error('Failed to start server:', {
      message: err.message,
      code: err.code,
      errno: err.errno
    });
    logger.error('Please check your database configuration in .env file');
    process.exit(1);
  }
}

startServer();

module.exports = app;