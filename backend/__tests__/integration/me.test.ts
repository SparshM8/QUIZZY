import request from "supertest";
import { app } from "./setup";
import { setupDatabase, teardownDatabase, clearDatabase } from "../fixtures/db";

const BASE = "/api/auth";
const TEST_USER = { name: "Me User", email: "me@example.com", password: "Password123!", role: "teacher" };

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

async function registerAndGetToken() {
  const res = await request(app).post(BASE + "/register").send(TEST_USER);
  return res.body.data.accessToken;
}

describe("/api/me", () => {
  it("GET /api/me returns the authenticated user", async () => {
    const token = await registerAndGetToken();
    const res = await request(app).get("/api/me").set("Authorization", `Bearer ${token}`).expect(200);
    expect(res.body.data.email).toBe("me@example.com");
    expect(res.body.data.role).toBe("teacher");
  });

  it("rejects unauthenticated requests", async () => {
    await request(app).get("/api/me").expect(401);
  });

  it("PATCH /api/me updates the name", async () => {
    const token = await registerAndGetToken();
    const res = await request(app)
      .patch("/api/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated Name" })
      .expect(200);
    expect(res.body.data.name).toBe("Updated Name");
  });

  it("PATCH /api/me/password changes the password", async () => {
    const token = await registerAndGetToken();
    await request(app)
      .patch("/api/me/password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: TEST_USER.password, newPassword: "NewPassword123!" })
      .expect(200);
    // old password no longer works
    await request(app)
      .post(BASE + "/login")
      .send({ email: TEST_USER.email, password: TEST_USER.password })
      .expect(401);
  });
});
