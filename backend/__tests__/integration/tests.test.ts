import request from "supertest";
import { app } from "./setup";
import { setupDatabase, teardownDatabase, clearDatabase } from "../fixtures/db";
import { User } from "../../src/models/User";

const makeToken = async (role: string, suffix = Date.now()) => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: `${role} ${suffix}`, email: `${role}-${suffix}@example.com`, password: "Password123!", role });
  return { token: res.body.data.accessToken, user: res.body.data.user };
};

// The test users are pre-verified so the requireVerified middleware (added for
// email-verification security) does not gate the test engine flow itself.
const makeVerifiedToken = async (role: string, suffix = Date.now()) => {
  const { token, user } = await makeToken(role, suffix);
  await User.updateOne({ _id: user.id }, { isEmailVerified: true });
  return { token, user };
};

const makeQuestion = async (token: string) => {
  const res = await request(app)
    .post("/api/questions")
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: "What is 2 + 2?",
      statement: "Compute the sum.",
      type: "numerical",
      difficulty: "easy",
      tags: ["math"],
      points: 5,
      numerical: { answer: 4, tolerance: 0 },
    });
  return res.body.data.id;
};

beforeAll(async () => {
  process.env.JWT_SECRET = "integration-test-secret";
  await setupDatabase();
});

afterAll(async () => {
  await teardownDatabase();
});

afterEach(async () => {
  await clearDatabase();
});

