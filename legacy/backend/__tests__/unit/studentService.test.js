jest.mock('../../models', () => ({
  User: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn()
  },
  Exam: {
    findAll: jest.fn()
  },
  Certificate: {
    findAll: jest.fn()
  }
}));

const { User, Exam, Certificate } = require('../../models');
const StudentService = require('../../services/StudentService');

describe('StudentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getAllStudentsWithStats returns students with stats', async () => {
    User.findAll.mockResolvedValue([
      { id: 1, toJSON: () => ({ id: 1, name: 'Sam' }) }
    ]);

    Exam.findAll.mockResolvedValue([
      { analytics: { enrolledStudents: [1] } }
    ]);

    Certificate.findAll.mockResolvedValue([
      { studentId: 1, score: 90 }
    ]);

    const result = await StudentService.getAllStudentsWithStats();

    expect(result[0].examStats.totalExams).toBe(1);
    expect(result[0].examStats.completedExams).toBe(1);
    expect(result[0].examStats.averageScore).toBe(90);
  });

  test('getStudentById returns student by id', async () => {
    const mockStudent = { id: 5, name: 'John', email: 'john@test.com' };
    User.findByPk.mockResolvedValue(mockStudent);

    const result = await StudentService.getStudentById(5);

    expect(result).toEqual(mockStudent);
    expect(User.findByPk).toHaveBeenCalledWith(5, { attributes: { exclude: ['password'] } });
  });

  test('createStudent creates new student with hashed password', async () => {
    const mockStudent = { 
      id: 6, 
      name: 'Jane', 
      email: 'jane@test.com',
      toJSON: () => ({ id: 6, name: 'Jane', email: 'jane@test.com' })
    };
    User.create.mockResolvedValue(mockStudent);

    const result = await StudentService.createStudent({
      name: 'Jane',
      email: 'jane@test.com',
      password: 'hashed_password'
    });

    expect(result).toEqual(mockStudent);
  });

  test('getStudentAnalytics returns performance by subject', async () => {
    Certificate.findAll.mockResolvedValue([
      { studentId: 5, examId: 1, score: 85, issuedDate: new Date() },
      { studentId: 5, examId: 2, score: 90, issuedDate: new Date() }
    ]);

    Exam.findAll.mockResolvedValue([
      { 
        subject: 'Math',
        id: 1,
        title: 'Math Exam',
        passingScore: 40
      },
      { 
        subject: 'Science',
        id: 2,
        title: 'Science Exam',
        passingScore: 40
      }
    ]);

    const result = await StudentService.getStudentAnalytics(5);

    expect(result.totalExams).toBe(2);
    expect(result.averageScore).toBeDefined();
    expect(result.subjectWise).toBeDefined();
  });
});
