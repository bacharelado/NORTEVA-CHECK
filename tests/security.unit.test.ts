import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../lib/password";
import { hasValidSameOrigin } from "../lib/csrf";

describe("security primitives", () => {
  it("does not store a password in plaintext and verifies only the original", async () => {
    const password = "a-strong-test-password-123";
    const hash = await hashPassword(password);
    expect(hash).not.toContain(password);
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("requires an explicit same-origin request for state changes", () => {
    expect(hasValidSameOrigin(new Request("https://app.example/api/action", { method: "POST", headers: { origin: "https://app.example" } }))).toBe(true);
    expect(hasValidSameOrigin(new Request("https://app.example/api/action", { method: "POST", headers: { origin: "https://evil.example" } }))).toBe(false);
    expect(hasValidSameOrigin(new Request("https://app.example/api/action", { method: "POST" }))).toBe(false);
  });
});
