const { Op } = require('sequelize');
const { Exam, User, Certificate } = require('../models');

class AnalyticsService {
  static async getOverview({ startDate, endDate }) {
    const [totalUsers, totalAdmins, totalExams, activeExams, totalCertificates] = await Promise.all([
      User.count({ where: { role: 'student' } }),
      User.count({ where: { role: 'admin' } }),
      Exam.count(),
      Exam.count({ where: { status: 'active' } }),
      Certificate.count()
    ]);

    const [recentUsers, recentExams, recentCertificates] = await Promise.all([
      User.count({ where: { role: 'student', createdAt: { [Op.between]: [startDate, endDate] } } }),
      Exam.count({ where: { createdAt: { [Op.between]: [startDate, endDate] } } }),
      Certificate.count({ where: { issuedDate: { [Op.between]: [startDate, endDate] } } })
    ]);

    const exams = await Exam.findAll({
      attributes: ['subject', 'analytics', 'createdAt']
    });

    let totalParticipants = 0;
    let avgScoreSum = 0;
    let avgPassRateSum = 0;
    let statsCount = 0;

    const subjectStats = new Map();
    const monthlyMap = new Map();

    exams.forEach((exam) => {
      const analytics = exam.analytics || {};
      const participants = analytics.totalParticipants || 0;

      totalParticipants += participants;

      if (typeof analytics.averageScore === 'number') {
        avgScoreSum += analytics.averageScore;
        statsCount += 1;
      }

      if (typeof analytics.passRate === 'number') {
        avgPassRateSum += analytics.passRate;
      }

      if (participants > 0) {
        const subject = exam.subject || 'Unknown';
        if (!subjectStats.has(subject)) {
          subjectStats.set(subject, {
            subject,
            totalExams: 0,
            averageScoreSum: 0,
            averagePassRateSum: 0,
            totalParticipants: 0
          });
        }

        const stat = subjectStats.get(subject);
        stat.totalExams += 1;
        stat.averageScoreSum += analytics.averageScore || 0;
        stat.averagePassRateSum += analytics.passRate || 0;
        stat.totalParticipants += participants;
      }

      const createdAt = new Date(exam.createdAt);
      const key = `${createdAt.getUTCFullYear()}-${createdAt.getUTCMonth() + 1}`;
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, { year: createdAt.getUTCFullYear(), month: createdAt.getUTCMonth() + 1, examsCreated: 0, totalParticipants: 0 });
      }
      const monthStat = monthlyMap.get(key);
      monthStat.examsCreated += 1;
      monthStat.totalParticipants += participants;
    });

    const subjectPerformance = Array.from(subjectStats.values())
      .map((stat) => ({
        subject: stat.subject,
        totalExams: stat.totalExams,
        averageScore: stat.totalExams ? Math.round(stat.averageScoreSum / stat.totalExams) : 0,
        averagePassRate: stat.totalExams ? Math.round(stat.averagePassRateSum / stat.totalExams) : 0,
        totalParticipants: stat.totalParticipants
      }))
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 10);

    const monthlyTrends = Array.from(monthlyMap.values()).sort((a, b) => {
      if (a.year === b.year) return a.month - b.month;
      return a.year - b.year;
    });

    return {
      overview: {
        totalUsers,
        totalAdmins,
        totalExams,
        activeExams,
        totalCertificates,
        totalParticipants,
        averageScore: statsCount ? Math.round(avgScoreSum / statsCount) : 0,
        averagePassRate: statsCount ? Math.round(avgPassRateSum / statsCount) : 0
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
  }

  static async getExamAnalytics({ subject, status, limit = 50 }) {
    const where = {};
    if (subject) where.subject = subject;
    if (status) where.status = status;

    const exams = await Exam.findAll({
      where,
      limit,
      order: [['createdAt', 'DESC']]
    });

    return exams.map((exam) => {
      const analytics = exam.analytics || {};
      return {
        id: exam.id,
        title: exam.title,
        subject: exam.subject,
        status: exam.status,
        duration: exam.duration,
        totalQuestions: exam.totalQuestions,
        passingScore: exam.passingScore,
        analytics,
        createdAt: exam.createdAt,
        completionRate: 0,
        averageTimeFormatted: this.formatTime(analytics.averageTime || 0),
        participantsBreakdown: {
          enrolled: 0,
          inProgress: 0,
          completed: 0,
          absent: 0
        }
      };
    });
  }

  static async getUserAnalytics({ limit = 100, sortBy = 'averageScore', sortOrder = 'desc' }) {
    const students = await User.findAll({
      where: { role: 'student' },
      attributes: ['id', 'name', 'email', 'createdAt']
    });

    const studentIds = students.map((student) => student.id);

    const certificates = await Certificate.findAll({
      where: { studentId: { [Op.in]: studentIds } },
      attributes: ['studentId', 'score']
    });

    const exams = await Exam.findAll({
      attributes: ['analytics']
    });

    const enrolledMap = new Map();
    exams.forEach((exam) => {
      const enrolled = exam.analytics?.enrolledStudents || [];
      enrolled.forEach((studentId) => {
        enrolledMap.set(studentId, (enrolledMap.get(studentId) || 0) + 1);
      });
    });

    const certMap = new Map();
    certificates.forEach((cert) => {
      if (!certMap.has(cert.studentId)) certMap.set(cert.studentId, []);
      certMap.get(cert.studentId).push(cert.score);
    });

    const userAnalytics = students.map((student) => {
      const scores = certMap.get(student.id) || [];
      const totalExams = enrolledMap.get(student.id) || 0;
      const completedExams = scores.length;
      const averageScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const highestScore = scores.length ? Math.max(...scores) : 0;
      const lowestScore = scores.length ? Math.min(...scores) : 100;
      const passRate = totalExams ? Math.round((completedExams / totalExams) * 100) : 0;

      return {
        userId: student.id,
        name: student.name,
        email: student.email,
        totalExams,
        completedExams,
        averageScore,
        highestScore,
        lowestScore,
        passRate,
        totalTimeSpent: 0,
        certificatesEarned: scores.length,
        joinedDate: student.createdAt
      };
    });

    userAnalytics.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (sortOrder === 'asc') return aValue > bValue ? 1 : -1;
      return aValue < bValue ? 1 : -1;
    });

    return userAnalytics.slice(0, parseInt(limit));
  }

  static async getCertificateAnalytics() {
    const certificates = await Certificate.findAll({
      attributes: ['status', 'score', 'downloadCount', 'issuedDate', 'grade', 'studentId']
    });

    const statusBreakdown = {};
    const gradeDistribution = {};
    const monthlyIssuanceMap = new Map();
    const studentScoreMap = new Map();

    certificates.forEach((cert) => {
      statusBreakdown[cert.status] = (statusBreakdown[cert.status] || 0) + 1;
      gradeDistribution[cert.grade] = (gradeDistribution[cert.grade] || 0) + 1;

      const issued = new Date(cert.issuedDate);
      const key = `${issued.getUTCFullYear()}-${issued.getUTCMonth() + 1}`;
      if (!monthlyIssuanceMap.has(key)) {
        monthlyIssuanceMap.set(key, { year: issued.getUTCFullYear(), month: issued.getUTCMonth() + 1, issued: 0, avgScore: 0, totalScore: 0 });
      }
      const monthStat = monthlyIssuanceMap.get(key);
      monthStat.issued += 1;
      monthStat.totalScore += cert.score || 0;

      if (!studentScoreMap.has(cert.studentId)) {
        studentScoreMap.set(cert.studentId, []);
      }
      studentScoreMap.get(cert.studentId).push(cert.score || 0);
    });

    const monthlyIssuance = Array.from(monthlyIssuanceMap.values()).map((stat) => ({
      year: stat.year,
      month: stat.month,
      issued: stat.issued,
      avgScore: stat.issued ? Math.round(stat.totalScore / stat.issued) : 0
    }));

    const topStudents = await User.findAll({
      where: { role: 'student' },
      attributes: ['id', 'name', 'email']
    });

    const topStudentList = topStudents
      .map((student) => {
        const scores = studentScoreMap.get(student.id) || [];
        return {
          name: student.name,
          email: student.email,
          certificateCount: scores.length,
          avgCertificateScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
        };
      })
      .filter((s) => s.certificateCount > 0)
      .sort((a, b) => {
        if (b.certificateCount !== a.certificateCount) return b.certificateCount - a.certificateCount;
        return b.avgCertificateScore - a.avgCertificateScore;
      })
      .slice(0, 20);

    return {
      statusBreakdown,
      monthlyIssuance,
      gradeDistribution,
      topStudents: topStudentList
    };
  }

  static async getSecurityAnalytics() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const users = await User.findAll({
      where: { updatedAt: { [Op.gte]: thirtyDaysAgo } },
      attributes: ['loginAttempts', 'lockUntil']
    });

    let totalFailedAttempts = 0;
    let accountsLocked = 0;

    users.forEach((user) => {
      totalFailedAttempts += user.loginAttempts || 0;
      if (user.lockUntil) accountsLocked += 1;
    });

    return {
      tabSwitchIncidents: { totalTabSwitches: 0, examsWithViolations: 0 },
      failedLogins: { totalFailedAttempts, accountsLocked },
      securityTimeline: [],
      period: 'Last 30 days'
    };
  }

  static formatTime(seconds) {
    if (!seconds) return '0m 0s';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  }
}

module.exports = AnalyticsService;
