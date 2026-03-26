import jwt from "jsonwebtoken";

// Set env BEFORE importing the module under test, since env.ts captures values at import time.
process.env.JWT_SECRET = "unit-test-secret";
process.env.JWT_ACCESS_EXPIRY = "15m";
process.env.JWT_REFRESH_EXPIRY = "7d";

import { signAccessToken, signRefreshToken, tokenExpiresInMs } from "../../src/utils/tokens";
import { TokenPayload } from "../../src/middleware/auth";

const SECRET = "unit-test-secret";

describe("token utilities", () => {
  it("signs an access token with the correct claims", () => {
    const token = signAccessToken("user-1", "a@b.com", "student");
    const payload = jwt.verify(token, SECRET) as TokenPayload;
    expect(payload.sub).toBe("user-1");
    expect(payload.email).toBe("a@b.com");
    expect(payload.role).toBe("student");
    expect(payload.type).toBe("access");
  });

  it("signs a refresh token with type refresh", () => {
    const token = signRefreshToken("user-1", "a@b.com", "teacher");
    const payload = jwt.verify(token, SECRET) as TokenPayload;
    expect(payload.type).toBe("refresh");
  });

  it("rejects an access token signed with a wrong secret", () => {
    const token = signAccessToken("user-1", "a@b.com", "student");
    expect(() => jwt.verify(token, "other-secret")).toThrow();
  });

  it("parses expiry strings into milliseconds", () => {
    expect(tokenExpiresInMs("15m")).toBe(15 * 60_000);
    expect(tokenExpiresInMs("7d")).toBe(7 * 86_400_000);
    expect(tokenExpiresInMs("1h")).toBe(3_600_000);
  });
});
