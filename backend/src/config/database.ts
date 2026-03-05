import mongoose from "mongoose";
import { logger } from "./logger";
import { env } from "./env";

export async function connectDatabase(): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  logger.info("Connected to MongoDB", { uri: env.mongoUri.replace(/\/\/[^@]+@/, "//***@") });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info("Disconnected from MongoDB");
}
