const { Notification, User } = require('../models');
const { NotFoundError, ValidationError } = require('../utils/errors');

class NotificationService {
  // Create notification
  static async createNotification(notificationData) {
    try {
      const notification = await Notification.create({
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || 'info',
        priority: notificationData.priority || 'medium',
        recipientId: notificationData.recipientId,
        senderId: notificationData.senderId || null,
        relatedExamId: notificationData.relatedExamId || null,
        relatedCertificateId: notificationData.relatedCertificateId || null,
        metadata: notificationData.metadata || {}
      });

      return notification;
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        throw new ValidationError(error.errors[0].message);
      }
      throw error;
    }
  }

  // Get notification by ID
  static async getNotificationById(notificationId) {
    const notification = await Notification.findByPk(notificationId, {
      include: [
        { model: User, as: 'recipient', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'sender', attributes: ['id', 'name'] }
      ]
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    return notification;
  }

  // Get user notifications
  static async getUserNotifications(userId, options = {}) {
    const { limit = 20, offset = 0, unreadOnly = false, isRead } = options;
    const where = { recipientId: userId };

    if (unreadOnly) {
      where.isRead = false;
    }

    if (typeof isRead === 'boolean') {
      where.isRead = isRead;
    }

    const { count, rows } = await Notification.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    return { total: count, data: rows };
  }

  // Mark as read
  static async markAsRead(notificationId) {
    const notification = await this.getNotificationById(notificationId);

    if (!notification.isRead) {
      await notification.update({
        isRead: true,
        readAt: new Date()
      });
    }

    return notification;
  }

  // Mark all as read for user
  static async markAllAsRead(userId) {
    const updated = await Notification.update(
      {
        isRead: true,
        readAt: new Date()
      },
      {
        where: {
          recipientId: userId,
          isRead: false
        }
      }
    );

    return { message: `${updated[0]} notifications marked as read` };
  }

  // Delete notification
  static async deleteNotification(notificationId) {
    const notification = await this.getNotificationById(notificationId);
    await notification.destroy();
    return { message: 'Notification deleted' };
  }

  // Send broadcast notification to multiple users
  static async broadcastNotification(notificationData, userIds) {
    try {
      const notifications = await Notification.bulkCreate(
        userIds.map(userId => ({
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type || 'system',
          priority: notificationData.priority || 'medium',
          recipientId: userId,
          senderId: notificationData.senderId || null,
          metadata: notificationData.metadata || {}
        }))
      );

      return { notificationsSent: notifications.length };
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        throw new ValidationError(error.errors[0].message);
      }
      throw error;
    }
  }

  // Get unread count
  static async getUnreadCount(userId) {
    const count = await Notification.count({
      where: {
        recipientId: userId,
        isRead: false
      }
    });

    return { unreadCount: count };
  }

  // Clean up expired notifications (older than 30 days)
  static async cleanupExpiredNotifications() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const destroyed = await Notification.destroy({
      where: {
        expiresAt: { [require('sequelize').Op.lt]: thirtyDaysAgo }
      }
    });

    return { notificationsDeleted: destroyed };
  }
}

module.exports = NotificationService;
