jest.mock('../../models', () => ({
  Exam: {
    findAll: jest.fn(),
    count: jest.fn()
  },
  User: {
    count: jest.fn()
  },
  Certificate: {
    count: jest.fn()
  }
}));

const { Exam, User, Certificate } = require('../../models');
const AnalyticsService = require('../../services/AnalyticsService');

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getOverview returns totals and trends', async () => {
    User.count.mockResolvedValueOnce(10).mockResolvedValueOnce(2);
    Exam.count.mockResolvedValueOnce(5).mockResolvedValueOnce(1);
    Certificate.count.mockResolvedValue(4);

    Exam.findAll.mockResolvedValue([
      {
        subject: 'Math',
        analytics: { totalParticipants: 3, averageScore: 80, passRate: 70 },
        createdAt: new Date('2025-01-10')
      }
    ]);

    const result = await AnalyticsService.getOverview({
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-02-01')
    });

    expect(result.overview.totalUsers).toBe(10);
    expect(result.overview.totalAdmins).toBe(2);
    expect(result.overview.totalExams).toBe(5);
    expect(result.overview.activeExams).toBe(1);
    expect(result.overview.totalCertificates).toBe(4);
    expect(result.subjectPerformance.length).toBe(1);
  });
});
