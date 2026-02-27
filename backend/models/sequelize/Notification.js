const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: true }
    },
    type: {
      type: DataTypes.ENUM('info', 'success', 'warning', 'danger', 'exam', 'certificate', 'system'),
      defaultValue: 'info'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium'
    },
    recipientId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    senderId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true
    },
    relatedExamId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true
    },
    relatedCertificateId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    emailSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    emailSentAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    pushSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    pushSentAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    scheduledFor: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      defaultValue: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  }, {
    timestamps: true,
    tableName: 'notifications',
    indexes: [
      { fields: ['recipient_id', 'is_read', 'created_at'] },
      { fields: ['expires_at'] },
      { fields: ['scheduled_for'] }
    ]
  });

  Notification.prototype.isExpired = function() {
    return this.expiresAt < new Date();
  };

  Notification.prototype.timeAgo = function() {
    const now = new Date();
    const created = new Date(this.createdAt);
    const diffInSeconds = Math.floor((now - created) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  return Notification;
};
