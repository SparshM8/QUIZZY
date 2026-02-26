const { ValidationError, NotFoundError } = require('../../utils/errors');

// Mock window object for QR code generation
global.window = { location: { origin: 'http://localhost:5000' } };

jest.mock('../../models', () => ({
  Certificate: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    findAndCountAll: jest.fn()
  },
  User: {},
  Exam: {}
}));

const { Certificate } = require('../../models');
const CertificateService = require('../../services/CertificateService');

describe('CertificateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('verifyCertificate throws when certificate is expired', async () => {
    Certificate.findOne.mockResolvedValue({
      isValid: () => false
    });

    await expect(
      CertificateService.verifyCertificate('CODE12345678')
    ).rejects.toBeInstanceOf(ValidationError);
  });

  test('generateCertificate creates new certificate', async () => {
    const mockCert = { id: 1, certificateId: 'CERT001', studentId: 5, examId: 10 };
    Certificate.findOne.mockResolvedValue(null);
    Certificate.create.mockResolvedValue(mockCert);

    const result = await CertificateService.generateCertificate({ studentId: 5, examId: 10 });

    expect(result).toEqual(mockCert);
    expect(Certificate.create).toHaveBeenCalled();
  });

  test('getCertificateById returns certificate with includes', async () => {
    const mockCert = { 
      id: 1, 
      certificateId: 'CERT001', 
      toJSON: () => ({ id: 1, certificateId: 'CERT001' }) 
    };
    Certificate.findByPk.mockResolvedValue(mockCert);

    const result = await CertificateService.getCertificateById(1);

    expect(result).toEqual(mockCert);
  });

  test('getAllCertificates returns paginated results', async () => {
    Certificate.findAndCountAll.mockResolvedValue({
      count: 5,
      rows: [{ id: 1 }, { id: 2 }]
    });

    const result = await CertificateService.getAllCertificates({ limit: 10, offset: 0 });

    expect(result.total).toBe(5);
    expect(result.data).toHaveLength(2);
  });

  test('revokeCertificate updates status', async () => {
    const mockCert = { id: 1, status: 'active', update: jest.fn() };
    Certificate.findByPk.mockResolvedValue(mockCert);

    await CertificateService.revokeCertificate(1);

    expect(mockCert.update).toHaveBeenCalled();
  });
});
