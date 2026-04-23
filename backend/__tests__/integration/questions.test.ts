import request from "supertest";
import { Types } from "mongoose";
import { app } from "./setup";
import { setupDatabase, teardownDatabase, clearDatabase } from "../fixtures/db";

const BASE = "/api/auth";

const makeToken = async (role: string) => {
  const res = await request(app)
    .post(BASE + "/register")
    .send({ name: `${role} User`, email: `${role}-${Date.now()}@example.com`, password: "Password123!", role });
  return { token: res.body.data.accessToken, user: res.body.data.user };
};

const MCQ_QUESTION = {
  title: "Capital of France",
  statement: "What is the capital of France?",
  type: "mcq",
  difficulty: "easy",
  tags: ["geography"],
  points: 10,
  options: {
    choices: [
      { id: "a", text: "Paris" },
      { id: "b", text: "London" },
    ],
    answerIds: ["a"],
  },
};

const CODING_QUESTION = {
  title: "Two Sum",
  statement: "Return indices of two numbers that add up to target.",
  type: "coding",
  difficulty: "medium",
  tags: ["arrays"],
  points: 50,
  coding: {
    starterCode: "def solve(nums, target): pass",
    solution: "def solve(nums, target): return [0,1]",
    timeLimitMs: 5000,
    memoryLimitKb: 262144,
  },
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

describe("question engine APIs", () => {
  it("creates a question as draft by default", async () => {
    const { token } = await makeToken("teacher");
    const res = await request(app)
      .post("/api/questions")
      .set("Authorization", `Bearer ${token}`)
      .send(MCQ_QUESTION)
      .expect(201);
    expect(res.body.data.status).toBe("draft");
    expect(res.body.data.type).toBe("mcq");
  });

  it("rejects mcq questions without answers", async () => {
    const { token } = await makeToken("teacher");
    await request(app)
      .post("/api/questions")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...MCQ_QUESTION, options: { choices: MCQ_QUESTION.options.choices, answerIds: [] } })
      .expect(400);
  });

  it("creates a coding question with coding block", async () => {
    const { token } = await makeToken("teacher");
    const res = await request(app)
      .post("/api/questions")
      .set("Authorization", `Bearer ${token}`)
      .send(CODING_QUESTION)
      .expect(201);
    expect(res.body.data.coding.timeLimitMs).toBe(5000);
  });

  it("rejects coding questions without a coding block", async () => {
    const { token } = await makeToken("teacher");
    const { coding, ...rest } = CODING_QUESTION;
    void coding;
    await request(app)
      .post("/api/questions")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...rest, coding: undefined })
      .expect(400);
  });

  it("lists only approved questions for students", async () => {
    const teacher = await makeToken("teacher");
    const student = await makeToken("student");
    await request(app).post("/api/questions").set("Authorization", `Bearer ${teacher.token}`).send(MCQ_QUESTION);
    const res = await request(app)
      .get("/api/questions")
      .set("Authorization", `Bearer ${student.token}`)
      .expect(200);
    expect(res.body.data.items).toHaveLength(0);
  });

  it("supports filtering by type and pagination", async () => {
    const teacher = await makeToken("teacher");
    await request(app).post("/api/questions").set("Authorization", `Bearer ${teacher.token}`).send(MCQ_QUESTION);
    const res = await request(app)
      .get("/api/questions?type=mcq&page=1&limit=5")
      .set("Authorization", `Bearer ${teacher.token}`)
      .expect(200);
    expect(res.body.data.pagination.total).toBe(1);
    expect(res.body.data.items[0].type).toBe("mcq");
  });

  it("allows teachers to moderate questions", async () => {
    const teacher = await makeToken("teacher");
    const created = await request(app)
      .post("/api/questions")
      .set("Authorization", `Bearer ${teacher.token}`)
      .send(MCQ_QUESTION);
    const res = await request(app)
      .post(`/api/questions/${created.body.data.id}/moderate`)
      .set("Authorization", `Bearer ${teacher.token}`)
      .send({ status: "approved" })
      .expect(200);
    expect(res.body.data.status).toBe("approved");
  });

  it("denies students from moderating", async () => {
    const student = await makeToken("student");
    await request(app)
      .post(`/api/questions/${new Types.ObjectId()}/moderate`)
      .set("Authorization", `Bearer ${student.token}`)
      .send({ status: "approved" })
      .expect(403);
  });

  it("deletes a question authored by the user", async () => {
    const teacher = await makeToken("teacher");
    const created = await request(app)
      .post("/api/questions")
      .set("Authorization", `Bearer ${teacher.token}`)
      .send(MCQ_QUESTION);
    await request(app)
      .delete(`/api/questions/${created.body.data.id}`)
      .set("Authorization", `Bearer ${teacher.token}`)
      .expect(200);
    await request(app)
      .get(`/api/questions/${created.body.data.id}`)
      .set("Authorization", `Bearer ${teacher.token}`)
      .expect(404);
  });
});
