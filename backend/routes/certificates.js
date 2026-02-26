const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const CertificateService = require('../services/CertificateService');
const AnalyticsService = require('../services/AnalyticsService');
const { protect, authorize } = require('../middleware/auth');
const { ValidationError, NotFoundError, ForbiddenError, ConflictError } = require('../utils/errors');
const logger = require('../config/logger');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// @desc    Get all certificates
// @route   GET /api/certificates
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const options = {
      limit: parseInt(req.query.limit) || 10,
      offset: parseInt(req.query.offset) || 0,
      order: [['createdAt', 'DESC']]
    };

    let filter = {};

    // Filter by student if provided (admin only)
    if (req.query.student && req.user.role === 'admin') {
      filter.studentId = req.query.student;
    } else if (req.user.role === 'student') {
      // Students can only see their own certificates
      filter.studentId = req.user.id;
    }

    // Filter by status
    if (req.query.status) {
      filter.status = req.query.status;
    }

    let result;
    if (req.user.role === 'admin') {
      result = await CertificateService.getAllCertificates({
        limit: options.limit,
        offset: options.offset,
        status: filter.status,
        studentId: filter.studentId
      });
    } else {
      result = await CertificateService.getUserCertificates(req.user.id, options);
    }

    logger.info(`Certificates retrieved for user: ${req.user.email}`);

    res.status(200).json({
      success: true,
      count: result.total,
      data: result.data
    });
  } catch (error) {
    logger.error(`Get certificates error: ${error.message}`);
    next(error);
  }
});

// @desc    Get single certificate
// @route   GET /api/certificates/:id
// @access  Private
router.get('/:id', [
  protect,
  param('id').isInt().withMessage('Invalid certificate ID')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const certificate = await CertificateService.getCertificateById(req.params.id);

    if (!certificate) {
      throw new NotFoundError('Certificate not found');
    }

    // Check if user can access this certificate
    if (req.user.role === 'student' && certificate.studentId !== req.user.id) {
      throw new ForbiddenError('Not authorized to access this certificate');
    }

    logger.info(`Certificate retrieved: ${certificate.id}`);

    res.status(200).json({
      success: true,
      data: certificate
    });
  } catch (error) {
    logger.error(`Get certificate error: ${error.message}`);
    next(error);
  }
});

// @desc    Generate certificate
// @route   POST /api/certificates/generate
// @access  Private (Admin only)
router.post('/generate', [
  protect,
  authorize('admin'),
  body('studentId')
    .isInt()
    .withMessage('Valid student ID is required'),
  body('examId')
    .isInt()
    .withMessage('Valid exam ID is required'),
  body('score')
    .isInt({ min: 0, max: 100 })
    .withMessage('Score must be between 0 and 100')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const { studentId, examId, score } = req.body;

    // Generate certificate using service
    const certificate = await CertificateService.generateCertificate(
      examId,
      studentId,
      score,
      req.user.id
    );

    logger.info(`Certificate generated: ${certificate.certificateId} for student: ${studentId}`);

    res.status(201).json({
      success: true,
      data: certificate
    });
  } catch (error) {
    logger.error(`Generate certificate error: ${error.message}`);
    next(error);
  }
});

// @desc    Verify certificate
// @route   GET /api/certificates/verify/:code
// @access  Public
router.get('/verify/:code', [
  param('code')
    .isLength({ min: 12, max: 12 })
    .withMessage('Invalid verification code')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const certificate = await CertificateService.verifyCertificate(req.params.code);

    if (!certificate) {
      throw new NotFoundError('Certificate not found or invalid');
    }

    logger.info(`Certificate verified: ${certificate.certificateId}`);

    res.status(200).json({
      success: true,
      data: {
        certificateId: certificate.certificateId,
        studentName: certificate.student?.name || 'Unknown',
        examTitle: certificate.exam?.title || 'Unknown',
        score: certificate.score,
        grade: certificate.grade,
        issuedDate: certificate.issuedDate,
        expiryDate: certificate.expiryDate,
        isValid: certificate.isValid(),
        issuedBy: certificate.issuer?.name || 'Unknown'
      }
    });
  } catch (error) {
    logger.error(`Verify certificate error: ${error.message}`);
    next(error);
  }
});

