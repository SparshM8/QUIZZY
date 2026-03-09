import "dotenv/config";
import { connectDatabase } from "./config/database";
import { User } from "./models/User";
import { hashPassword } from "./utils/password";
import { logger } from "./config/logger";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@quizzy.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin@1234";

async function seed() {
  await connectDatabase();
  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    logger.info("Seed: admin already exists, skipping");
    process.exit(0);
  }
  await User.create({
    name: "Quizzy Admin",
    email: ADMIN_EMAIL,
    password: await hashPassword(ADMIN_PASSWORD),
    role: "admin",
  });
  logger.info(`Seed: admin created (${ADMIN_EMAIL})`);
  process.exit(0);
}

seed().catch((err) => {
  logger.error("Seed failed", { error: String(err) });
  process.exit(1);
});
