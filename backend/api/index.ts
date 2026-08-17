import type { VercelRequest, VercelResponse } from "@vercel/node";
import { app } from "../src/server";
import { connectDatabase } from "../src/config/database";
import { validateProductionConfig } from "../src/config/env";

let databaseConnection: Promise<void> | undefined;

function ensureDatabaseConnection(): Promise<void> {
  if (!databaseConnection) {
    databaseConnection = connectDatabase().catch((error) => {
      databaseConnection = undefined;
      throw error;
    });
  }
  return databaseConnection;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    validateProductionConfig();
    await ensureDatabaseConnection();
    app(req, res);
  } catch (error) {
    console.error("Vercel request initialization failed", error);
    if (!res.headersSent) {
      res.status(503).json({
        success: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "The QUIZZY API is temporarily unavailable",
        },
      });
    }
  }
}
