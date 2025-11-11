const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: true,
    unique: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: [true, 'Exam is required']
  },
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: 0,
    max: 100
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
    required: true
  },
  status: {
    type: String,
    enum: ['issued', 'revoked', 'expired'],
    default: 'issued'
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  certificateUrl: {
    type: String,
    required: true
  },
  qrCode: {
    type: String // URL to QR code image
  },
  metadata: {
    template: {
      type: String,
      default: 'default'
    },
    backgroundColor: {
      type: String,
      default: '#ffffff'
    },
    textColor: {
      type: String,
      default: '#000000'
    },
    fontFamily: {
      type: String,
      default: 'Arial'
    },
    logoUrl: String,
    signatureUrl: String
  },
  verificationCode: {
    type: String,
    unique: true,
    required: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloaded: Date,
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking if certificate is valid
certificateSchema.virtual('isValid').get(function() {
  return this.status === 'issued' && this.expiryDate > new Date();
});

// Virtual for days until expiry
certificateSchema.virtual('daysUntilExpiry').get(function() {
  const now = new Date();
  const expiry = new Date(this.expiryDate);
  return Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)));
});

// Index for efficient queries
certificateSchema.index({ student: 1, exam: 1 });
certificateSchema.index({ certificateId: 1 });
certificateSchema.index({ verificationCode: 1 });
certificateSchema.index({ status: 1, expiryDate: 1 });

// Pre-save middleware to generate certificate ID and verification code
certificateSchema.pre('save', function(next) {
  if (this.isNew) {
    // Generate certificate ID
    if (!this.certificateId) {
      this.certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    }

    // Generate verification code
    if (!this.verificationCode) {
      this.verificationCode = Math.random().toString(36).substr(2, 12).toUpperCase();
    }

    // Determine grade based on score
    if (!this.grade) {
      if (this.score >= 95) this.grade = 'A+';
      else if (this.score >= 90) this.grade = 'A';
      else if (this.score >= 85) this.grade = 'B+';
      else if (this.score >= 80) this.grade = 'B';
      else if (this.score >= 75) this.grade = 'C+';
      else if (this.score >= 70) this.grade = 'C';
      else if (this.score >= 60) this.grade = 'D';
      else this.grade = 'F';
    }
  }

  next();
});

// Static method to verify certificate
certificateSchema.statics.verifyCertificate = function(verificationCode) {
  return this.findOne({
    verificationCode,
    status: 'issued',
    expiryDate: { $gt: new Date() }
  }).populate('student', 'name email').populate('exam', 'title subject');
};

module.exports = mongoose.model('Certificate', certificateSchema);