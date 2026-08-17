import request from "supertest";
import { app } from "./setup";
import { setupDatabase, teardownDatabase } from "../fixtures/db";

jest.setTimeout(30_000);

beforeAll(async () => {
  process.env.JWT_SECRET = "integration-test-secret";
  await setupDatabase();
});

afterAll(async () => {
  await teardownDatabase();
});

describe("health endpoints", () => {
  it("returns liveness without authentication", async () => {
    const response = await request(app).get("/api/health").expect(200);
    expect(response.body).toMatchObject({ success: true, data: { status: "ok", service: "quizzy-api" } });
  });

  it("reports readiness when MongoDB is connected", async () => {
    const response = await request(app).get("/api/health/ready").expect(200);
    expect(response.body).toMatchObject({
      success: true,
      data: { status: "ready", dependencies: { mongodb: "up" } },
    });
  });
});
