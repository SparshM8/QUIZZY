const request = require('supertest');
const path = require('path');

// Use the running server at localhost:5000 to avoid EADDRINUSE when server is already running
const baseUrl = 'http://localhost:5000';

describe('Avatar upload flow (against running server)', () => {
  test('login as student and upload avatar', async () => {
    // Login
    const loginRes = await request(baseUrl)
      .post('/api/auth/login')
      .send({ email: 'john@student.com', password: 'student123' })
      .set('Accept', 'application/json');

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    const token = loginRes.body.token;
    expect(token).toBeTruthy();

    // Upload file
    const imagePath = path.join(__dirname, '..', 'test-image.png');
    const uploadRes = await request(baseUrl)
      .post('/api/auth/upload-avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', imagePath);

    expect(uploadRes.status).toBe(200);
    expect(uploadRes.body.success).toBe(true);
    expect(uploadRes.body.data).toBeDefined();
    expect(uploadRes.body.data.user.avatar).toMatch(/uploads\/profiles\//);
  }, 20000);
});