describe("test engine APIs", () => {
  it("creates a test as draft", async () => {
    const teacher = await makeToken("teacher");
    const qid = await makeQuestion(teacher.token);
    const res = await request(app)
      .post("/api/tests")
      .set("Authorization", `Bearer ${teacher.token}`)
      .send({
        title: "Midterm Exam",
        durationMinutes: 60,
        items: [{ questionId: qid, points: 5, order: 0 }],
      })
      .expect(201);
    expect(res.body.data.status).toBe("draft");
    expect(res.body.data.items).toHaveLength(1);
  });

  it("refuses students from creating tests", async () => {
    const student = await makeToken("student");
    await request(app)
      .post("/api/tests")
      .set("Authorization", `Bearer ${student.token}`)
      .send({ title: "Sneaky Test", durationMinutes: 10, items: [] })
      .expect(403);
  });

  it("publishes a test with questions", async () => {
    const teacher = await makeToken("teacher");
    const qid = await makeQuestion(teacher.token);
    const created = await request(app)
      .post("/api/tests")
      .set("Authorization", `Bearer ${teacher.token}`)
      .send({ title: "Final", durationMinutes: 30, items: [{ questionId: qid, points: 5, order: 0 }] });
    const res = await request(app)
      .post(`/api/tests/${created.body.data.id}/publish`)
      .set("Authorization", `Bearer ${teacher.token}`)
      .expect(200);
    expect(res.body.data.status).toBe("published");
  });

  it("rejects publishing an empty test", async () => {
    const teacher = await makeToken("teacher");
    const created = await request(app)
      .post("/api/tests")
      .set("Authorization", `Bearer ${teacher.token}`)
      .send({ title: "Empty", durationMinutes: 30, items: [] });
    await request(app)
      .post(`/api/tests/${created.body.data.id}/publish`)
      .set("Authorization", `Bearer ${teacher.token}`)
      .expect(409);
  });

  it("lets enrolled students start an attempt", async () => {
    const teacher = await makeToken("teacher");
    const student = await makeVerifiedToken("student");
    const qid = await makeQuestion(teacher.token);
    const created = await request(app)
      .post("/api/tests")
      .set("Authorization", `Bearer ${teacher.token}`)
      .send({ title: "Quiz 1", durationMinutes: 30, items: [{ questionId: qid, points: 5, order: 0 }] });
    await request(app)
      .post(`/api/tests/${created.body.data.id}/publish`)
      .set("Authorization", `Bearer ${teacher.token}`);
    await request(app)
      .post(`/api/tests/${created.body.data.id}/enroll`)
      .set("Authorization", `Bearer ${teacher.token}`)
      .send({ studentId: student.user.id })
      .expect(200);

    const res = await request(app)
      .post(`/api/tests/${created.body.data.id}/attempts`)
      .set("Authorization", `Bearer ${student.token}`)
      .expect(201);
    expect(res.body.data.status).toBe("in_progress");
  });

  it("rejects non-enrolled students from starting", async () => {
    const teacher = await makeToken("teacher");
    const stranger = await makeVerifiedToken("student", Date.now() + 1);
    const qid = await makeQuestion(teacher.token);
    const created = await request(app)
      .post("/api/tests")
      .set("Authorization", `Bearer ${teacher.token}`)
      .send({ title: "Quiz 2", durationMinutes: 10, items: [{ questionId: qid, points: 5, order: 0 }] });
    await request(app)
      .post(`/api/tests/${created.body.data.id}/publish`)
      .set("Authorization", `Bearer ${teacher.token}`);
    await request(app)
      .post(`/api/tests/${created.body.data.id}/attempts`)
      .set("Authorization", `Bearer ${stranger.token}`)
      .expect(403);
  });

  it("saves answers, submits, and scores objective answers", async () => {
    const teacher = await makeToken("teacher");
    const student = await makeVerifiedToken("student");
    const qid = await makeQuestion(teacher.token);
    const created = await request(app)
      .post("/api/tests")
      .set("Authorization", `Bearer ${teacher.token}`)
      .send({ title: "Scored", durationMinutes: 30, items: [{ questionId: qid, points: 5, order: 0 }] });
    await request(app).post(`/api/tests/${created.body.data.id}/publish`).set("Authorization", `Bearer ${teacher.token}`);
    await request(app)
      .post(`/api/tests/${created.body.data.id}/enroll`)
      .set("Authorization", `Bearer ${teacher.token}`)
      .send({ studentId: student.user.id });
    const attempt = await request(app)
      .post(`/api/tests/${created.body.data.id}/attempts`)
      .set("Authorization", `Bearer ${student.token}`);
    const attemptId = attempt.body.data.id;

    await request(app)
      .patch(`/api/tests/attempts/${attemptId}/answers`)
      .set("Authorization", `Bearer ${student.token}`)
      .send({ answers: [{ questionId: qid, answer: 4 }] })
      .expect(200);

    await request(app)
      .get(`/api/tests/attempts/${attemptId}/heartbeat`)
      .set("Authorization", `Bearer ${student.token}`)
      .expect(200);

    await request(app)
      .post(`/api/tests/attempts/${attemptId}/submit`)
      .set("Authorization", `Bearer ${student.token}`)
      .expect(200);

    const result = await request(app)
      .get(`/api/tests/attempts/${attemptId}/result`)
      .set("Authorization", `Bearer ${student.token}`)
      .expect(200);
    expect(result.body.data.attempt.totalScore).toBe(5);
    expect(result.body.data.attempt.status).toBe("submitted");
  });

  it("notifies enrolled students when a test is published", async () => {
    const teacher = await makeToken("teacher");
    const student = await makeToken("student");
    const qid = await makeQuestion(teacher.token);
    const created = await request(app)
      .post("/api/tests")
      .set("Authorization", `Bearer ${teacher.token}`)
      .send({
        title: "Notified",
        durationMinutes: 15,
        items: [{ questionId: qid, points: 5, order: 0 }],
        enrolledStudents: [{ studentId: student.user.id }],
      });
    await request(app)
      .post(`/api/tests/${created.body.data.id}/publish`)
      .set("Authorization", `Bearer ${teacher.token}`);

    const res = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${student.token}`)
      .expect(200);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.unread).toBeGreaterThanOrEqual(1);
  });

  it("marks notifications as read", async () => {
    const student = await makeToken("student");
    const res = await request(app)
      .patch("/api/notifications/read")
      .set("Authorization", `Bearer ${student.token}`)
      .send({})
      .expect(200);
    expect(res.body.data.marked).toBeGreaterThanOrEqual(0);
  });
});
