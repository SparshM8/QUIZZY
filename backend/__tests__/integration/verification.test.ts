import request from "supertest";
import { app } from "./setup";
import { setupDatabase, teardownDatabase, clearDatabase } from "../fixtures/db";
import { User } from "../../src/models/User";
import { VerificationToken } from "../../src/models/VerificationToken";
import { generateVerificationToken, hashToken } from "../../src/utils/email";

const BASE = "/api/auth";
const TEST_USER = {
  name: "Verify User",
  email: "verify@example.com",
  password: "Password123!",
};

async function registerAndGetToken() {
  const res = await request(app).post(BASE + "/register").send(TEST_USER).expect(201);
  const raw = generateVerificationToken();
  // The controller generated its own token; replace its hash record with ours
  // (the raw value is unknowable otherwise) so we can exercise the endpoint.
  await VerificationToken.deleteMany({});
  const user = await User.findOne({ email: TEST_USER.email });
  await VerificationToken.create({
    userId: user!._id,
    tokenHash: hashToken(raw),
    purpose: "email_verification",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  return { accessToken: res.body.data.accessToken, raw };
}

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

describe("email verification", () => {
  it("registers with isEmailVerified false and a candidate ID", async () => {
    const res = await request(app).post(BASE + "/register").send(TEST_USER).expect(201);
    expect(res.body.data.user.isEmailVerified).toBe(false);
    expect(res.body.data.user.candidateId).toMatch(/^QUIZ-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    const stored = await User.findOne({ email: TEST_USER.email });
    expect(stored?.candidateId).toBe(res.body.data.user.candidateId);
  });

  it("login reports emailVerified status", async () => {
    await request(app).post(BASE + "/register").send(TEST_USER).expect(201);
    const login = await request(app).post(BASE + "/login").send(TEST_USER).expect(200);
    expect(login.body.data.emailVerified).toBe(false);
  });

  it("verifies email with a valid token", async () => {
    const { raw } = await registerAndGetToken();
    const res = await request(app).post(BASE + "/verify-email").send({ token: raw }).expect(200);
    expect(res.body.data.message).toContain("verified");
    const user = await User.findOne({ email: TEST_USER.email });
    expect(user?.isEmailVerified).toBe(true);
  });

  it("rejects invalid, used, and missing tokens without revealing account state", async () => {
    const { raw } = await registerAndGetToken();
    await request(app).post(BASE + "/verify-email").send({ token: raw }).expect(200);
    await request(app).post(BASE + "/verify-email").send({ token: raw }).expect(400); // used
    await request(app).post(BASE + "/verify-email").send({ token: "0".repeat(64) }).expect(400); // invalid
    await request(app).post(BASE + "/verify-email").send({}).expect(400); // missing
  });

  it("rejects expired tokens", async () => {
    const { raw } = await registerAndGetToken();
    await VerificationToken.updateOne({ tokenHash: hashToken(raw) }, { expiresAt: new Date(Date.now() - 60_000) });
    await request(app).post(BASE + "/verify-email").send({ token: raw }).expect(400);
  });

  it("resend endpoint returns a generic success regardless of email existence", async () => {
    await request(app).post(BASE + "/resend-verification").send({ email: "nobody@example.com" }).expect(200);
    const res = await request(app).post(BASE + "/resend-verification").send({ email: TEST_USER.email }).expect(200);
    expect(res.body.data.message).toContain("new verification link");
  });
});

describe("weak password rejection", () => {
  it("rejects registration with a weak password", async () => {
    await request(app)
      .post(BASE + "/register")
      .send({ ...TEST_USER, email: "weak@example.com", password: "12345678" })
      .expect(400);
    expect(await User.countDocuments({ email: "weak@example.com" })).toBe(0);
  });
});
