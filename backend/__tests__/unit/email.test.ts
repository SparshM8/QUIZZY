import {
  generateCandidateId,
  validatePasswordStrength,
  generateVerificationToken,
  hashToken,
  buildVerificationLink,
} from "../../src/utils/email";

describe("candidate ID generation", () => {
  it("emits the QUIZ prefix format", () => {
    const id = generateCandidateId();
    expect(id).toMatch(/^QUIZ-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });

  it("avoids visually ambiguous characters (0, O, 1, I, L)", () => {
    for (let i = 0; i < 50; i++) {
      const id = generateCandidateId();
      expect(id).toMatch(/^QUIZ-/);
      // The random suffix must not contain look-alike characters.
      expect(id.slice(5)).not.toMatch(/[0O1IL]/);
    }
  });

  it("is unique across many generations", () => {
    const ids = new Set(Array.from({ length: 2000 }, () => generateCandidateId()));
    expect(ids.size).toBe(2000);
  });
});

describe("password strength policy", () => {
  it("accepts a compliant password", () => {
    expect(validatePasswordStrength("Password123!", "user@example.com")).toBeNull();
  });

  it("rejects too-short passwords", () => {
    expect(validatePasswordStrength("Pass1", "user@example.com")).toMatch(/8 characters/);
  });

  it("rejects passwords without a letter", () => {
    expect(validatePasswordStrength("12345678", "user@example.com")).toMatch(/letter/);
  });

  it("rejects passwords without a number", () => {
    expect(validatePasswordStrength("abcdefgh", "user@example.com")).toMatch(/number/);
  });

  it("rejects passwords containing the email username", () => {
    expect(validatePasswordStrength("callme8samay1234", "callme8samay@gmail.com")).toMatch(/email username/);
  });

  it("allows the email username substring in the password when local part is short", () => {
    // Local part shorter than 3 characters is not policed (too many false positives).
    expect(validatePasswordStrength("ab12password", "ab@example.com")).toBeNull();
  });
});

describe("verification tokens", () => {
  it("generates a 64-character hex token", () => {
    expect(generateVerificationToken()).toMatch(/^[0-9a-f]{64}$/);
  });

  it("hashes deterministically and differs per token", () => {
    const t1 = generateVerificationToken();
    const t2 = generateVerificationToken();
    expect(hashToken(t1)).toBe(hashToken(t1));
    expect(hashToken(t1)).not.toBe(hashToken(t2));
    expect(hashToken(t1)).toHaveLength(64);
  });

  it("builds a verification link against the platform URL", () => {
    const original = process.env.PLATFORM_URL;
    process.env.PLATFORM_URL = "https://example.com";
    expect(buildVerificationLink("abc")).toBe("https://example.com/verify-email?token=abc");
    if (original === undefined) delete process.env.PLATFORM_URL;
    else process.env.PLATFORM_URL = original;
    expect(buildVerificationLink("abc")).toContain("/verify-email?token=abc");
  });
});
