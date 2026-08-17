import { Document } from "mongoose";

/**
 * Convert a Mongoose document to a plain object, dropping secret fields.
 *
 * `password` and `refreshToken` are ALWAYS removed, even when a caller
 * supplies its own omit list (e.g. `toSafeObject(user, ["refreshToken"])`
 * must not accidentally expose the password hash).
 */
export function toSafeObject<T extends Document>(
  doc: T,
  omit: string[] = []
): Record<string, unknown> {
  const obj = doc.toObject<Record<string, unknown>>();
  for (const key of ["password", "refreshToken", ...omit]) delete obj[key];
  return obj;
}
