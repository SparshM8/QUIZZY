const express = require('express');
const { body, param, validationResult } = require('express-validator');
const StudentService = require('../services/StudentService');
const { protect, authorize } = require('../middleware/auth');
const { ValidationError, ForbiddenError } = require('../utils/errors');
const logger = require('../config/logger');

const router = express.Router();

// @desc    Get all students
// @route   GET /api/students
// @access  Private (Admin only)
router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const students = await StudentService.getAllStudentsWithStats();

    logger.info(`Students retrieved by ${req.user.email}`);

    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    logger.error(`Get students error: ${error.message}`);
    next(error);
  }
});

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private (Admin or own profile)
router.get('/:id', [
  protect,
  param('id').isInt().withMessage('Invalid student ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const studentId = parseInt(req.params.id);

    if (req.user.role === 'student' && studentId !== req.user.id) {
      throw new ForbiddenError('Not authorized to access this profile');
    }

    const student = await StudentService.getStudentById(studentId);
    const examHistory = await StudentService.getStudentExamHistory(studentId);

    const completed = examHistory.filter((exam) => exam.status === 'completed');
    const totalScore = completed.reduce((sum, exam) => sum + (exam.score || 0), 0);

    const examStats = {
      totalExams: examHistory.length,
      completedExams: completed.length,
      averageScore: completed.length ? Math.round(totalScore / completed.length) : 0,
      passRate: completed.length
        ? Math.round((completed.filter((exam) => exam.passed).length / completed.length) * 100)
        : 0,
      totalCertificates: completed.length
    };

    res.status(200).json({
      success: true,
      data: {
        student,
        examStats,
        recentExams: examHistory.slice(0, 5)
      }
    });
  } catch (error) {
    logger.error(`Get student error: ${error.message}`);
    next(error);
  }
});

// @desc    Create new student
// @route   POST /api/students
// @access  Private (Admin only)
router.post('/', [
  protect,
  authorize('admin'),
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const { name, email, password } = req.body;

    const student = await StudentService.createStudent({ name, email, password });

    logger.info(`Student created: ${student.email} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      data: {
        id: student.id,
        name: student.name,
        email: student.email,
        role: student.role,
        createdAt: student.createdAt
      }
    });
  } catch (error) {
    logger.error(`Create student error: ${error.message}`);
    next(error);
  }
});

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private (Admin or own profile)
router.put('/:id', [
  protect,
  param('id').isInt().withMessage('Invalid student ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const studentId = parseInt(req.params.id);

    if (req.user.role === 'student' && studentId !== req.user.id) {
      throw new ForbiddenError('Not authorized to update this profile');
    }

    if (req.body.isActive !== undefined && req.user.role !== 'admin') {
      throw new ForbiddenError('Not authorized to change account status');
    }

    const student = await StudentService.updateStudent(studentId, req.body);

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    logger.error(`Update student error: ${error.message}`);
    next(error);
  }
});

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private (Admin only)
router.delete('/:id', [
  protect,
  authorize('admin'),
  param('id').isInt().withMessage('Invalid student ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    await StudentService.deactivateStudent(req.params.id);

    logger.info(`Student deactivated: ${req.params.id} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Student account deactivated successfully'
    });
  } catch (error) {
    logger.error(`Delete student error: ${error.message}`);
    next(error);
  }
});

// @desc    Get student's exam history
// @route   GET /api/students/:id/exams
// @access  Private (Admin or own profile)
router.get('/:id/exams', [
  protect,
  param('id').isInt().withMessage('Invalid student ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const studentId = parseInt(req.params.id);

    if (req.user.role === 'student' && studentId !== req.user.id) {
      throw new ForbiddenError('Not authorized to access this data');
    }

    const examHistory = await StudentService.getStudentExamHistory(studentId);

    res.status(200).json({
      success: true,
      count: examHistory.length,
      data: examHistory
    });
  } catch (error) {
    logger.error(`Get student exams error: ${error.message}`);
    next(error);
  }
});

// @desc    Get student performance analytics
// @route   GET /api/students/:id/analytics
// @access  Private (Admin or own profile)
router.get('/:id/analytics', [
  protect,
  param('id').isInt().withMessage('Invalid student ID')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const studentId = parseInt(req.params.id);

    if (req.user.role === 'student' && studentId !== req.user.id) {
      throw new ForbiddenError('Not authorized to access this data');
    }

    const performance = await StudentService.getStudentAnalytics(studentId);

    res.status(200).json({
      success: true,
      data: performance
    });
  } catch (error) {
    logger.error(`Get student analytics error: ${error.message}`);
    next(error);
  }
});

module.exports = router;