// @desc    Download certificate
// @route   GET /api/certificates/:id/download
// @access  Private
router.get('/:id/download', [
  protect,
  param('id').isInt().withMessage('Invalid certificate ID')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const certificate = await CertificateService.getCertificateById(req.params.id);

    if (!certificate) {
      throw new NotFoundError('Certificate not found');
    }

    // Check if user can download this certificate
    if (req.user.role === 'student' && certificate.studentId !== req.user.id) {
      throw new ForbiddenError('Not authorized to download this certificate');
    }

    // Record download using service
    await CertificateService.downloadCertificate(req.params.id);

    logger.info(`Certificate downloaded: ${certificate.certificateId} by user: ${req.user.email}`);

    // In production, generate and return actual PDF
    // For now, return certificate data
    res.status(200).json({
      success: true,
      message: 'Certificate download initiated',
      data: certificate
    });
  } catch (error) {
    logger.error(`Download certificate error: ${error.message}`);
    next(error);
  }
});

// @desc    Revoke certificate
// @route   PUT /api/certificates/:id/revoke
// @access  Private (Admin only)
router.put('/:id/revoke', [
  protect,
  authorize('admin'),
  param('id').isInt().withMessage('Invalid certificate ID'),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Revocation reason is required')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    await CertificateService.revokeCertificate(req.params.id);

    logger.info(`Certificate revoked: ${req.params.id} by ${req.user.email}, Reason: ${req.body.reason}`);

    res.status(200).json({
      success: true,
      message: 'Certificate revoked successfully'
    });
  } catch (error) {
    logger.error(`Revoke certificate error: ${error.message}`);
    next(error);
  }
});

// @desc    Get certificate statistics
// @route   GET /api/certificates/stats/summary
// @access  Private (Admin only)
router.get('/stats/summary', protect, authorize('admin'), async (req, res, next) => {
  try {
    const analytics = await AnalyticsService.getCertificateAnalytics();
    const statusBreakdown = analytics.statusBreakdown || {};
    const totalCertificates = Object.values(statusBreakdown).reduce((sum, count) => sum + count, 0);
    const validCertificates = statusBreakdown.issued || 0;

    logger.info(`Certificate statistics retrieved by ${req.user.email}`);

    res.status(200).json({
      success: true,
      data: {
        totalCertificates,
        validCertificates,
        stats: statusBreakdown
      }
    });
  } catch (error) {
    logger.error(`Get certificate stats error: ${error.message}`);
    next(error);
  }
});

// @desc    Generate bulk certificates
// @route   POST /api/certificates/generate-bulk
// @access  Private (Admin only)
router.post('/generate-bulk', [
  protect,
  authorize('admin'),
  body('examId')
    .isInt()
    .withMessage('Valid exam ID is required'),
  body('participants')
    .isArray()
    .withMessage('Participants array is required'),
  body('participants.*.studentId')
    .isInt()
    .withMessage('Valid student ID is required'),
  body('participants.*.score')
    .isInt({ min: 0, max: 100 })
    .withMessage('Score must be between 0 and 100')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const { examId, participants } = req.body;

    const results = {
      success: [],
      failed: [],
      total: participants.length
    };

    // Process each participant
    for (const participant of participants) {
      try {
        const { studentId, score } = participant;

        // Generate certificate using service
        const certificate = await CertificateService.generateCertificate(
          examId,
          studentId,
          score,
          req.user.id
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

    logger.info(`Bulk certificates generated: ${results.success.length} successful, ${results.failed.length} failed`);

    res.status(200).json({
      success: true,
      data: results
    });

  } catch (error) {
    logger.error(`Bulk generate certificates error: ${error.message}`);
    next(error);
  }
});

// @desc    Download certificate (alternative route)
// @route   GET /api/certificates/download/:certificateId
// @access  Private
router.get('/download/:certificateId', protect, async (req, res, next) => {
  try {
    const certificate = await CertificateService.getCertificateById(parseInt(req.params.certificateId));

    if (!certificate) {
      throw new NotFoundError('Certificate not found');
    }

    // Check permissions (student can download their own, admin can download any)
    if (req.user.role !== 'admin' && certificate.studentId !== req.user.id) {
      throw new ForbiddenError('Not authorized to download this certificate');
    }

    // Record download
    await CertificateService.downloadCertificate(certificate.id);

    logger.info(`Certificate downloaded: ${certificate.certificateId} by user: ${req.user.email}`);

    // For now, return certificate data (in production, generate and return PDF)
    res.status(200).json({
      success: true,
      data: certificate
    });

  } catch (error) {
    logger.error(`Download certificate error: ${error.message}`);
    next(error);
  }
});

module.exports = router;