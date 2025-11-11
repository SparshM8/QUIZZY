const express = require('express');
const { query, validationResult } = require('express-validator');
const Exam = require('../models/Exam');
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get overall system analytics
// @route   GET /api/analytics/overview
// @access  Private (Admin only)
router.get('/overview', protect, authorize('admin'), async (req, res) => {
  try {
    // Get date range from query params
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    // Basic counts
    const totalUsers = await User.countDocuments({ role: 'student' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalExams = await Exam.countDocuments();
    const activeExams = await Exam.countDocuments({ status: 'active' });
    const totalCertificates = await Certificate.countDocuments();

    // Exam statistics
    const examStats = await Exam.aggregate([
      {
        $group: {
          _id: null,
          totalParticipants: { $sum: { $size: '$participants' } },
          completedExams: { $sum: { $size: { $filter: { input: '$participants', cond: { $eq: ['$$this.status', 'completed'] } } } } },
          averageScore: { $avg: '$analytics.averageScore' },
          averagePassRate: { $avg: '$analytics.passRate' }
        }
      }
    ]);

    // User activity (last 30 days)
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      role: 'student'
    });

    const recentExams = await Exam.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const recentCertificates = await Certificate.countDocuments({
      issuedDate: { $gte: startDate, $lte: endDate }
    });

    // Top performing subjects
    const subjectPerformance = await Exam.aggregate([
      {
        $match: {
          'analytics.totalParticipants': { $gt: 0 }
        }
      },
      {
        $group: {
          _id: '$subject',
          totalExams: { $sum: 1 },
          averageScore: { $avg: '$analytics.averageScore' },
          averagePassRate: { $avg: '$analytics.passRate' },
          totalParticipants: { $sum: '$analytics.totalParticipants' }
        }
      },
      {
        $sort: { averageScore: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Monthly trends (last 12 months)
    const monthlyTrends = await Exam.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          examsCreated: { $sum: 1 },
          totalParticipants: { $sum: { $size: '$participants' } }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const analytics = {
      overview: {
        totalUsers,
        totalAdmins,
        totalExams,
        activeExams,
        totalCertificates,
        ...examStats[0]
      },
      recentActivity: {
        users: recentUsers,
        exams: recentExams,
        certificates: recentCertificates,
        period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
      },
      subjectPerformance,
      monthlyTrends,
      dateRange: {
        start: startDate,
        end: endDate
      }
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get analytics overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get exam performance analytics
// @route   GET /api/analytics/exams
// @access  Private (Admin only)
router.get('/exams', protect, authorize('admin'), async (req, res) => {
  try {
    const { subject, status, limit = 50 } = req.query;

    let matchQuery = {};
    if (subject) matchQuery.subject = subject;
    if (status) matchQuery.status = status;

    const examAnalytics = await Exam.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'creator'
        }
      },
      {
        $project: {
          title: 1,
          subject: 1,
          status: 1,
          duration: 1,
          totalQuestions: 1,
          passingScore: 1,
          analytics: 1,
          participants: 1,
          createdAt: 1,
          creator: { $arrayElemAt: ['$creator.name', 0] }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    // Calculate additional metrics
    const enhancedAnalytics = examAnalytics.map(exam => ({
      ...exam,
      completionRate: exam.analytics.totalParticipants > 0
        ? Math.round((exam.analytics.completedParticipants / exam.analytics.totalParticipants) * 100)
        : 0,
      averageTimeFormatted: formatTime(exam.analytics.averageTime || 0),
      participantsBreakdown: {
        enrolled: exam.participants.filter(p => p.status === 'enrolled').length,
        inProgress: exam.participants.filter(p => p.status === 'in-progress').length,
        completed: exam.participants.filter(p => p.status === 'completed').length,
        absent: exam.participants.filter(p => p.status === 'absent').length
      }
    }));

    res.status(200).json({
      success: true,
      count: enhancedAnalytics.length,
      data: enhancedAnalytics
    });
  } catch (error) {
    console.error('Get exam analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get user performance analytics
// @route   GET /api/analytics/users
// @access  Private (Admin only)
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { limit = 100, sortBy = 'averageScore', sortOrder = 'desc' } = req.query;

    // Get all students with their exam performance
    const students = await User.find({ role: 'student' })
      .select('name email createdAt')
      .lean();

    const userAnalytics = await Promise.all(
      students.map(async (student) => {
        const exams = await Exam.find({
          'participants.user': student._id,
          'participants.status': 'completed'
        }).select('title subject passingScore participants analytics');

        const performance = {
          userId: student._id,
          name: student.name,
          email: student.email,
          totalExams: exams.length,
          completedExams: exams.length,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 100,
          passRate: 0,
          totalTimeSpent: 0,
          certificatesEarned: 0,
          joinedDate: student.createdAt
        };

        if (exams.length > 0) {
          let totalScore = 0;
          let passedExams = 0;
          let totalTime = 0;

          exams.forEach(exam => {
            const participant = exam.participants.find(
              p => p.user.toString() === student._id.toString()
            );

            if (participant) {
              totalScore += participant.score || 0;
              performance.highestScore = Math.max(performance.highestScore, participant.score || 0);
              performance.lowestScore = Math.min(performance.lowestScore, participant.score || 0);

              if (participant.score >= exam.passingScore) {
                passedExams++;
              }

              // Calculate time spent (simplified)
              totalTime += participant.answers?.reduce((sum, ans) => sum + (ans.timeSpent || 0), 0) || 0;

              if (participant.certificate) {
                performance.certificatesEarned++;
              }
            }
          });

          performance.averageScore = Math.round(totalScore / exams.length);
          performance.passRate = Math.round((passedExams / exams.length) * 100);
          performance.totalTimeSpent = totalTime;
        }

        return performance;
      })
    );

    // Sort results
    userAnalytics.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'name' || sortBy === 'email') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Limit results
    const limitedResults = userAnalytics.slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      count: limitedResults.length,
      data: limitedResults,
      sortBy,
      sortOrder
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get certificate analytics
// @route   GET /api/analytics/certificates
// @access  Private (Admin only)
router.get('/certificates', protect, authorize('admin'), async (req, res) => {
  try {
    const certificateStats = await Certificate.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgScore: { $avg: '$score' },
          totalDownloads: { $sum: '$downloadCount' }
        }
      }
    ]);

    // Monthly certificate issuance
    const monthlyCertificates = await Certificate.aggregate([
      {
        $match: {
          issuedDate: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$issuedDate' },
            month: { $month: '$issuedDate' }
          },
          issued: { $sum: 1 },
          avgScore: { $avg: '$score' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Grade distribution
    const gradeDistribution = await Certificate.aggregate([
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Top performing students (by certificates earned)
    const topStudents = await User.aggregate([
      {
        $match: { role: 'student' }
      },
      {
        $lookup: {
          from: 'certificates',
          localField: '_id',
          foreignField: 'student',
          as: 'certificates'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          certificateCount: { $size: '$certificates' },
          avgCertificateScore: { $avg: '$certificates.score' }
        }
      },
      {
        $match: { certificateCount: { $gt: 0 } }
      },
      {
        $sort: { certificateCount: -1, avgCertificateScore: -1 }
      },
      {
        $limit: 20
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        statusBreakdown: certificateStats,
        monthlyIssuance: monthlyCertificates,
        gradeDistribution,
        topStudents
      }
    });
  } catch (error) {
    console.error('Get certificate analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get security analytics
// @route   GET /api/analytics/security
// @access  Private (Admin only)
router.get('/security', protect, authorize('admin'), async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Tab switching incidents
    const tabSwitchIncidents = await Exam.aggregate([
      { $unwind: '$participants' },
      { $match: { 'participants.status': 'completed' } },
      {
        $group: {
          _id: null,
          totalTabSwitches: { $sum: '$participants.tabSwitches' },
          examsWithViolations: {
            $sum: {
              $cond: [
                { $gt: ['$participants.tabSwitches', 0] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Failed login attempts
    const failedLogins = await User.aggregate([
      {
        $match: {
          loginAttempts: { $gt: 0 },
          updatedAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          totalFailedAttempts: { $sum: '$loginAttempts' },
          accountsLocked: {
            $sum: {
              $cond: [
                { $ne: ['$lockUntil', null] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Security events over time
    const securityTimeline = await Exam.aggregate([
      { $unwind: '$participants' },
      { $unwind: '$participants.violations' },
      {
        $match: {
          'participants.violations.timestamp': { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$participants.violations.timestamp'
              }
            },
            type: '$participants.violations.type'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        tabSwitchIncidents: tabSwitchIncidents[0] || { totalTabSwitches: 0, examsWithViolations: 0 },
        failedLogins: failedLogins[0] || { totalFailedAttempts: 0, accountsLocked: 0 },
        securityTimeline,
        period: 'Last 30 days'
      }
    });
  } catch (error) {
    console.error('Get security analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Helper function to format time
function formatTime(seconds) {
  if (!seconds) return '0m 0s';

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}m ${remainingSeconds}s`;
}

module.exports = router;