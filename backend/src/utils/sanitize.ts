import { Document } from "mongoose";

/** Convert a Mongoose document to a plain object, dropping secret fields. */
export function toSafeObject<T extends Document>(
  doc: T,
  omit: string[] = ["password", "refreshToken"]
): Record<string, unknown> {
  const obj = doc.toObject<Record<string, unknown>>();
  for (const key of omit) delete obj[key];
  return obj;
}
