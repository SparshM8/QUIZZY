import "dotenv/config";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "5000", 10),
  mongoUri: process.env.MONGODB_URI ?? "mongodb://localhost:27017/quizzy",
  jwtSecret: process.env.JWT_SECRET ?? "",
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY ?? "15m",
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY ?? "7d",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  corsOriginExplicit: typeof process.env.CORS_ORIGIN === "string" && process.env.CORS_ORIGIN.trim() !== "",
  appVersion: process.env.APP_VERSION ?? "0.1.0",
  // Email verification (Resend free tier). Optional: when absent the platform
  // still issues verification tokens but registration completes without an
  // email being sent (see src/utils/email.ts).
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailFromAddress: process.env.EMAIL_FROM_ADDRESS ?? "",
  platformUrl: process.env.PLATFORM_URL ?? "",
};

export function validateProductionConfig(): void {
  if (env.nodeEnv !== "production") return;
  if (env.jwtSecret.length < 32) throw new Error("JWT_SECRET must be at least 32 characters in production");
  if (env.mongoUri.includes("localhost") || env.mongoUri.includes("127.0.0.1")) {
    throw new Error("MONGODB_URI must point to a non-local database in production");
  }
  // The explicit origin is validated for HTTPS only when an operator sets it;
  // the CORS middleware rejects requests from any explicit origin, and when no
  // origin is configured it mirrors the request origin, which works for any host.
  if (env.corsOriginExplicit && !env.corsOrigin.startsWith("https://")) {
    throw new Error("CORS_ORIGIN must use HTTPS in production");
  }
}
