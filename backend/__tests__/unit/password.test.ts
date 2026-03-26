import { hashPassword, verifyPassword } from "../../src/utils/password";

describe("password utilities", () => {
  it("hashes a password and verifies it", async () => {
    const password = "SuperSecret123!";
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(hash).toMatch(/^\$2[aby]?\$\d{2}\$/);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("produces different hashes for the same password", async () => {
    const hash1 = await hashPassword("SamePass123!");
    const hash2 = await hashPassword("SamePass123!");
    expect(hash1).not.toBe(hash2);
  });
});
