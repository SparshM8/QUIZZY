import "dotenv/config";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "5000", 10),
  mongoUri: process.env.MONGODB_URI ?? "mongodb://localhost:27017/quizzy",
  jwtSecret: process.env.JWT_SECRET ?? "",
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY ?? "15m",
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY ?? "7d",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
};

if (env.jwtSecret === "" && env.nodeEnv === "production") {
  throw new Error("JWT_SECRET is required in production");
}
