import request from "supertest";
import { app } from "./setup";
import { setupDatabase, teardownDatabase, clearDatabase } from "../fixtures/db";

const makeToken = async (role: string) => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: `${role} User ${Date.now()}`, email: `${role}-${Date.now()}@example.com`, password: "Password123!", role });
  return res.body.data.accessToken as string;
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

function createCodingQuestion(token: string) {
  return request(app)
    .post("/api/questions")
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: "Two Sum",
      statement: "Return indices of two numbers that add up to target.",
      type: "coding",
      difficulty: "medium",
      tags: ["arrays"],
      points: 50,
      coding: { starterCode: "// write your code", timeLimitMs: 5000, memoryLimitKb: 262144 },
    })
    .expect(201);
}

function createAssignment(token: string, extra: Record<string, unknown> = {}) {
  return request(app)
    .post("/api/assignments")
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: "Database Design Report",
      description: "Design a normalized schema for a library.",
      dueAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      maxPoints: 100,
      status: "published",
      rubric: [
        { title: "Schema correctness", maxPoints: 60 },
        { title: "Documentation", maxPoints: 40 },
      ],
      ...extra,
    })
    .expect(201);
}

describe("coding platform APIs", () => {
  it("submits code and receives a queued submission", async () => {
    const studentToken = await makeToken("student");
    const teacherToken = await makeToken("teacher");
    const created = await createCodingQuestion(teacherToken);
    const res = await request(app)
      .post("/api/coding")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ questionId: created.body.data.id, language: "javascript", sourceCode: "console.log(1)" })
      .expect(201);
    expect(res.body.data.verdict).toBe("queued");
    expect(res.body.data.id).toBeTruthy();
  });

  it("rejects submissions with empty source code", async () => {
    const studentToken = await makeToken("student");
    const teacherToken = await makeToken("teacher");
    const created = await createCodingQuestion(teacherToken);
    await request(app)
      .post("/api/coding")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ questionId: created.body.data.id, language: "javascript", sourceCode: "" })
      .expect(400);
  });

  it("lists the student's submissions", async () => {
    const studentToken = await makeToken("student");
    const teacherToken = await makeToken("teacher");
    const created = await createCodingQuestion(teacherToken);
    await request(app)
      .post("/api/coding")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ questionId: created.body.data.id, language: "javascript", sourceCode: "console.log(1)" })
      .expect(201);
    const res = await request(app)
      .get("/api/coding/my")
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it("rejects coding submissions to non-coding questions", async () => {
    const teacherToken = await makeToken("teacher");
    const studentToken = await makeToken("student");
    const mcq = await request(app)
      .post("/api/questions")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({
        title: "MCQ draft",
        statement: "Which is correct?",
        type: "mcq",
        difficulty: "easy",
        tags: [],
        points: 10,
        options: { choices: [{ id: "a", text: "A" }], answerIds: ["a"] },
      })
      .expect(201);
    await request(app)
      .post("/api/coding")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ questionId: mcq.body.data.id, language: "javascript", sourceCode: "x" })
      .expect(409);
  });
});

describe("assignment APIs", () => {
  it("rejects students from creating assignments", async () => {
    const teacherToken = await makeToken("teacher");
    const studentToken = await makeToken("student");
    await createAssignment(teacherToken);
    await request(app)
      .post("/api/assignments")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ title: "Fake Assignment", dueAt: new Date().toISOString(), maxPoints: 10 })
      .expect(403);
  });

  it("lists published assignments for students", async () => {
    const teacherToken = await makeToken("teacher");
    const studentToken = await makeToken("student");
    const res = await createAssignment(teacherToken);
    const assignmentId = res.body.data.id;
    const list = await request(app)
      .get("/api/assignments")
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(200);
    expect(list.body.data.some((a: { id: string }) => a.id === assignmentId)).toBe(true);
  });

  it("sends students a notification when an assignment is published", async () => {
    const teacherToken = await makeToken("teacher");
    const studentToken = await makeToken("student");
    await createAssignment(teacherToken);
    const notes = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(200);
    const notices = (notes.body.data.items as { type: string }[]).filter((n) => n.type === "assignment.published");
    expect(notices.length).toBeGreaterThan(0);
  });

  it("blocks submissions to closed assignments", async () => {
    const teacherToken = await makeToken("teacher");
    const studentToken = await makeToken("student");
    const assignmentId = (await createAssignment(teacherToken)).body.data.id;
    await request(app)
      .patch(`/api/assignments/${assignmentId}`)
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({ status: "closed" })
      .expect(200);
    await request(app)
      .post(`/api/assignments/${assignmentId}/submissions`)
      .set("Authorization", `Bearer ${studentToken}`)
      .attach("file", Buffer.from("file content"), "report.pdf")
      .expect(409);
  });

  it("allows students to submit a file before the deadline", async () => {
    const teacherToken = await makeToken("teacher");
    const studentToken = await makeToken("student");
    const assignmentId = (await createAssignment(teacherToken)).body.data.id;
    const res = await request(app)
      .post(`/api/assignments/${assignmentId}/submissions`)
      .set("Authorization", `Bearer ${studentToken}`)
      .attach("file", Buffer.from("my report content"), "report.pdf")
      .expect(201);
    expect(res.body.data.fileName).toBe("report.pdf");
  });

  it("lets teachers grade submissions and notify students", async () => {
    const teacherToken = await makeToken("teacher");
    const studentToken = await makeToken("student");
    const assignmentId = (await createAssignment(teacherToken)).body.data.id;
    await request(app)
      .post(`/api/assignments/${assignmentId}/submissions`)
      .set("Authorization", `Bearer ${studentToken}`)
      .attach("file", Buffer.from("my report content"), "report.pdf")
      .expect(201);
    const submissions = await request(app)
      .get(`/api/assignments/${assignmentId}/submissions`)
      .set("Authorization", `Bearer ${teacherToken}`)
      .expect(200);
    expect(submissions.body.data.length).toBeGreaterThan(0);
    const submissionId = submissions.body.data[0].id;

    const graded = await request(app)
      .patch(`/api/assignments/submissions/${submissionId}/grade`)
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({ grades: [{ criterion: "Schema correctness", points: 55 }, { criterion: "Documentation", points: 35 }] })
      .expect(200);
    expect(graded.body.data.totalGrade).toBe(90);

    const notes = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${studentToken}`)
      .expect(200);
    const gradedNotice = (notes.body.data.items as { type: string }[]).some((n) => n.type === "submission.graded");
    expect(gradedNotice).toBe(true);
  });
});
