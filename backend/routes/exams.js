const express = require('express');
const { body, param, validationResult } = require('express-validator');
const ExamService = require('../services/ExamService');
const NotificationService = require('../services/NotificationService');
const { protect, authorize } = require('../middleware/auth');
const { ValidationError, NotFoundError, ForbiddenError } = require('../utils/errors');
const { ROLES } = require('../utils/roles');
const logger = require('../config/logger');

const router = express.Router();

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const options = {
      limit: parseInt(req.query.limit) || 10,
      offset: parseInt(req.query.offset) || 0,
      order: [['createdAt', 'DESC']],
      include: ['createdBy']
    };

    // Filter by status if provided
    let filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.subject) {
      filter.subject = req.query.subject;
    }

    // Students can only see active exams, admins see all
    if (req.user.role === 'student') {
      filter.status = 'active';
    }

    if (filter.status) options.status = filter.status;
    if (filter.subject) options.subject = filter.subject;

    const { total, data } = await ExamService.getAllExams(options);

    logger.info(`Exams retrieved for user: ${req.user.email}`);

    res.status(200).json({
      success: true,
      count: total,
      data
    });
  } catch (error) {
    logger.error(`Get exams error: ${error.message}`);
    next(error);
  }
});

// @desc    Get exam details by share code
// @route   GET /api/exams/join/:code
// @access  Public
router.get('/join/:code', [
  param('code')
    .isLength({ min: 6, max: 16 })
    .withMessage('Invalid join code')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const exam = await ExamService.getExamByJoinCode(req.params.code.toUpperCase());

    res.status(200).json({
      success: true,
      data: {
        id: exam.id,
        title: exam.title,
        subject: exam.subject,
        description: exam.description,
        duration: exam.duration,
        totalQuestions: exam.totalQuestions,
        status: exam.status,
        joinCode: exam.joinCode,
        creator: exam.creator
      }
    });
  } catch (error) {
    logger.error(`Join exam lookup error: ${error.message}`);
    next(error);
  }
});

