const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Exam = require('../models/Exam');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};

    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by subject if provided
    if (req.query.subject) {
      query.subject = req.query.subject;
    }

    // Students can only see active exams, admins see all
    if (req.user.role === 'student') {
      query.status = 'active';
    }

    const exams = await Exam.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: exams.length,
      data: exams
    });
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single exam
// @route   GET /api/exams/:id
// @access  Private
router.get('/:id', [
  protect,
  param('id').isMongoId().withMessage('Invalid exam ID')
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

    const exam = await Exam.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('participants.user', 'name email');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check if user can access this exam
    if (req.user.role === 'student' && exam.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Exam is not currently available'
      });
    }

    res.status(200).json({
      success: true,
      data: exam
    });
  } catch (error) {
    console.error('Get exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create new exam
// @route   POST /api/exams
// @access  Private (Admin only)
router.post('/', [
  protect,
  authorize('admin'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title is required and must be less than 100 characters'),
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required'),
  body('duration')
    .isInt({ min: 1, max: 480 })
    .withMessage('Duration must be between 1 and 480 minutes'),
  body('totalQuestions')
    .isInt({ min: 1 })
    .withMessage('Total questions must be at least 1'),
  body('passingScore')
    .isInt({ min: 0, max: 100 })
    .withMessage('Passing score must be between 0 and 100'),
  body('questions')
    .optional()
    .isArray()
    .withMessage('Questions must be an array')
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

    // Create exam
    const exam = await Exam.create({
      ...req.body,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: exam
    });
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private (Admin only)
router.put('/:id', [
  protect,
  authorize('admin'),
  param('id').isMongoId().withMessage('Invalid exam ID'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be less than 100 characters'),
  body('subject')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Subject is required'),
  body('duration')
    .optional()
    .isInt({ min: 1, max: 480 })
    .withMessage('Duration must be between 1 and 480 minutes'),
  body('passingScore')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Passing score must be between 0 and 100')
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

    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Only allow updates if exam is not completed
    if (exam.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a completed exam'
      });
    }

    const updatedExam = await Exam.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedExam
    });
  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private (Admin only)
router.delete('/:id', [
  protect,
  authorize('admin'),
  param('id').isMongoId().withMessage('Invalid exam ID')
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

    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Only allow deletion if exam is not active
    if (exam.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an active exam'
      });
    }

    await Exam.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Exam deleted successfully'
    });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Start exam for student
// @route   POST /api/exams/:id/start
// @access  Private (Student only)
router.post('/:id/start', [
  protect,
  authorize('student'),
  param('id').isMongoId().withMessage('Invalid exam ID')
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

    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    if (exam.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Exam is not currently active'
      });
    }

    // Check if student is already enrolled
    const existingParticipant = exam.participants.find(
      p => p.user.toString() === req.user._id.toString()
    );

    if (existingParticipant && existingParticipant.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You have already completed this exam'
      });
    }

    // Add or update participant
    if (!existingParticipant) {
      exam.participants.push({
        user: req.user._id,
        status: 'in-progress',
        startedAt: new Date()
      });
    } else {
      existingParticipant.status = 'in-progress';
      existingParticipant.startedAt = new Date();
    }

    await exam.save();

    // Return exam data without answers for security
    const examData = {
      ...exam.toObject(),
      questions: exam.questions.map(q => ({
        _id: q._id,
        text: q.text,
        options: q.options,
        difficulty: q.difficulty,
        points: q.points
      }))
    };

    res.status(200).json({
      success: true,
      data: examData
    });
  } catch (error) {
    console.error('Start exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Submit exam answers
// @route   POST /api/exams/:id/submit
// @access  Private (Student only)
router.post('/:id/submit', [
  protect,
  authorize('student'),
  param('id').isMongoId().withMessage('Invalid exam ID'),
  body('answers')
    .isArray()
    .withMessage('Answers must be an array')
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

    const { answers } = req.body;
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Find participant
    const participantIndex = exam.participants.findIndex(
      p => p.user.toString() === req.user._id.toString()
    );

    if (participantIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'You are not enrolled in this exam'
      });
    }

    const participant = exam.participants[participantIndex];

    if (participant.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Exam already submitted'
      });
    }

    // Calculate score
    let correctAnswers = 0;
    const detailedAnswers = answers.map((answer, index) => {
      const question = exam.questions[index];
      const isCorrect = answer.selectedAnswer === question.correctAnswer;
      if (isCorrect) correctAnswers++;
      return {
        questionIndex: index,
        selectedAnswer: answer.selectedAnswer,
        timeSpent: answer.timeSpent || 0,
        isCorrect
      };
    });

    const score = Math.round((correctAnswers / exam.questions.length) * 100);
    const passed = score >= exam.passingScore;

    // Update participant
    participant.answers = detailedAnswers;
    participant.score = score;
    participant.percentage = score;
    participant.status = 'completed';
    participant.submittedAt = new Date();

    await exam.save();

    // Create notification
    await Notification.create({
      title: 'Exam Submitted',
      message: `You have successfully submitted ${exam.title}. Your score: ${score}%`,
      type: passed ? 'success' : 'warning',
      recipient: req.user._id,
      relatedExam: exam._id
    });

    res.status(200).json({
      success: true,
      data: {
        score,
        passed,
        correctAnswers,
        totalQuestions: exam.questions.length
      }
    });
  } catch (error) {
    console.error('Submit exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get exam analytics
// @route   GET /api/exams/:id/analytics
// @access  Private (Admin only)
router.get('/:id/analytics', [
  protect,
  authorize('admin'),
  param('id').isMongoId().withMessage('Invalid exam ID')
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

    const exam = await Exam.findById(req.params.id)
      .populate('participants.user', 'name email')
      .populate('createdBy', 'name');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    const analytics = {
      totalParticipants: exam.participants.length,
      completedParticipants: exam.participants.filter(p => p.status === 'completed').length,
      averageScore: exam.analytics.averageScore || 0,
      passRate: exam.analytics.passRate || 0,
      averageTime: exam.analytics.averageTime || 0,
      questionStats: exam.analytics.questionStats || [],
      participants: exam.participants.map(p => ({
        name: p.user.name,
        email: p.user.email,
        score: p.score,
        status: p.status,
        submittedAt: p.submittedAt,
        tabSwitches: p.tabSwitches
      }))
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get exam analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;