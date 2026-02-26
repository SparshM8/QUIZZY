const express = require('express');
const { query, validationResult } = require('express-validator');
const AnalyticsService = require('../services/AnalyticsService');
const { protect, authorize } = require('../middleware/auth');
const { ValidationError } = require('../utils/errors');
const logger = require('../config/logger');

const router = express.Router();

// @desc    Get overall system analytics
// @route   GET /api/analytics/overview
// @access  Private (Admin only)
router.get('/overview', [
  protect,
  authorize('admin'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const startDate = req.query.startDate
      ? new Date(req.query.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    const analytics = await AnalyticsService.getOverview({ startDate, endDate });

    logger.info(`Analytics overview retrieved by ${req.user.email}`);

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error(`Get analytics overview error: ${error.message}`);
    next(error);
  }
});

// @desc    Get exam performance analytics
// @route   GET /api/analytics/exams
// @access  Private (Admin only)
router.get('/exams', [
  protect,
  authorize('admin'),
  query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('Invalid limit')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const { subject, status } = req.query;
    const limit = parseInt(req.query.limit || '50');

    const examAnalytics = await AnalyticsService.getExamAnalytics({ subject, status, limit });

    res.status(200).json({
      success: true,
      count: examAnalytics.length,
      data: examAnalytics
    });
  } catch (error) {
    logger.error(`Get exam analytics error: ${error.message}`);
    next(error);
  }
});

// @desc    Get user performance analytics
// @route   GET /api/analytics/users
// @access  Private (Admin only)
router.get('/users', [
  protect,
  authorize('admin'),
  query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('Invalid limit')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const { sortBy, sortOrder } = req.query;
    const limit = parseInt(req.query.limit || '100');

    const userAnalytics = await AnalyticsService.getUserAnalytics({
      limit,
      sortBy: sortBy || 'averageScore',
      sortOrder: sortOrder || 'desc'
    });

    res.status(200).json({
      success: true,
      count: userAnalytics.length,
      data: userAnalytics,
      sortBy: sortBy || 'averageScore',
      sortOrder: sortOrder || 'desc'
    });
  } catch (error) {
    logger.error(`Get user analytics error: ${error.message}`);
    next(error);
  }
});

// @desc    Get certificate analytics
// @route   GET /api/analytics/certificates
// @access  Private (Admin only)
router.get('/certificates', protect, authorize('admin'), async (req, res, next) => {
  try {
    const certificateAnalytics = await AnalyticsService.getCertificateAnalytics();

    res.status(200).json({
      success: true,
      data: certificateAnalytics
    });
  } catch (error) {
    logger.error(`Get certificate analytics error: ${error.message}`);
    next(error);
  }
});

// @desc    Get security analytics
// @route   GET /api/analytics/security
// @access  Private (Admin only)
router.get('/security', protect, authorize('admin'), async (req, res, next) => {
  try {
    const securityAnalytics = await AnalyticsService.getSecurityAnalytics();

    res.status(200).json({
      success: true,
      data: securityAnalytics
    });
  } catch (error) {
    logger.error(`Get security analytics error: ${error.message}`);
    next(error);
  }
});

module.exports = router;
