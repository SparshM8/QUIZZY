import type { Request, Response } from "express";
import mongoose from "mongoose";

export const getHealth = async (req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      api: "healthy",
      judge: "active"
    },
    environment: process.env.NODE_ENV || "production",
    version: "1.2.0-pro"
  };

  if (dbStatus !== "connected") {
    return res.status(503).json({ ...health, status: "error" });
  }

  res.json(health);
};