// @desc    Get single exam
// @route   GET /api/exams/:id
// @access  Private
router.get('/:id', [
  protect,
  param('id').isInt().withMessage('Invalid exam ID')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const exam = await ExamService.getExamById(req.params.id, true);

    if (!exam) {
      throw new NotFoundError('Exam not found');
    }

    // Check if user can access this exam
    if (req.user.role === 'student' && exam.status !== 'active') {
      throw new ForbiddenError('Exam is not currently available');
    }

    logger.info(`Exam retrieved: ${exam.id}`);

    res.status(200).json({
      success: true,
      data: exam
    });
  } catch (error) {
    logger.error(`Get exam error: ${error.message}`);
    next(error);
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
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    // Create exam
    const exam = await ExamService.createExam(req.body, req.user.id);

    logger.info(`Exam created: ${exam.title} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      data: exam
    });
  } catch (error) {
    logger.error(`Create exam error: ${error.message}`);
    next(error);
  }
});

// @desc    Get exam invite link
// @route   GET /api/exams/:id/invite-link
// @access  Private (Manager/Admin/Super Admin)
router.get('/:id/invite-link', [
  protect,
  authorize(ROLES.MANAGER),
  param('id').isInt().withMessage('Invalid exam ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const exam = await ExamService.getExamById(req.params.id);
    const origin = req.get('origin') || process.env.FRONTEND_URL || 'http://localhost';

    if (!exam.joinCode) {
      await ExamService.regenerateJoinCode(req.params.id);
    }

    const refreshedExam = await ExamService.getExamById(req.params.id);

    res.status(200).json({
      success: true,
      data: {
        examId: refreshedExam.id,
        joinCode: refreshedExam.joinCode,
        joinUrl: `${origin}/join/${refreshedExam.joinCode}`
      }
    });
  } catch (error) {
    logger.error(`Get invite link error: ${error.message}`);
    next(error);
  }
});

// @desc    Regenerate exam invite link
// @route   POST /api/exams/:id/invite-link/regenerate
// @access  Private (Manager/Admin/Super Admin)
router.post('/:id/invite-link/regenerate', [
  protect,
  authorize(ROLES.MANAGER),
  param('id').isInt().withMessage('Invalid exam ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const exam = await ExamService.regenerateJoinCode(req.params.id);
    const origin = req.get('origin') || process.env.FRONTEND_URL || 'http://localhost';

    res.status(200).json({
      success: true,
      data: {
        examId: exam.id,
        joinCode: exam.joinCode,
        joinUrl: `${origin}/join/${exam.joinCode}`
      }
    });
  } catch (error) {
    logger.error(`Regenerate invite link error: ${error.message}`);
    next(error);
  }
});

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private (Admin only)
router.put('/:id', [
  protect,
  authorize('admin'),
  param('id').isInt().withMessage('Invalid exam ID'),
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
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const exam = await ExamService.getExamById(req.params.id);

    if (!exam) {
      throw new NotFoundError('Exam not found');
    }

    // Only allow updates if exam is not completed
    if (exam.status === 'completed') {
      throw new ValidationError('Cannot update a completed exam');
    }

    const updatedExam = await ExamService.updateExam(req.params.id, req.body);

    logger.info(`Exam updated: ${updatedExam.title} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      data: updatedExam
    });
  } catch (error) {
    logger.error(`Update exam error: ${error.message}`);
    next(error);
  }
});

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private (Admin only)
router.delete('/:id', [
  protect,
  authorize('admin'),
  param('id').isInt().withMessage('Invalid exam ID')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const exam = await ExamService.getExamById(req.params.id);

    if (!exam) {
      throw new NotFoundError('Exam not found');
    }

    // Only allow deletion if exam is not active
    if (exam.status === 'active') {
      throw new ValidationError('Cannot delete an active exam');
    }

    await ExamService.deleteExam(req.params.id);

    logger.info(`Exam deleted: ${exam.title} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Exam deleted successfully'
    });
  } catch (error) {
    logger.error(`Delete exam error: ${error.message}`);
    next(error);
  }
});

// @desc    Start exam for student
// @route   POST /api/exams/:id/start
// @access  Private (Student only)
router.post('/:id/start', [
  protect,
  authorize('student'),
  param('id').isInt().withMessage('Invalid exam ID')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const exam = await ExamService.getExamById(req.params.id);

    if (!exam) {
      throw new NotFoundError('Exam not found');
    }

    if (exam.status !== 'active') {
      throw new ValidationError('Exam is not currently active');
    }

    // Enroll student in exam
    await ExamService.enrollStudent(req.params.id, req.user.id);

    // Return exam data without correct answers for security
    const safeExam = {
      id: exam.id,
      title: exam.title,
      subject: exam.subject,
      duration: exam.duration,
      totalQuestions: exam.questions.length,
      questions: exam.questions.map(q => ({
        text: q.text,
        options: q.options,
        difficulty: q.difficulty,
        points: q.points
      }))
    };

    logger.info(`Exam started by student: ${req.user.email} for exam: ${exam.title}`);

    res.status(200).json({
      success: true,
      data: safeExam
    });
  } catch (error) {
    logger.error(`Start exam error: ${error.message}`);
    next(error);
  }
});

// @desc    Submit exam answers
// @route   POST /api/exams/:id/submit
// @access  Private (Student only)
router.post('/:id/submit', [
  protect,
  authorize('student'),
  param('id').isInt().withMessage('Invalid exam ID'),
  body('answers')
    .isArray()
    .withMessage('Answers must be an array')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const { answers } = req.body;
    const exam = await ExamService.getExamById(req.params.id);

    if (!exam) {
      throw new NotFoundError('Exam not found');
    }

    // Submit exam using service
    const result = await ExamService.submitExam(req.params.id, req.user.id, answers);

    // Create notification
    const message = result.passed 
      ? `You have successfully submitted ${exam.title}. Your score: ${result.score}% - PASSED`
      : `You have successfully submitted ${exam.title}. Your score: ${result.score}% - NOT PASSED`;

    await NotificationService.createNotification({
      recipientId: req.user.id,
      title: 'Exam Submitted',
      message: message,
      type: result.passed ? 'success' : 'warning',
      relatedExamId: exam.id,
      priority: 'high'
    });

    logger.info(`Exam submitted by student: ${req.user.email}, Score: ${result.score}%`);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Submit exam error: ${error.message}`);
    next(error);
  }
});

// @desc    Get exam analytics
// @route   GET /api/exams/:id/analytics
// @access  Private (Admin only)
router.get('/:id/analytics', [
  protect,
  authorize('admin'),
  param('id').isInt().withMessage('Invalid exam ID')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const exam = await ExamService.getExamById(req.params.id, true);

    if (!exam) {
      throw new NotFoundError('Exam not found');
    }

    const analytics = {
      examId: exam.id,
      examTitle: exam.title,
      totalParticipants: exam.analytics?.totalParticipants || 0,
      averageScore: exam.analytics?.averageScore || 0,
      passRate: exam.analytics?.passRate || 0,
      averageTime: exam.analytics?.averageTime || 0,
      createdAt: exam.createdAt,
      createdBy: exam.createdBy?.email || 'Unknown Admin'
    };

    logger.info(`Exam analytics retrieved: ${exam.title} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error(`Get exam analytics error: ${error.message}`);
    next(error);
  }
});

module.exports = router;