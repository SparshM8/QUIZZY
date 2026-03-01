const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const NotificationService = require('../services/NotificationService');
const { protect, authorize } = require('../middleware/auth');
const { ValidationError, NotFoundError } = require('../utils/errors');
const logger = require('../config/logger');

const router = express.Router();

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { isRead } = req.query;

    const options = {
      limit,
      offset: (page - 1) * limit
    };

    if (isRead !== undefined) {
      options.isRead = isRead === 'true';
    }

    const { total, data } = await NotificationService.getUserNotifications(req.user.id, options);

    logger.info(`Notifications retrieved for user: ${req.user.email}`);

    res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total
      }
    });
  } catch (error) {
    logger.error(`Get notifications error: ${error.message}`);
    next(error);
  }
});

// @desc    Get single notification
// @route   GET /api/notifications/:id
// @access  Private
router.get('/:id', [
  protect,
  param('id').isInt().withMessage('Invalid notification ID')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const notification = await NotificationService.getNotificationById(req.params.id);

    if (!notification || notification.recipientId !== req.user.id) {
      throw new NotFoundError('Notification not found');
    }

    logger.info(`Notification retrieved: ${notification.id}`);

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    logger.error(`Get notification error: ${error.message}`);
    next(error);
  }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', [
  protect,
  param('id').isInt().withMessage('Invalid notification ID')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const notification = await NotificationService.markAsRead(req.params.id);

    if (!notification || notification.recipientId !== req.user.id) {
      throw new NotFoundError('Notification not found');
    }

    logger.info(`Notification marked as read: ${notification.id}`);

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    logger.error(`Mark notification read error: ${error.message}`);
    next(error);
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
    .isInt()
    .withMessage('Invalid notification ID')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const { notificationIds } = req.body;

    // Mark all as read for the current user
    let markedCount = 0;
    for (const notifId of notificationIds) {
      try {
        await NotificationService.markAsRead(notifId);
        markedCount++;
      } catch (error) {
        // Continue even if one fails
      }
    }

    logger.info(`${markedCount} notifications marked as read for user: ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: `${markedCount} notifications marked as read`
    });
  } catch (error) {
    logger.error(`Mark multiple notifications read error: ${error.message}`);
    next(error);
  }
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id', [
  protect,
  param('id').isInt().withMessage('Invalid notification ID')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    await NotificationService.deleteNotification(req.params.id);

    logger.info(`Notification deleted: ${req.params.id}`);

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    logger.error(`Delete notification error: ${error.message}`);
    next(error);
  }
});

// @desc    Get notification statistics
// @route   GET /api/notifications/stats/summary
// @access  Private
router.get('/stats/summary', protect, async (req, res, next) => {
  try {
    const unreadCount = await NotificationService.getUnreadCount(req.user.id);
    
    // Get recent notifications (simplified version)
    const notifications = await NotificationService.getUserNotifications(req.user.id, {
      limit: 100,
      offset: 0
    });

    const stats = {
      total: notifications.length,
      unread: unreadCount,
      byType: {}
    };

    // Count by type
    notifications.forEach(notif => {
      stats.byType[notif.type] = (stats.byType[notif.type] || 0) + 1;
    });

    logger.info(`Notification stats retrieved for user: ${req.user.email}`);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error(`Get notification stats error: ${error.message}`);
    next(error);
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
  body('recipientId')
    .isInt()
    .withMessage('Valid recipient ID is required'),
  body('type')
    .optional()
    .isIn(['info', 'success', 'warning', 'danger', 'exam', 'certificate', 'system'])
    .withMessage('Invalid notification type'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const notification = await NotificationService.createNotification({
      ...req.body,
      senderId: req.user.id
    });

    logger.info(`Notification created by ${req.user.email} for user: ${req.body.recipientId}`);

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    logger.error(`Create notification error: ${error.message}`);
    next(error);
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
    .isInt()
    .withMessage('Invalid recipient ID'),
  body('type')
    .optional()
    .isIn(['info', 'success', 'warning', 'danger', 'exam', 'certificate', 'system'])
    .withMessage('Invalid notification type')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const { recipients, ...notificationData } = req.body;

    // Broadcast notification to all recipients using service
    const created = await NotificationService.broadcastNotification(
      {
        ...notificationData,
        senderId: req.user.id
      },
      recipients
    );

    const createdCount = created.notificationsSent;
    logger.info(`Bulk notifications sent to ${createdCount} recipients by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: `Notifications sent to ${createdCount} recipients`,
      count: createdCount
    });
  } catch (error) {
    logger.error(`Send bulk notifications error: ${error.message}`);
    next(error);
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
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    // TODO: Get all active student IDs from User model
    // For now, create a broadcast notification that can be sent to all students
    // This would typically be handled by a separate job or service

    const broadcastNotification = await NotificationService.createNotification({
      title: req.body.title,
      message: req.body.message,
      type: req.body.type || 'system',
      priority: 'medium',
      senderId: req.user.id,
      recipientId: null, // null indicates broadcast
      isBroadcast: true
    });

    logger.info(`Broadcast notification created by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Broadcast notification created',
      data: broadcastNotification
    });
  } catch (error) {
    logger.error(`Broadcast notification error: ${error.message}`);
    next(error);
  }
});

module.exports = router;