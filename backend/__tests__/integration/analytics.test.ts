import request from "supertest";
import { app } from "./setup";
import { setupDatabase, teardownDatabase, clearDatabase } from "../fixtures/db";
import { Test } from "../../src/models/Test";
import { Attempt } from "../../src/models/Attempt";
// import { RecruitmentApplication, RecruitmentCampaign, RecruitmentInvitation } from "../../src/models/Recruitment";
import { Types } from "mongoose";
import { User } from "../../src/models/User";
import { hashPassword } from "../../src/utils/password";
import { issueTokenPair } from "../../src/utils/tokens";
import { env } from "../../src/config/env";

jest.setTimeout(30_000);

async function register(role: "teacher" | "student" | "recruiter", suffix: string) {
  const email = `${role}-${suffix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const user = await User.create({ name: `${role} ${suffix}`, email, password: await hashPassword("Password123!"), role });
  const tokens = issueTokenPair(String(user._id), user.email, user.role);
  return { token: tokens.accessToken, id: String(user._id), email: user.email };
}

beforeAll(async () => { process.env.JWT_SECRET = "integration-test-secret"; env.jwtSecret = "integration-test-secret"; await setupDatabase(); });
afterAll(async () => teardownDatabase());
afterEach(async () => clearDatabase());

describe("analytics APIs", () => {
  it("aggregates assessment performance and ranks the best attempt per learner", async () => {
    const teacher = await register("teacher", "analytics-owner");
    const firstStudent = await register("student", "first");
    const secondStudent = await register("student", "second");
    const test = await Test.create({ title: "Analytics Fundamentals", createdBy: new Types.ObjectId(teacher.id), durationMinutes: 30, status: "published", items: [], enrolledStudents: [{ studentId: new Types.ObjectId(firstStudent.id), status: "enrolled" }, { studentId: new Types.ObjectId(secondStudent.id), status: "enrolled" }] });
    await Attempt.create([
      { testId: test._id, studentId: new Types.ObjectId(firstStudent.id), status: "submitted", answers: [], startedAt: new Date(Date.now() - 20 * 60_000), submittedAt: new Date(), totalScore: 45, maxPossibleScore: 50, durationMinutes: 30, attemptNumber: 1 },
      { testId: test._id, studentId: new Types.ObjectId(firstStudent.id), status: "submitted", answers: [], startedAt: new Date(Date.now() - 15 * 60_000), submittedAt: new Date(), totalScore: 49, maxPossibleScore: 50, durationMinutes: 30, attemptNumber: 2 },
      { testId: test._id, studentId: new Types.ObjectId(secondStudent.id), status: "submitted", answers: [], startedAt: new Date(Date.now() - 25 * 60_000), submittedAt: new Date(), totalScore: 35, maxPossibleScore: 50, durationMinutes: 30, attemptNumber: 1 },
    ]);
    const overview = await request(app).get(`/api/analytics/tests/${test.id}/overview`).set("Authorization", `Bearer ${teacher.token}`).expect(200);
    expect(overview.body.data.submittedCount).toBe(3);
    expect(overview.body.data.completionRate).toBe(100);
    expect(overview.body.data.averageScore).toBe(86);
    const leaderboard = await request(app).get(`/api/analytics/tests/${test.id}/leaderboard`).set("Authorization", `Bearer ${firstStudent.token}`).expect(200);
    expect(leaderboard.body.data.rows).toHaveLength(2);
    expect(leaderboard.body.data.rows[0].score).toBe(98);
    expect(leaderboard.body.data.rows[0].attemptNumber).toBe(2);
  });

  // it("returns recruiter campaign funnel metrics and blocks unrelated recruiters", async () => {
  //   const recruiter = await register("recruiter", "owner");
  //   const otherRecruiter = await register("recruiter", "other");
  //   const campaign = await RecruitmentCampaign.create({ title: "Platform Hiring", roleTitle: "Engineer", createdBy: new Types.ObjectId(recruiter.id), organizationId: new Types.ObjectId(), status: "published" });
  //   await RecruitmentInvitation.create([{ campaignId: campaign._id, email: "pending@example.com", token: "pending-token-123456789", expiresAt: new Date(Date.now() + 86_400_000), status: "pending" }, { campaignId: campaign._id, email: "accepted@example.com", token: "accepted-token-123456789", expiresAt: new Date(Date.now() + 86_400_000), status: "accepted" }]);
  //   await RecruitmentApplication.create([{ campaignId: campaign._id, candidateId: new Types.ObjectId(), status: "completed", score: 88 }, { campaignId: campaign._id, candidateId: new Types.ObjectId(), status: "shortlisted", score: 96 }]);
  //   const summary = await request(app).get(`/api/analytics/recruitment/campaigns/${campaign.id}/summary`).set("Authorization", `Bearer ${recruiter.token}`).expect(200);
  //   expect(summary.body.data.invitations.accepted).toBe(1);
  //   expect(summary.body.data.applications.averageScore).toBe(92);
  //   expect(summary.body.data.applications.completionRate).toBe(100);
  //   await request(app).get(`/api/analytics/recruitment/campaigns/${campaign.id}/summary`).set("Authorization", `Bearer ${otherRecruiter.token}`).expect(403);
  // });
});
