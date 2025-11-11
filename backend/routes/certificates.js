const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Certificate = require('../models/Certificate');
const Exam = require('../models/Exam');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// @desc    Get all certificates
// @route   GET /api/certificates
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};

    // Filter by student if provided (admin only)
    if (req.query.student && req.user.role === 'admin') {
      query.student = req.query.student;
    } else if (req.user.role === 'student') {
      // Students can only see their own certificates
      query.student = req.user._id;
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    const certificates = await Certificate.find(query)
      .populate('student', 'name email')
      .populate('exam', 'title subject')
      .populate('issuedBy', 'name')
      .sort({ issuedDate: -1 });

    res.status(200).json({
      success: true,
      count: certificates.length,
      data: certificates
    });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single certificate
// @route   GET /api/certificates/:id
// @access  Private
router.get('/:id', [
  protect,
  param('id').isMongoId().withMessage('Invalid certificate ID')
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

    const certificate = await Certificate.findById(req.params.id)
      .populate('student', 'name email')
      .populate('exam', 'title subject description')
      .populate('issuedBy', 'name');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Check if user can access this certificate
    if (req.user.role === 'student' &&
        certificate.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this certificate'
      });
    }

    res.status(200).json({
      success: true,
      data: certificate
    });
  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Generate certificate
// @route   POST /api/certificates/generate
// @access  Private (Admin only)
router.post('/generate', [
  protect,
  authorize('admin'),
  body('studentId')
    .isMongoId()
    .withMessage('Valid student ID is required'),
  body('examId')
    .isMongoId()
    .withMessage('Valid exam ID is required'),
  body('score')
    .isInt({ min: 0, max: 100 })
    .withMessage('Score must be between 0 and 100')
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

    const { studentId, examId, score } = req.body;

    // Check if student and exam exist
    const student = await User.findById(studentId);
    const exam = await Exam.findById(examId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({
      student: studentId,
      exam: examId
    });

    if (existingCertificate) {
      return res.status(400).json({
        success: false,
        message: 'Certificate already exists for this student and exam'
      });
    }

    // Check if student passed the exam
    const participant = exam.participants.find(
      p => p.user.toString() === studentId && p.status === 'completed'
    );

    if (!participant) {
      return res.status(400).json({
        success: false,
        message: 'Student has not completed this exam'
      });
    }

    // Generate certificate URL (simplified - in production use PDF generation)
    const certificateUrl = `/certificates/${studentId}/${examId}.pdf`;

    // Create certificate
    const certificate = await Certificate.create({
      student: studentId,
      exam: examId,
      score: score || participant.score,
      issuedBy: req.user._id,
      certificateUrl
    });

    // Update student's certificates
    await User.findByIdAndUpdate(studentId, {
      $push: { certificates: certificate._id }
    });

    // Update exam participant's certificate
    await Exam.findOneAndUpdate(
      { _id: examId, 'participants.user': studentId },
      { $set: { 'participants.$.certificate': certificate._id } }
    );

    const populatedCertificate = await Certificate.findById(certificate._id)
      .populate('student', 'name email')
      .populate('exam', 'title subject')
      .populate('issuedBy', 'name');

    res.status(201).json({
      success: true,
      data: populatedCertificate
    });
  } catch (error) {
    console.error('Generate certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Verify certificate
// @route   GET /api/certificates/verify/:code
// @access  Public
router.get('/verify/:code', [
  param('code')
    .isLength({ min: 12, max: 12 })
    .withMessage('Invalid verification code')
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

    const certificate = await Certificate.verifyCertificate(req.params.code);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found or invalid'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        certificateId: certificate.certificateId,
        studentName: certificate.student.name,
        examTitle: certificate.exam.title,
        score: certificate.score,
        grade: certificate.grade,
        issuedDate: certificate.issuedDate,
        expiryDate: certificate.expiryDate,
        isValid: certificate.isValid,
        issuedBy: certificate.issuedBy.name
      }
    });
  } catch (error) {
    console.error('Verify certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Download certificate
// @route   GET /api/certificates/:id/download
// @access  Private
router.get('/:id/download', [
  protect,
  param('id').isMongoId().withMessage('Invalid certificate ID')
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

    const certificate = await Certificate.findById(req.params.id)
      .populate('student')
      .populate('exam');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Check if user can download this certificate
    if (req.user.role === 'student' &&
        certificate.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to download this certificate'
      });
    }

    // Update download count
    certificate.downloadCount += 1;
    certificate.lastDownloaded = new Date();
    await certificate.save();

    // In production, generate and return actual PDF
    // For now, return certificate data
    res.status(200).json({
      success: true,
      message: 'Certificate download initiated',
      data: certificate
    });
  } catch (error) {
    console.error('Download certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Revoke certificate
// @route   PUT /api/certificates/:id/revoke
// @access  Private (Admin only)
router.put('/:id/revoke', [
  protect,
  authorize('admin'),
  param('id').isMongoId().withMessage('Invalid certificate ID'),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Revocation reason is required')
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

    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    if (certificate.status === 'revoked') {
      return res.status(400).json({
        success: false,
        message: 'Certificate is already revoked'
      });
    }

    certificate.status = 'revoked';
    certificate.metadata.revocationReason = req.body.reason;
    certificate.metadata.revokedAt = new Date();
    certificate.metadata.revokedBy = req.user._id;

    await certificate.save();

    res.status(200).json({
      success: true,
      message: 'Certificate revoked successfully',
      data: certificate
    });
  } catch (error) {
    console.error('Revoke certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get certificate statistics
// @route   GET /api/certificates/stats/summary
// @access  Private (Admin only)
router.get('/stats/summary', protect, authorize('admin'), async (req, res) => {
  try {
    const stats = await Certificate.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgScore: { $avg: '$score' }
        }
      }
    ]);

    const totalCertificates = await Certificate.countDocuments();
    const validCertificates = await Certificate.countDocuments({
      status: 'issued',
      expiryDate: { $gt: new Date() }
    });

    res.status(200).json({
      success: true,
      data: {
        totalCertificates,
        validCertificates,
        stats
      }
    });
  } catch (error) {
    console.error('Get certificate stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Generate bulk certificates
// @route   POST /api/certificates/generate-bulk
// @access  Private (Admin only)
router.post('/generate-bulk', [
  protect,
  authorize('admin'),
  body('examId')
    .isMongoId()
    .withMessage('Valid exam ID is required'),
  body('participants')
    .isArray()
    .withMessage('Participants array is required'),
  body('participants.*.studentId')
    .isMongoId()
    .withMessage('Valid student ID is required'),
  body('participants.*.score')
    .isInt({ min: 0, max: 100 })
    .withMessage('Score must be between 0 and 100')
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

    const { examId, participants } = req.body;

    // Check if exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    const results = {
      success: [],
      failed: [],
      total: participants.length
    };

    // Process each participant
    for (const participant of participants) {
      try {
        const { studentId, score } = participant;

        // Check if student exists
        const student = await User.findById(studentId);
        if (!student) {
          results.failed.push({
            studentId,
            reason: 'Student not found'
          });
          continue;
        }

        // Check if certificate already exists
        const existingCertificate = await Certificate.findOne({
          student: studentId,
          exam: examId
        });

        if (existingCertificate) {
          results.failed.push({
            studentId,
            reason: 'Certificate already exists'
          });
          continue;
        }

        // Check if student passed the exam
        const examParticipant = exam.participants.find(
          p => p.user.toString() === studentId && p.status === 'completed'
        );

        if (!examParticipant) {
          results.failed.push({
            studentId,
            reason: 'Student has not completed this exam'
          });
          continue;
        }

        // Generate certificate URL
        const certificateUrl = `/certificates/${studentId}/${examId}.pdf`;

        // Create certificate
        const certificate = await Certificate.create({
          student: studentId,
          exam: examId,
          score: score || examParticipant.score,
          issuedBy: req.user._id,
          certificateUrl
        });

        // Update student's certificates
        await User.findByIdAndUpdate(studentId, {
          $push: { certificates: certificate._id }
        });

        // Update exam participant's certificate
        await Exam.findOneAndUpdate(
          { _id: examId, 'participants.user': studentId },
          { $set: { 'participants.$.certificate': certificate._id } }
        );

        results.success.push({
          studentId,
          certificateId: certificate.certificateId,
          score: certificate.score,
          grade: certificate.grade
        });

      } catch (error) {
        results.failed.push({
          studentId: participant.studentId,
          reason: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Bulk generate certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Download certificate
// @route   GET /api/certificates/download/:certificateId
// @access  Private
router.get('/download/:certificateId', protect, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.certificateId)
      .populate('student', 'name email')
      .populate('exam', 'title subject');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Check permissions (student can download their own, admin can download any)
    if (req.user.role !== 'admin' && certificate.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to download this certificate'
      });
    }

    // For now, return certificate data (in production, generate and return PDF)
    res.status(200).json({
      success: true,
      data: certificate
    });

  } catch (error) {
    console.error('Download certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;