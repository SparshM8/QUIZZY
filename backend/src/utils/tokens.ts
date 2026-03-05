import jwt, { SignOptions } from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { env } from "../config/env";
import { TokenPayload } from "../middleware/auth";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export function signAccessToken(userId: string, email: string, role: string): string {
  const payload: Omit<TokenPayload, "iat" | "exp"> = { sub: userId, email, role, type: "access" };
  const opts: SignOptions = { expiresIn: env.jwtAccessExpiry as SignOptions["expiresIn"], jwtid: uuid() };
  return jwt.sign(payload, env.jwtSecret, opts);
}

export function signRefreshToken(userId: string, email: string, role: string): string {
  const payload: Omit<TokenPayload, "iat" | "exp"> = { sub: userId, email, role, type: "refresh" };
  const opts: SignOptions = { expiresIn: env.jwtRefreshExpiry as SignOptions["expiresIn"], jwtid: uuid() };
  return jwt.sign(payload, env.jwtSecret, opts);
}

export function tokenExpiresInMs(expiry: string): number {
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1), 10);
  const map: Record<string, number> = { m: 60_000, h: 3_600_000, d: 86_400_000, s: 1_000 };
  return value * (map[unit] ?? 60_000);
}

export function issueTokenPair(userId: string, email: string, role: string): TokenPair {
  return {
    accessToken: signAccessToken(userId, email, role),
    refreshToken: signRefreshToken(userId, email, role),
    expiresAt: Date.now() + tokenExpiresInMs(env.jwtAccessExpiry),
  };
}
