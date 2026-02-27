const { Exam, User, Certificate } = require('../models');
const { NotFoundError, ValidationError } = require('../utils/errors');
const crypto = require('crypto');

class ExamService {
  static async generateUniqueJoinCode() {
    for (let i = 0; i < 10; i += 1) {
      const joinCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      const existing = await Exam.findOne({ where: { joinCode } });
      if (!existing) {
        return joinCode;
      }
    }

    throw new ValidationError('Unable to generate unique join code. Please try again.');
  }

  // Create exam
  static async createExam(examData, createdById) {
    try {
      const joinCode = await this.generateUniqueJoinCode();

      const exam = await Exam.create({
        ...examData,
        createdById,
        questions: examData.questions || [],
        joinCode
      });

      return exam;
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        throw new ValidationError(error.errors[0].message);
      }
      throw error;
    }
  }

  // Regenerate join code
  static async regenerateJoinCode(examId) {
    const exam = await this.getExamById(examId);
    const joinCode = await this.generateUniqueJoinCode();
    await exam.update({ joinCode });
    return exam;
  }

  // Get exam by join code
  static async getExamByJoinCode(joinCode) {
    const exam = await Exam.findOne({
      where: { joinCode },
      include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }]
    });

    if (!exam) {
      throw new NotFoundError('Invalid exam join link');
    }

    return exam;
  }

  // Get exam by ID
  static async getExamById(examId, includeCreator = false) {
    const exam = await Exam.findByPk(examId, {
      include: includeCreator ? [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }] : []
    });

    if (!exam) {
      throw new NotFoundError('Exam not found');
    }

    return exam;
  }

  // Get all exams
  static async getAllExams(options = {}) {
    const { limit = 10, offset = 0, status, createdById, subject } = options;
    const where = {};

    if (status) where.status = status;
    if (createdById) where.createdById = createdById;
    if (subject) where.subject = subject;

    const { count, rows } = await Exam.findAndCountAll({
      where,
      limit,
      offset,
      include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']]
    });

    return { total: count, data: rows };
  }

  // Update exam
  static async updateExam(examId, updateData) {
    try {
      const exam = await this.getExamById(examId);
      await exam.update(updateData);
      return exam;
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        throw new ValidationError(error.errors[0].message);
      }
      throw error;
    }
  }

  // Delete exam
  static async deleteExam(examId) {
    const exam = await this.getExamById(examId);
    await exam.destroy();
    return { message: 'Exam deleted successfully' };
  }

  // Publish exam (activate)
  static async publishExam(examId) {
    const exam = await this.getExamById(examId);
    
    if (exam.questions.length === 0) {
      throw new ValidationError('Cannot publish exam without questions');
    }

    await exam.update({
      status: 'active',
      startTime: new Date(),
      endTime: new Date(Date.now() + exam.duration * 60 * 1000)
    });

    return exam;
  }

  // Enroll student in exam
  static async enrollStudent(examId, userId) {
    const exam = await this.getExamById(examId);

    // Check if already enrolled
    const isEnrolled = exam.analytics?.enrolledStudents?.includes(userId);
    if (isEnrolled) {
      throw new ValidationError('Student already enrolled in this exam');
    }

    if (!exam.analytics) {
      exam.analytics = { enrolledStudents: [] };
    } else if (!exam.analytics.enrolledStudents) {
      exam.analytics.enrolledStudents = [];
    }

    exam.analytics.enrolledStudents.push(userId);
    await exam.save();

    return exam;
  }

  // Submit exam answers
  static async submitExam(examId, userId, answersData) {
    const exam = await this.getExamById(examId);

    if (exam.status !== 'active') {
      throw new ValidationError('Exam is not currently active');
    }

    // Calculate score
    let score = 0;
    answersData.forEach((answer, index) => {
      if (index < exam.questions.length) {
        if (answer.selectedAnswer === exam.questions[index].correctAnswer) {
          score += exam.questions[index].points || 1;
        }
      }
    });

    // Calculate percentage
    const totalPoints = exam.questions.reduce((sum, q) => sum + (q.points || 1), 0);
    const percentage = (score / totalPoints) * 100;

    // Update exam analytics
    if (!exam.analytics) exam.analytics = {};
    if (!exam.analytics.totalParticipants) exam.analytics.totalParticipants = 0;
    if (!exam.analytics.averageScore) exam.analytics.averageScore = 0;

    exam.analytics.totalParticipants += 1;
    exam.analytics.averageScore = (exam.analytics.averageScore * (exam.analytics.totalParticipants - 1) + percentage) / exam.analytics.totalParticipants;

    await exam.save();

    return {
      examId,
      userId,
      score,
      percentage,
      passed: percentage >= exam.passingScore,
      totalQuestions: exam.questions.length
    };
  }

  // Check if exam is active
  static isExamActive(exam) {
    return exam.status === 'active' &&
           new Date() >= exam.startTime &&
           new Date() <= exam.endTime;
  }

  // Get time remaining for exam
  static getTimeRemaining(exam) {
    if (!this.isExamActive(exam)) return 0;
    const remaining = exam.endTime - new Date();
    return Math.max(0, Math.floor(remaining / 1000 / 60)); // in minutes
  }
}

module.exports = ExamService;
