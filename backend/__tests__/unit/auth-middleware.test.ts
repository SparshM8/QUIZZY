import { extractToken, verifyAccessToken } from "../../src/middleware/auth";
import jwt from "jsonwebtoken";
import { signAccessToken, signRefreshToken } from "../../src/utils/tokens";

const SECRET = "test-secret";

beforeAll(() => {
  process.env.JWT_SECRET = SECRET;
});

describe("auth middleware helpers", () => {
  it("extracts the bearer token", () => {
    expect(extractToken("Bearer abc")).toBe("abc");
    expect(extractToken(undefined)).toBeNull();
    expect(extractToken("Basic abc")).toBeNull();
  });

  it("rejects a refresh token used as an access token", () => {
    const token = signRefreshToken("u1", "a@b.com", "student");
    expect(() => verifyAccessToken(token)).toThrow(/Refresh tokens cannot be used/);
  });

  it("accepts a valid access token", () => {
    const token = signAccessToken("u1", "a@b.com", "admin");
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe("u1");
    expect(payload.role).toBe("admin");
  });

  it("rejects expired tokens", () => {
    const token = jwt.sign(
      { sub: "u1", email: "a@b.com", role: "student", type: "access" },
      SECRET,
      { expiresIn: "-1s" }
    );
    expect(() => verifyAccessToken(token)).toThrow();
  });
});
