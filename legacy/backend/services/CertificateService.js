const { Certificate, User, Exam } = require('../models');
const { NotFoundError, ValidationError } = require('../utils/errors');

class CertificateService {
  // Generate certificate after exam pass
  static async generateCertificate(examId, studentId, score, issuedById) {
    try {
      // Check if already has certificate for this exam
      const existing = await Certificate.findOne({
        where: { examId, studentId }
      });

      if (existing) {
        throw new ValidationError('Certificate already issued for this exam');
      }

      const certificate = await Certificate.create({
        examId,
        studentId,
        issuedById,
        score,
        certificateUrl: this.generateCertificateUrl(),
        qrCode: this.generateQRCode()
      });

      return certificate;
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        throw new ValidationError(error.errors[0].message);
      }
      throw error;
    }
  }

  // Get certificate by ID
  static async getCertificateById(certificateId) {
    const certificate = await Certificate.findByPk(certificateId, {
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'issuer', attributes: ['id', 'name'] },
        { model: Exam, as: 'exam', attributes: ['id', 'title', 'subject'] }
      ]
    });

    if (!certificate) {
      throw new NotFoundError('Certificate not found');
    }

    return certificate;
  }

  // Get user's certificates
  static async getUserCertificates(userId, options = {}) {
    const { limit = 10, offset = 0 } = options;

    const { count, rows } = await Certificate.findAndCountAll({
      where: { studentId: userId },
      limit,
      offset,
      include: [
        { model: Exam, as: 'exam', attributes: ['id', 'title', 'subject'] }
      ],
      order: [['issuedDate', 'DESC']]
    });

    return { total: count, data: rows };
  }

  // Verify certificate
  static async verifyCertificate(verificationCode) {
    const certificate = await Certificate.findOne({
      where: { verificationCode, status: 'issued' },
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'issuer', attributes: ['id', 'name'] },
        { model: Exam, as: 'exam', attributes: ['id', 'title', 'subject'] }
      ]
    });

    if (!certificate) {
      throw new NotFoundError('Certificate not found or has been revoked');
    }

    if (!certificate.isValid()) {
      throw new ValidationError('Certificate has expired');
    }

    return certificate;
  }

  // Revoke certificate
  static async revokeCertificate(certificateId) {
    const certificate = await this.getCertificateById(certificateId);
    
    await certificate.update({ status: 'revoked' });
    return certificate;
  }

  // Download certificate
  static async downloadCertificate(certificateId) {
    const certificate = await this.getCertificateById(certificateId);

    // Update download count and last downloaded time
    await certificate.update({
      downloadCount: certificate.downloadCount + 1,
      lastDownloaded: new Date()
    });

    return certificate;
  }

  // Get all certificates (admin)
  static async getAllCertificates(options = {}) {
    const { limit = 10, offset = 0, status, studentId } = options;
    const where = {};

    if (status) where.status = status;
    if (studentId) where.studentId = studentId;

    const { count, rows } = await Certificate.findAndCountAll({
      where,
      limit,
      offset,
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email'] },
        { model: Exam, as: 'exam', attributes: ['id', 'title'] }
      ],
      order: [['issuedDate', 'DESC']]
    });

    return { total: count, data: rows };
  }

  // Generate certificate URL (can be replaced with actual PDF generation)
  static generateCertificateUrl() {
    const certId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    return `/certificates/${certId}.pdf`;
  }

  // Generate QR code (can be replaced with actual QR generation)
  static generateQRCode() {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin)}`;
  }
}

module.exports = CertificateService;
