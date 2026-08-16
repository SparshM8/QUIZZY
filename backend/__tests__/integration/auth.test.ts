import request from "supertest";
import { app } from "./setup";
import { setupDatabase, teardownDatabase, clearDatabase } from "../fixtures/db";

const BASE = "/api/auth";
const TEST_USER = {
  name: "Test User",
  email: "test@example.com",
  password: "Password123!",
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

describe("POST /api/auth/register", () => {
  it("registers a new user and returns tokens", async () => {
    const res = await request(app).post(BASE + "/register").send(TEST_USER).expect(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe("test@example.com");
    expect(res.body.data.user.role).toBe("student");
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.refreshToken).toBeTruthy();
    expect(res.body.data.user.password).toBeUndefined();
  });

  it("rejects duplicate email", async () => {
    await request(app).post(BASE + "/register").send(TEST_USER).expect(201);
    await request(app).post(BASE + "/register").send(TEST_USER).expect(409);
  });

  it("rejects invalid payloads", async () => {
    await request(app).post(BASE + "/register").send({ name: "A", email: "bad", password: "short" }).expect(400);
  });

  it("allows admin self-registration via role field", async () => {
    const res = await request(app)
      .post(BASE + "/register")
      .send({ ...TEST_USER, role: "admin" })
      .expect(201);
    expect(res.body.data.user.role).toBe("admin");
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with correct credentials", async () => {
    await request(app).post(BASE + "/register").send(TEST_USER);
    const res = await request(app)
      .post(BASE + "/login")
      .send({ email: TEST_USER.email, password: TEST_USER.password })
      .expect(200);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it("rejects wrong password", async () => {
    await request(app).post(BASE + "/register").send(TEST_USER);
    await request(app)
      .post(BASE + "/login")
      .send({ email: TEST_USER.email, password: "WrongPassword1!" })
      .expect(401);
  });
});

describe("refresh and logout", () => {
  it("refreshes an access token using the refresh token", async () => {
    const reg = await request(app).post(BASE + "/register").send(TEST_USER).expect(201);
    const oldAccess = reg.body.data.accessToken;
    const res = await request(app)
      .post(BASE + "/refresh")
      .send({ refreshToken: reg.body.data.refreshToken })
      .expect(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.accessToken).not.toBe(oldAccess);
  });

  it("logs out and invalidates the refresh token", async () => {
    const reg = await request(app).post(BASE + "/register").send(TEST_USER).expect(201);
    await request(app)
      .post(BASE + "/logout")
      .set("Authorization", `Bearer ${reg.body.data.accessToken}`)
      .expect(200);
    await request(app)
      .post(BASE + "/refresh")
      .send({ refreshToken: reg.body.data.refreshToken })
      .expect(401);
  });
});
