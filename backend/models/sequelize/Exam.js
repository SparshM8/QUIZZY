const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Exam = sequelize.define('Exam', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    subject: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: { notEmpty: true }
    },
    duration: {
      type: DataTypes.INTEGER, // in minutes
      allowNull: false,
      validate: { min: 1, max: 480 }
    },
    totalQuestions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 }
    },
    passingScore: {
      type: DataTypes.INTEGER, // percentage
      allowNull: false,
      validate: { min: 0, max: 100 }
    },
    questions: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    status: {
      type: DataTypes.ENUM('draft', 'scheduled', 'active', 'completed', 'cancelled'),
      defaultValue: 'draft'
    },
    scheduledDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    instructions: {
      type: DataTypes.TEXT,
      defaultValue: 'Please read all questions carefully before answering. Once submitted, answers cannot be changed.'
    },
    settings: {
      type: DataTypes.JSON,
      defaultValue: {
        shuffleQuestions: false,
        shuffleOptions: false,
        showResults: true,
        allowReview: true,
        maxTabSwitches: 3,
        lockdownMode: true,
        webcamRequired: false,
        screenshotPrevention: true
      }
    },
    createdById: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    analytics: {
      type: DataTypes.JSON,
      defaultValue: {
        totalParticipants: 0,
        averageScore: 0,
        passRate: 0,
        averageTime: 0,
        questionStats: []
      }
    }
  }, {
    timestamps: true,
    tableName: 'exams',
    indexes: [
      { fields: ['status', 'scheduledDate'] },
      { fields: ['createdById'] },
      { fields: ['status'] }
    ]
  });

  Exam.prototype.isActive = function() {
    return this.status === 'active' &&
           this.startTime <= new Date() &&
           this.endTime > new Date();
  };

  Exam.prototype.timeRemaining = function() {
    if (this.status !== 'active') return 0;
    const now = new Date();
    const end = new Date(this.endTime);
    return Math.max(0, Math.floor((end - now) / 1000 / 60)); // in minutes
  };

  return Exam;
};
