const sequelize = require('../config/database');
const UserModel = require('./sequelize/User');
const ExamModel = require('./sequelize/Exam');
const CertificateModel = require('./sequelize/Certificate');
const NotificationModel = require('./sequelize/Notification');

const User = UserModel(sequelize);
const Exam = ExamModel(sequelize);
const Certificate = CertificateModel(sequelize);
const Notification = NotificationModel(sequelize);

// Define associations
User.hasMany(Exam, { foreignKey: 'createdById', as: 'createdExams' });
Exam.belongsTo(User, { foreignKey: 'createdById', as: 'creator' });

User.hasMany(Certificate, { foreignKey: 'studentId', as: 'certificates' });
Certificate.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

User.hasMany(Certificate, { foreignKey: 'issuedById', as: 'issuedCertificates' });
Certificate.belongsTo(User, { foreignKey: 'issuedById', as: 'issuer' });

Exam.hasMany(Certificate, { foreignKey: 'examId', as: 'certificates' });
Certificate.belongsTo(Exam, { foreignKey: 'examId', as: 'exam' });

User.hasMany(Notification, { foreignKey: 'recipientId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });

User.hasMany(Notification, { foreignKey: 'senderId', as: 'sentNotifications' });
Notification.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

Exam.hasMany(Notification, { foreignKey: 'relatedExamId', as: 'notifications' });
Notification.belongsTo(Exam, { foreignKey: 'relatedExamId', as: 'relatedExam' });

Certificate.hasMany(Notification, { foreignKey: 'relatedCertificateId', as: 'notifications' });
Notification.belongsTo(Certificate, { foreignKey: 'relatedCertificateId', as: 'relatedCertificate' });

module.exports = {
  sequelize,
  User,
  Exam,
  Certificate,
  Notification
};
