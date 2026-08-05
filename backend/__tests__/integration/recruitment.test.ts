import request from "supertest";
import { app } from "./setup";
import { setupDatabase, teardownDatabase, clearDatabase } from "../fixtures/db";
import { RecruitmentInvitation } from "../../src/models/Recruitment";

async function makeUser(role: "recruiter" | "student", suffix: string) {
  const res = await request(app).post("/api/auth/register").send({
    name: `${role} ${suffix}`,
    email: `${role}-${suffix}-${Date.now()}@example.com`,
    password: "Password123!",
    role,
  });
  return { token: res.body.data.accessToken as string, email: res.body.data.user.email as string };
}

beforeAll(async () => {
  process.env.JWT_SECRET = "integration-test-secret";
  await setupDatabase();
});
afterAll(async () => teardownDatabase());
afterEach(async () => clearDatabase());

describe("recruitment platform APIs", () => {
  it("creates an organization and campaign for a recruiter", async () => {
    const recruiter = await makeUser("recruiter", "owner");
    const organization = await request(app)
      .post("/api/recruitment/organizations")
      .set("Authorization", `Bearer ${recruiter.token}`)
      .send({ name: "Acme Labs", description: "Engineering hiring" })
      .expect(201);
    expect(organization.body.data.slug).toContain("acme-labs");
    const campaign = await request(app)
      .post("/api/recruitment/campaigns")
      .set("Authorization", `Bearer ${recruiter.token}`)
      .send({ organizationId: organization.body.data.id, title: "Frontend Launchpad", roleTitle: "Frontend Engineer", skills: ["React", "TypeScript"] })
      .expect(201);
    expect(campaign.body.data.status).toBe("draft");
  });

  it("invites a candidate, accepts the invitation, and allows shortlisting", async () => {
    const recruiter = await makeUser("recruiter", "hiring");
    const student = await makeUser("student", "candidate");
    const organization = await request(app)
      .post("/api/recruitment/organizations")
      .set("Authorization", `Bearer ${recruiter.token}`)
      .send({ name: "Northstar" })
      .expect(201);
    const campaign = await request(app)
      .post("/api/recruitment/campaigns")
      .set("Authorization", `Bearer ${recruiter.token}`)
      .send({ organizationId: organization.body.data.id, title: "Graduate Hiring", roleTitle: "Software Engineer", skills: ["Node.js"] })
      .expect(201);
    const invitation = await request(app)
      .post(`/api/recruitment/campaigns/${campaign.body.data.id}/invitations`)
      .set("Authorization", `Bearer ${recruiter.token}`)
      .send({ emails: [student.email] })
      .expect(201);
    expect(invitation.body.data).toHaveLength(1);
    const storedInvitation = await RecruitmentInvitation.findOne({ email: student.email }).select("+token");
    expect(storedInvitation?.token).toBeTruthy();
    await request(app)
      .post("/api/recruitment/invitations/accept")
      .set("Authorization", `Bearer ${student.token}`)
      .send({ token: storedInvitation?.token })
      .expect(200);
    const applications = await request(app)
      .get("/api/recruitment/applications/me")
      .set("Authorization", `Bearer ${student.token}`)
      .expect(200);
    expect(applications.body.data).toHaveLength(1);
    expect(applications.body.data[0].status).toBe("started");
    const applicationId = applications.body.data[0].id;
    const ranked = await request(app)
      .get(`/api/recruitment/campaigns/${campaign.body.data.id}/ranking`)
      .set("Authorization", `Bearer ${recruiter.token}`)
      .expect(200);
    expect(ranked.body.data[0].id).toBe(applicationId);
    await request(app)
      .patch(`/api/recruitment/applications/${applicationId}`)
      .set("Authorization", `Bearer ${recruiter.token}`)
      .send({ status: "shortlisted", score: 92, notes: "Strong fundamentals" })
      .expect(200);
    const updated = await request(app)
      .get("/api/recruitment/applications/me")
      .set("Authorization", `Bearer ${student.token}`)
      .expect(200);
    expect(updated.body.data[0].status).toBe("shortlisted");
    expect(updated.body.data[0].score).toBe(92);
  });

  it("prevents students from creating organizations", async () => {
    const student = await makeUser("student", "blocked");
    await request(app)
      .post("/api/recruitment/organizations")
      .set("Authorization", `Bearer ${student.token}`)
      .send({ name: "Not Allowed" })
      .expect(403);
  });
});
