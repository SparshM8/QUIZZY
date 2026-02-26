jest.mock('../../models', () => ({
  Exam: {
    findByPk: jest.fn()
  },
  User: {},
  Certificate: {}
}));

const { Exam } = require('../../models');
const ExamService = require('../../services/ExamService');

describe('ExamService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('submitExam calculates score and updates analytics', async () => {
    const exam = {
      id: 1,
      status: 'active',
      passingScore: 60,
      questions: [
        { correctAnswer: 1, points: 2 },
        { correctAnswer: 0, points: 1 }
      ],
      analytics: { totalParticipants: 0, averageScore: 0 },
      save: jest.fn()
    };

    Exam.findByPk.mockResolvedValue(exam);

    const result = await ExamService.submitExam(1, 2, [
      { selectedAnswer: 1 },
      { selectedAnswer: 0 }
    ]);

    expect(result).toMatchObject({
      examId: 1,
      userId: 2,
      score: 3,
      percentage: 100,
      passed: true,
      totalQuestions: 2
    });

    expect(exam.save).toHaveBeenCalled();
  });
});
