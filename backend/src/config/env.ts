import "dotenv/config";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "5000", 10),
  mongoUri: process.env.MONGODB_URI ?? "mongodb://localhost:27017/quizzy",
  jwtSecret: process.env.JWT_SECRET ?? "",
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY ?? "15m",
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY ?? "7d",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  appVersion: process.env.APP_VERSION ?? "0.1.0",
};

export function validateProductionConfig(): void {
  if (env.nodeEnv !== "production") return;
  if (env.jwtSecret.length < 32) throw new Error("JWT_SECRET must be at least 32 characters in production");
  if (env.mongoUri.includes("localhost") || env.mongoUri.includes("127.0.0.1")) {
    throw new Error("MONGODB_URI must point to a non-local database in production");
  }
  if (!env.corsOrigin.startsWith("https://")) throw new Error("CORS_ORIGIN must use HTTPS in production");
}
