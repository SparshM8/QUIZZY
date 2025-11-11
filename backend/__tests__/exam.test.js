const request = require('supertest');

// Use the running server at localhost:5000
const baseUrl = 'http://localhost:5000';

describe('Exam Creation (against running server)', () => {
  let adminToken;

  beforeAll(async () => {
    // Login as admin
    const loginRes = await request(baseUrl)
      .post('/api/auth/login')
      .send({ email: 'admin@quizzy.com', password: 'admin123' })
      .set('Accept', 'application/json');

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    adminToken = loginRes.body.token;
  });

  test('create new exam successfully', async () => {
    const examData = {
      title: 'Test Math Exam',
      description: 'A test exam for mathematics',
      subject: 'Mathematics',
      duration: 60,
      difficulty: 'Medium',
      totalQuestions: 10,
      passingScore: 70,
      questions: [
        {
          question: 'What is 2 + 2?',
          options: ['3', '4', '5', '6'],
          correctAnswer: 1,
          type: 'multiple-choice'
        }
      ]
    };

    const res = await request(baseUrl)
      .post('/api/exams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(examData)
      .set('Accept', 'application/json');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.title).toBe(examData.title);
    expect(res.body.data.subject).toBe(examData.subject);
  });

  test('fail to create exam without authentication', async () => {
    const examData = {
      title: 'Unauthorized Exam',
      subject: 'Test',
      duration: 30,
      totalQuestions: 5,
      passingScore: 60
    };

    const res = await request(baseUrl)
      .post('/api/exams')
      .send(examData)
      .set('Accept', 'application/json');

    expect(res.status).toBe(401);
  });

  test('fail to create exam with invalid data', async () => {
    const invalidExamData = {
      title: '', // empty title
      subject: 'Test',
      duration: 0, // invalid duration
      totalQuestions: 0,
      passingScore: 150 // invalid score
    };

    const res = await request(baseUrl)
      .post('/api/exams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(invalidExamData)
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });
});