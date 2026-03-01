const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Certificate = sequelize.define('Certificate', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    certificateId: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false
    },
    studentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    examId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0, max: 100 }
    },
    grade: {
      type: DataTypes.ENUM('A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('issued', 'revoked', 'expired'),
      defaultValue: 'issued'
    },
    issuedDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    expiryDate: {
      type: DataTypes.DATE,
      defaultValue: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    },
    issuedById: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    certificateUrl: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    qrCode: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    verificationCode: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {
        template: 'default',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        fontFamily: 'Arial'
      }
    },
    downloadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastDownloaded: {
      type: DataTypes.DATE,
      allowNull: true
    },
    emailSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    emailSentAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    timestamps: true,
    tableName: 'certificates',
    indexes: [
      { fields: ['student_id', 'exam_id'] },
      { fields: ['certificate_id'] },
      { fields: ['verification_code'] },
      { fields: ['status', 'expiry_date'] }
    ]
  });

  Certificate.beforeCreate(async (cert) => {
    if (!cert.certificateId) {
      cert.certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    }
    if (!cert.verificationCode) {
      cert.verificationCode = Math.random().toString(36).substr(2, 12).toUpperCase();
    }
    if (!cert.grade) {
      const score = cert.score;
      if (score >= 95) cert.grade = 'A+';
      else if (score >= 90) cert.grade = 'A';
      else if (score >= 85) cert.grade = 'B+';
      else if (score >= 80) cert.grade = 'B';
      else if (score >= 75) cert.grade = 'C+';
      else if (score >= 70) cert.grade = 'C';
      else if (score >= 60) cert.grade = 'D';
      else cert.grade = 'F';
    }
  });

  Certificate.prototype.isValid = function() {
    return this.status === 'issued' && this.expiryDate > new Date();
  };

  Certificate.prototype.daysUntilExpiry = function() {
    const now = new Date();
    const expiry = new Date(this.expiryDate);
    return Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)));
  };

  Certificate.verifyCertificate = function(verificationCode) {
    return this.findOne({
      where: {
        verificationCode,
        status: 'issued'
      }
    });
  };

  return Certificate;
};
