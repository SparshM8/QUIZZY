const jwt = require('jsonwebtoken');
const UserService = require('../services/UserService');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const { hasRequiredRole } = require('../utils/roles');
const config = require('../config/config');
const logger = require('../config/logger');

// Protect routes - require authentication
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check for token in cookies
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new UnauthorizedError('Not authorized to access this route');
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Get user from token
    const user = await UserService.findById(decoded.id);

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User account is deactivated');
    }

    req.user = user;
    next();
  } catch (error) {
    logger.warn(`Auth protect error: ${error.message}`);
    next(error instanceof UnauthorizedError ? error : new UnauthorizedError('Not authorized to access this route'));
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('User not authenticated'));
    }

    const isAllowed = roles.some((role) => hasRequiredRole(req.user.role, role));

    if (!isAllowed) {
      return next(new ForbiddenError(`User role ${req.user.role} is not authorized to access this route`));
    }

    next();
  };
};

// Check if user owns resource or is admin
const ownerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new UnauthorizedError('User not authenticated'));
  }

  // Admin can access everything
  if (req.user.role === 'admin') {
    return next();
  }

  // Check if user owns the resource
  const resourceUserId = req.params.userId || req.body.userId || req.params.id;

  if (req.user.id.toString() !== resourceUserId.toString()) {
    return next(new ForbiddenError('Not authorized to access this resource'));
  }

  next();
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        const user = await UserService.findById(decoded.id);

        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        logger.warn(`Optional auth token invalid: ${error.message}`);
      }
    }

    next();
  } catch (error) {
    next();
  }
};

// Rate limiting for sensitive operations
const sensitiveOperationLimit = (req, res, next) => {
  // This would typically use express-rate-limit middleware
  // For now, just pass through
  next();
};

module.exports = {
  protect,
  authorize,
  ownerOrAdmin,
  optionalAuth,
  sensitiveOperationLimit
};