const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const UserService = require('../services/UserService');
const { protect } = require('../middleware/auth');
const { ValidationError, UnauthorizedError, NotFoundError } = require('../utils/errors');
const config = require('../config/config');
const logger = require('../config/logger');

const router = express.Router();

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/profiles'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

// Send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user.id);

  const options = {
    expires: new Date(Date.now() + config.jwt.cookieExpiresIn * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'strict'
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar || '',
          preferences: user.preferences
        }
      }
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const { name, email, password, role = 'student' } = req.body;

    // Create user using service
    const user = await UserService.createUser({
      name,
      email,
      password,
      role
    });

    logger.info(`New user registered: ${email}`);
    sendTokenResponse(user, 201, res);
  } catch (error) {
    logger.error(`Register error: ${error.message}`);
    next(error);
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const { email, password } = req.body;

    // Check for user
    const user = await UserService.findForAuth(email);

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if account is locked
    if (UserService.isLocked(user)) {
      throw new UnauthorizedError('Account is temporarily locked due to too many failed login attempts');
    }

    // Check password
    const isMatch = await UserService.verifyPassword(user, password);

    if (!isMatch) {
      await UserService.incLoginAttempts(user.id);
      logger.warn(`Failed login attempt for: ${email}`);
      throw new UnauthorizedError('Invalid credentials');
    }

    // Reset login attempts on successful login
    await UserService.resetLoginAttempts(user.id);
    logger.info(`User logged in: ${email}`);

    sendTokenResponse(user, 200, res);
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    next(error);
  }
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await UserService.findById(req.user.id);
    
    logger.info(`User profile retrieved: ${user.email}`);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    next(error);
  }
});

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
router.put('/updatedetails', [
  protect,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key =>
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await UserService.updateUser(req.user.id, fieldsToUpdate);

    logger.info(`User details updated: ${user.email}`);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    logger.error(`Update details error: ${error.message}`);
    next(error);
  }
});

// @desc    Upload profile picture
// @route   POST /api/auth/upload-avatar
// @access  Private
router.post('/upload-avatar', [protect], upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ValidationError('Please upload a file');
    }

    // Update user avatar path
    const avatarPath = `/uploads/profiles/${req.file.filename}`;
    const user = await UserService.updateUser(req.user.id, { avatar: avatarPath });

    logger.info(`Avatar uploaded for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          preferences: user.preferences
        }
      }
    });
  } catch (error) {
    logger.error(`Upload avatar error: ${error.message}`);
    next(error);
  }
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
router.put('/updatepassword', [
  protect,
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const user = await UserService.findById(req.user.id);

    // Check current password
    const isMatch = await UserService.verifyPassword(user, req.body.currentPassword);
    if (!isMatch) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Update password
    await UserService.updateUser(req.user.id, { password: req.body.newPassword });

    logger.info(`Password updated for user: ${user.email}`);

    sendTokenResponse(user, 200, res);
  } catch (error) {
    logger.error(`Update password error: ${error.message}`);
    next(error);
  }
});

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
router.get('/logout', protect, (req, res, next) => {
  try {
    logger.info(`User logged out: ${req.user.email}`);

    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      message: 'User logged out successfully'
    });
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    next(error);
  }
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
router.post('/forgotpassword', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const user = await UserService.findByEmail(req.body.email);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Generate reset token (simplified - in production use crypto)
    const resetToken = Math.random().toString(36).substring(2, 15);

    // TODO: In production, send email with reset link and store reset token
    logger.info(`Password reset requested for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    logger.error(`Forgot password error: ${error.message}`);
    next(error);
  }
});

module.exports = router;