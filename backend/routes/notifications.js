const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, isRead } = req.query;

    let query = { recipient: req.user._id };

    // Filter by read status if provided
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    // Only show non-expired notifications
    query.expiresAt = { $gt: new Date() };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('sender', 'name')
      .populate('relatedExam', 'title')
      .populate('relatedCertificate', 'certificateId');

    const total = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single notification
// @route   GET /api/notifications/:id
// @access  Private
router.get('/:id', [
  protect,
  param('id').isMongoId().withMessage('Invalid notification ID')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id
    })
    .populate('sender', 'name')
    .populate('relatedExam', 'title subject')
    .populate('relatedCertificate', 'certificateId score');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', [
  protect,
  param('id').isMongoId().withMessage('Invalid notification ID')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Mark multiple notifications as read
// @route   PUT /api/notifications/mark-read
// @access  Private
router.put('/mark-read', [
  protect,
  body('notificationIds')
    .isArray()
    .withMessage('Notification IDs must be an array'),
  body('notificationIds.*')
    .isMongoId()
    .withMessage('Invalid notification ID')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { notificationIds } = req.body;

    const result = await Notification.updateMany(
      { _id: { $in: notificationIds }, recipient: req.user._id },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`
    });
  } catch (error) {
    console.error('Mark multiple notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id', [
  protect,
  param('id').isMongoId().withMessage('Invalid notification ID')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get notification statistics
// @route   GET /api/notifications/stats
// @access  Private
router.get('/stats/summary', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Notification.aggregate([
      { $match: { recipient: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: {
            $sum: {
              $cond: [
                { $eq: ['$isRead', false] },
                1,
                0
              ]
            }
          },
          byType: {
            $push: '$type'
          }
        }
      }
    ]);

    // Get recent notifications (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentNotifications = await Notification.find({
      recipient: userId,
      createdAt: { $gte: sevenDaysAgo }
    }).countDocuments();

    const result = stats[0] || { total: 0, unread: 0, byType: [] };

    // Count notifications by type
    const typeCount = {};
    result.byType.forEach(type => {
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      data: {
        total: result.total,
        unread: result.unread,
        recent: recentNotifications,
        byType: typeCount
      }
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create notification (Admin only)
// @route   POST /api/notifications
// @access  Private (Admin only)
router.post('/', [
  protect,
  authorize('admin'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title is required and must be less than 100 characters'),
  body('message')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Message is required and must be less than 500 characters'),
  body('recipient')
    .isMongoId()
    .withMessage('Valid recipient ID is required'),
  body('type')
    .optional()
    .isIn(['info', 'success', 'warning', 'danger', 'exam', 'certificate', 'system'])
    .withMessage('Invalid notification type'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if recipient exists
    const recipient = await User.findById(req.body.recipient);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    const notification = await Notification.create({
      ...req.body,
      sender: req.user._id
    });

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Send bulk notifications (Admin only)
// @route   POST /api/notifications/bulk
// @access  Private (Admin only)
router.post('/bulk', [
  protect,
  authorize('admin'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title is required'),
  body('message')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Message is required'),
  body('recipients')
    .isArray({ min: 1 })
    .withMessage('At least one recipient is required'),
  body('recipients.*')
    .isMongoId()
    .withMessage('Invalid recipient ID'),
  body('type')
    .optional()
    .isIn(['info', 'success', 'warning', 'danger', 'exam', 'certificate', 'system'])
    .withMessage('Invalid notification type')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { recipients, ...notificationData } = req.body;

    // Check if all recipients exist
    const existingUsers = await User.find({ _id: { $in: recipients } }).select('_id');
    const existingUserIds = existingUsers.map(user => user._id.toString());

    const invalidRecipients = recipients.filter(id => !existingUserIds.includes(id));
    if (invalidRecipients.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some recipients do not exist',
        invalidRecipients
      });
    }

    // Create notifications for all recipients
    const notifications = recipients.map(recipientId => ({
      ...notificationData,
      recipient: recipientId,
      sender: req.user._id
    }));

    const createdNotifications = await Notification.insertMany(notifications);

    res.status(201).json({
      success: true,
      message: `Notifications sent to ${createdNotifications.length} recipients`,
      count: createdNotifications.length
    });
  } catch (error) {
    console.error('Send bulk notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Send notification to all students (Admin only)
// @route   POST /api/notifications/broadcast
// @access  Private (Admin only)
router.post('/broadcast', [
  protect,
  authorize('admin'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title is required'),
  body('message')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Message is required'),
  body('type')
    .optional()
    .isIn(['info', 'success', 'warning', 'danger', 'exam', 'certificate', 'system'])
    .withMessage('Invalid notification type')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Get all active students
    const students = await User.find({ role: 'student', isActive: true }).select('_id');

    if (students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active students found'
      });
    }

    // Create notifications for all students
    const notifications = students.map(student => ({
      ...req.body,
      recipient: student._id,
      sender: req.user._id,
      priority: 'medium'
    }));

    const createdNotifications = await Notification.insertMany(notifications);

    res.status(201).json({
      success: true,
      message: `Broadcast notification sent to ${createdNotifications.length} students`,
      count: createdNotifications.length
    });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;