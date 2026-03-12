import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { AppError } from "./errorHandler";

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7).trim();
}

export function verifyAccessToken(token: string): TokenPayload {
  const payload = jwt.verify(token, env.jwtSecret) as TokenPayload;
  if (payload.type !== "access") {
    throw new AppError(401, "INVALID_TOKEN_TYPE", "Refresh tokens cannot be used as access tokens");
  }
  return payload;
}

export function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) throw new AppError(401, "MISSING_TOKEN", "Authentication required");
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(new AppError(401, "INVALID_TOKEN", "Invalid or expired token"));
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError(401, "MISSING_TOKEN", "Authentication required"));
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, "INSUFFICIENT_ROLE", `Requires one of: ${roles.join(", ")}`));
    }
    next();
  };
}
