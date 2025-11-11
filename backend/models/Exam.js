const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  options: [{
    type: String,
    required: true,
    trim: true
  }],
  correctAnswer: {
    type: Number,
    required: [true, 'Correct answer index is required'],
    min: 0
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  points: {
    type: Number,
    default: 1,
    min: 1
  },
  explanation: {
    type: String,
    trim: true
  },
  timeLimit: {
    type: Number, // in seconds
    default: 0 // 0 means no time limit per question
  }
});

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Exam title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  duration: {
    type: Number, // in minutes
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute'],
    max: [480, 'Duration cannot exceed 8 hours']
  },
  totalQuestions: {
    type: Number,
    required: [true, 'Total questions is required'],
    min: [1, 'Must have at least 1 question']
  },
  passingScore: {
    type: Number, // percentage
    required: [true, 'Passing score is required'],
    min: [0, 'Passing score cannot be less than 0'],
    max: [100, 'Passing score cannot exceed 100']
  },
  questions: [questionSchema],
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  scheduledDate: {
    type: Date
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  instructions: {
    type: String,
    trim: true,
    default: 'Please read all questions carefully before answering. Once submitted, answers cannot be changed.'
  },
  settings: {
    shuffleQuestions: {
      type: Boolean,
      default: false
    },
    shuffleOptions: {
      type: Boolean,
      default: false
    },
    showResults: {
      type: Boolean,
      default: true
    },
    allowReview: {
      type: Boolean,
      default: true
    },
    maxTabSwitches: {
      type: Number,
      default: 3
    },
    lockdownMode: {
      type: Boolean,
      default: true
    },
    webcamRequired: {
      type: Boolean,
      default: false
    },
    screenshotPrevention: {
      type: Boolean,
      default: true
    }
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    startedAt: Date,
    submittedAt: Date,
    score: Number,
    percentage: Number,
    status: {
      type: String,
      enum: ['enrolled', 'in-progress', 'completed', 'absent'],
      default: 'enrolled'
    },
    answers: [{
      questionIndex: Number,
      selectedAnswer: Number,
      timeSpent: Number, // in seconds
      isCorrect: Boolean
    }],
    tabSwitches: {
      type: Number,
      default: 0
    },
    violations: [{
      type: {
        type: String,
        enum: ['tab_switch', 'window_focus', 'copy_paste', 'right_click', 'screenshot']
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      description: String
    }],
    certificate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Certificate'
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  analytics: {
    totalParticipants: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    passRate: {
      type: Number,
      default: 0
    },
    averageTime: {
      type: Number,
      default: 0
    },
    questionStats: [{
      questionIndex: Number,
      correctCount: Number,
      incorrectCount: Number,
      averageTime: Number
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking if exam is active
examSchema.virtual('isActive').get(function() {
  return this.status === 'active' &&
         this.startTime <= new Date() &&
         this.endTime > new Date();
});

// Virtual for time remaining
examSchema.virtual('timeRemaining').get(function() {
  if (this.status !== 'active') return 0;
  const now = new Date();
  const end = new Date(this.endTime);
  return Math.max(0, Math.floor((end - now) / 1000 / 60)); // in minutes
});

// Index for efficient queries
examSchema.index({ status: 1, scheduledDate: 1 });
examSchema.index({ createdBy: 1 });
examSchema.index({ 'participants.user': 1 });

// Pre-save middleware to calculate analytics
examSchema.pre('save', function(next) {
  if (this.isModified('participants')) {
    const completedParticipants = this.participants.filter(p => p.status === 'completed');

    if (completedParticipants.length > 0) {
      this.analytics.totalParticipants = completedParticipants.length;
      this.analytics.averageScore = completedParticipants.reduce((sum, p) => sum + (p.score || 0), 0) / completedParticipants.length;
      this.analytics.passRate = (completedParticipants.filter(p => p.percentage >= this.passingScore).length / completedParticipants.length) * 100;
      this.analytics.averageTime = completedParticipants.reduce((sum, p) => sum + (p.answers.reduce((timeSum, ans) => timeSum + (ans.timeSpent || 0), 0)), 0) / completedParticipants.length;
    }
  }

  next();
});

module.exports = mongoose.model('Exam', examSchema);