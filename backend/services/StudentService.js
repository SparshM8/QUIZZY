const { Op } = require('sequelize');
const { User, Exam, Certificate } = require('../models');
const { ValidationError, NotFoundError, ConflictError } = require('../utils/errors');

class StudentService {
  static async getAllStudentsWithStats() {
    const students = await User.findAll({
      where: { role: 'student' },
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
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

    const scoreMap = new Map();
    certificates.forEach((cert) => {
      if (!scoreMap.has(cert.studentId)) scoreMap.set(cert.studentId, []);
      scoreMap.get(cert.studentId).push(cert.score);
    });

    return students.map((student) => {
      const scores = scoreMap.get(student.id) || [];
      const totalExams = enrolledMap.get(student.id) || 0;
      const completedExams = scores.length;
      const averageScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      return {
        ...student.toJSON(),
        examStats: {
          totalExams,
          completedExams,
          averageScore,
          totalCertificates: scores.length
        }
      };
    });
  }

  static async getStudentById(studentId) {
    const student = await User.findByPk(studentId, { attributes: { exclude: ['password'] } });
    if (!student) {
      throw new NotFoundError('Student not found');
    }
    return student;
  }

  static async createStudent({ name, email, password }) {
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      throw new ConflictError('User already exists with this email');
    }

    const student = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'student'
    });

    return student;
  }

  static async updateStudent(studentId, updateData) {
    const student = await this.getStudentById(studentId);

    if (updateData.email && updateData.email !== student.email) {
      const existingUser = await User.findOne({ where: { email: updateData.email.toLowerCase() } });
      if (existingUser) {
        throw new ConflictError('Email already in use');
      }
    }

    await student.update(updateData);
    return student;
  }

  static async deactivateStudent(studentId) {
    const student = await this.getStudentById(studentId);
    await student.update({ isActive: false });
    return student;
  }

  static async getStudentExamHistory(studentId) {
    const exams = await Exam.findAll({
      attributes: ['id', 'title', 'subject', 'duration', 'scheduledDate', 'passingScore', 'analytics']
    });

    const certificates = await Certificate.findAll({
      where: { studentId },
      attributes: ['examId', 'score', 'issuedDate']
    });

    const certMap = new Map();
    certificates.forEach((cert) => {
      certMap.set(cert.examId, cert);
    });

    const examHistory = [];
    exams.forEach((exam) => {
      const enrolled = exam.analytics?.enrolledStudents || [];
      if (enrolled.includes(studentId)) {
        const cert = certMap.get(exam.id);
        examHistory.push({
          examId: exam.id,
          title: exam.title,
          subject: exam.subject,
          duration: exam.duration,
          scheduledDate: exam.scheduledDate,
          status: cert ? 'completed' : 'enrolled',
          score: cert ? cert.score : null,
          percentage: cert ? cert.score : null,
          submittedAt: cert ? cert.issuedDate : null,
          passed: cert ? cert.score >= exam.passingScore : null
        });
      }
    });

    return examHistory;
  }

  static async getStudentAnalytics(studentId) {
    const certificates = await Certificate.findAll({
      where: { studentId },
      attributes: ['score', 'examId', 'issuedDate']
    });

    const exams = await Exam.findAll({
      attributes: ['id', 'subject', 'title', 'passingScore']
    });

    const examMap = new Map();
    exams.forEach((exam) => examMap.set(exam.id, exam));

    const performance = {
      totalExams: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 100,
      passRate: 0,
      subjectWise: {},
      recentPerformance: []
    };

    if (certificates.length === 0) {
      return performance;
    }

    performance.totalExams = certificates.length;
    let totalScore = 0;
    let passedExams = 0;

    certificates.forEach((cert) => {
      const exam = examMap.get(cert.examId);
      totalScore += cert.score;
      performance.highestScore = Math.max(performance.highestScore, cert.score);
      performance.lowestScore = Math.min(performance.lowestScore, cert.score);

      if (exam && cert.score >= exam.passingScore) {
        passedExams += 1;
      }

      const subject = exam ? exam.subject : 'Unknown';
      if (!performance.subjectWise[subject]) {
        performance.subjectWise[subject] = { exams: 0, totalScore: 0, averageScore: 0 };
      }
      performance.subjectWise[subject].exams += 1;
      performance.subjectWise[subject].totalScore += cert.score;

      performance.recentPerformance.push({
        examTitle: exam ? exam.title : 'Unknown',
        subject,
        score: cert.score,
        date: cert.issuedDate,
        passed: exam ? cert.score >= exam.passingScore : null
      });
    });

    performance.averageScore = Math.round(totalScore / certificates.length);
    performance.passRate = Math.round((passedExams / certificates.length) * 100);

    Object.keys(performance.subjectWise).forEach((subject) => {
      const subjectData = performance.subjectWise[subject];
      subjectData.averageScore = Math.round(subjectData.totalScore / subjectData.exams);
    });

    performance.recentPerformance.sort((a, b) => new Date(b.date) - new Date(a.date));
    performance.recentPerformance = performance.recentPerformance.slice(0, 10);

    return performance;
  }
}

module.exports = StudentService;
