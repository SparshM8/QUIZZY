const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'danger', 'exam', 'certificate', 'system'],
    default: 'info'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relatedExam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam'
  },
  relatedCertificate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: Date,
  pushSent: {
    type: Boolean,
    default: false
  },
  pushSentAt: Date,
  scheduledFor: Date,
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  },
  metadata: {
    actionUrl: String,
    actionText: String,
    icon: String,
    category: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking if notification is expired
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

// Virtual for time since creation
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffInSeconds = Math.floor((now - created) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
});

// Index for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ scheduledFor: 1 });

// Pre-save middleware for scheduled notifications
notificationSchema.pre('save', function(next) {
  if (this.scheduledFor && this.scheduledFor > new Date()) {
    // Don't create notification yet if it's scheduled for future
    return next();
  }
  next();
});

// Static method to get unread notifications for user
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false,
    expiresAt: { $gt: new Date() }
  });
};

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = function(notificationIds, userId) {
  return this.updateMany(
    { _id: { $in: notificationIds }, recipient: userId },
    { $set: { isRead: true, readAt: new Date() } }
  );
};

// Static method to create exam reminder notifications
notificationSchema.statics.createExamReminder = function(examId, userId, reminderType = 'start') {
  const messages = {
    start: {
      title: 'Exam Starting Soon',
      message: 'Your exam is scheduled to start in 15 minutes. Please be ready.',
      type: 'exam',
      priority: 'high'
    },
    end: {
      title: 'Exam Ending Soon',
      message: 'Your exam will end in 10 minutes. Please review your answers.',
      type: 'warning',
      priority: 'urgent'
    }
  };

  const reminder = messages[reminderType];
  if (!reminder) return null;

  return this.create({
    ...reminder,
    recipient: userId,
    relatedExam: examId,
    metadata: {
      actionUrl: `/exam/${examId}`,
      actionText: 'Go to Exam',
      category: 'exam_reminder'
    }
  });
};

module.exports = mongoose.model('Notification', notificationSchema);