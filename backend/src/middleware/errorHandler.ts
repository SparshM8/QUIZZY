import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(404, "NOT_FOUND", "Resource not found"));
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  void _next;
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, error: { code: err.code, message: err.message } });
    return;
  }
  logger.error("Unhandled error", { error: String(err) });
  const message = process.env.NODE_ENV === "production" ? "Internal server error" : String(err);
  res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message } });
}
