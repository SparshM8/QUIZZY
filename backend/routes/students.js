const express = require('express');
const { body, param, validationResult } = require('express-validator');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Certificate = require('../models/Certificate');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all students
// @route   GET /api/students
// @access  Private (Admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('-password')
      .populate('certificates')
      .sort({ createdAt: -1 });

    // Add exam statistics for each student
    const studentsWithStats = await Promise.all(
      students.map(async (student) => {
        const examStats = await Exam.aggregate([
          { $match: { 'participants.user': student._id } },
          {
            $group: {
              _id: null,
              totalExams: { $sum: 1 },
              completedExams: {
                $sum: {
                  $cond: [
                    { $eq: ['$participants.status', 'completed'] },
                    1,
                    0
                  ]
                }
              },
              averageScore: { $avg: '$participants.score' },
              totalCertificates: {
                $sum: {
                  $cond: [
                    { $ne: ['$participants.certificate', null] },
                    1,
                    0
                  ]
                }
              }
            }
          }
        ]);

        const stats = examStats[0] || {
          totalExams: 0,
          completedExams: 0,
          averageScore: 0,
          totalCertificates: 0
        };

        return {
          ...student.toObject(),
          examStats: stats
        };
      })
    );

    res.status(200).json({
      success: true,
      count: studentsWithStats.length,
      data: studentsWithStats
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private (Admin or own profile)
router.get('/:id', [
  protect,
  param('id').isMongoId().withMessage('Invalid student ID')
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

    // Check if user can access this student profile
    if (req.user.role === 'student' && req.params.id !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this profile'
      });
    }

    const student = await User.findById(req.params.id)
      .select('-password')
      .populate('certificates')
      .populate('examsTaken.exam', 'title subject duration');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get detailed exam statistics
    const exams = await Exam.find({
      'participants.user': student._id
    }).select('title subject participants score status scheduledDate');

    const examStats = {
      totalExams: exams.length,
      completedExams: exams.filter(exam =>
        exam.participants.find(p => p.user.toString() === student._id.toString() && p.status === 'completed')
      ).length,
      averageScore: 0,
      passRate: 0,
      totalCertificates: student.certificates.length
    };

    // Calculate average score
    const completedExams = exams.filter(exam =>
      exam.participants.find(p => p.user.toString() === student._id.toString() && p.status === 'completed')
    );

    if (completedExams.length > 0) {
      const totalScore = completedExams.reduce((sum, exam) => {
        const participant = exam.participants.find(p => p.user.toString() === student._id.toString());
        return sum + (participant.score || 0);
      }, 0);
      examStats.averageScore = Math.round(totalScore / completedExams.length);
      examStats.passRate = Math.round(
        (completedExams.filter(exam => {
          const participant = exam.participants.find(p => p.user.toString() === student._id.toString());
          return participant.score >= exam.passingScore;
        }).length / completedExams.length) * 100
      );
    }

    res.status(200).json({
      success: true,
      data: {
        student,
        examStats,
        recentExams: exams.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
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

    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create student
    const student = await User.create({
      name,
      email,
      password,
      role: 'student'
    });

    res.status(201).json({
      success: true,
      data: {
        id: student._id,
        name: student.name,
        email: student.email,
        role: student.role,
        createdAt: student.createdAt
      }
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private (Admin or own profile)
router.put('/:id', [
  protect,
  param('id').isMongoId().withMessage('Invalid student ID'),
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

    // Check if user can update this student
    if (req.user.role === 'student' && req.params.id !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this profile'
      });
    }

    // Only admins can deactivate accounts
    if (req.body.isActive !== undefined && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to change account status'
      });
    }

    const student = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private (Admin only)
router.delete('/:id', [
  protect,
  authorize('admin'),
  param('id').isMongoId().withMessage('Invalid student ID')
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

    const student = await User.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Soft delete by deactivating
    student.isActive = false;
    await student.save();

    res.status(200).json({
      success: true,
      message: 'Student account deactivated successfully'
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get student's exam history
// @route   GET /api/students/:id/exams
// @access  Private (Admin or own profile)
router.get('/:id/exams', [
  protect,
  param('id').isMongoId().withMessage('Invalid student ID')
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

    // Check if user can access this student's exams
    if (req.user.role === 'student' && req.params.id !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this data'
      });
    }

    const exams = await Exam.find({
      'participants.user': req.params.id
    })
    .select('title subject duration passingScore status scheduledDate participants')
    .sort({ scheduledDate: -1 });

    const examHistory = exams.map(exam => {
      const participant = exam.participants.find(
        p => p.user.toString() === req.params.id
      );

      return {
        examId: exam._id,
        title: exam.title,
        subject: exam.subject,
        duration: exam.duration,
        scheduledDate: exam.scheduledDate,
        status: participant ? participant.status : 'not-started',
        score: participant ? participant.score : null,
        percentage: participant ? participant.percentage : null,
        submittedAt: participant ? participant.submittedAt : null,
        passed: participant ? participant.percentage >= exam.passingScore : null
      };
    });

    res.status(200).json({
      success: true,
      count: examHistory.length,
      data: examHistory
    });
  } catch (error) {
    console.error('Get student exams error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get student performance analytics
// @route   GET /api/students/:id/analytics
// @access  Private (Admin or own profile)
router.get('/:id/analytics', [
  protect,
  param('id').isMongoId().withMessage('Invalid student ID')
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

    // Check if user can access this student's analytics
    if (req.user.role === 'student' && req.params.id !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this data'
      });
    }

    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get exam performance data
    const exams = await Exam.find({
      'participants.user': req.params.id,
      'participants.status': 'completed'
    });

    const performance = {
      totalExams: exams.length,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 100,
      passRate: 0,
      subjectWise: {},
      recentPerformance: []
    };

    if (exams.length > 0) {
      let totalScore = 0;
      let passedExams = 0;

      exams.forEach(exam => {
        const participant = exam.participants.find(
          p => p.user.toString() === req.params.id
        );

        if (participant && participant.score !== undefined) {
          totalScore += participant.score;
          performance.highestScore = Math.max(performance.highestScore, participant.score);
          performance.lowestScore = Math.min(performance.lowestScore, participant.score);

          if (participant.score >= exam.passingScore) {
            passedExams++;
          }

          // Subject-wise performance
          if (!performance.subjectWise[exam.subject]) {
            performance.subjectWise[exam.subject] = {
              exams: 0,
              totalScore: 0,
              averageScore: 0
            };
          }
          performance.subjectWise[exam.subject].exams++;
          performance.subjectWise[exam.subject].totalScore += participant.score;

          // Recent performance (last 10 exams)
          performance.recentPerformance.push({
            examTitle: exam.title,
            subject: exam.subject,
            score: participant.score,
            date: participant.submittedAt,
            passed: participant.score >= exam.passingScore
          });
        }
      });

      performance.averageScore = Math.round(totalScore / exams.length);
      performance.passRate = Math.round((passedExams / exams.length) * 100);

      // Calculate subject averages
      Object.keys(performance.subjectWise).forEach(subject => {
        const subjectData = performance.subjectWise[subject];
        subjectData.averageScore = Math.round(subjectData.totalScore / subjectData.exams);
      });

      // Sort recent performance by date
      performance.recentPerformance.sort((a, b) => new Date(b.date) - new Date(a.date));
      performance.recentPerformance = performance.recentPerformance.slice(0, 10);
    }

    res.status(200).json({
      success: true,
      data: performance
    });
  } catch (error) {
    console.error('Get student analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;