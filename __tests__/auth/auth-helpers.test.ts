import { describe, it, expect } from "vitest";
import { clerkErrorToMessage, getPasswordRules, safeRedirectPath } from "@/lib/auth-helpers";

describe("auth-helpers", () => {
  it("safeRedirectPath returns fallback for unsafe inputs", () => {
    expect(safeRedirectPath(null, "/home")).toBe("/home");
    expect(safeRedirectPath(undefined, "/home")).toBe("/home");
    expect(safeRedirectPath("https://example.com", "/home")).toBe("/home");
    expect(safeRedirectPath("//evil.com", "/home")).toBe("/home");
    expect(safeRedirectPath("\\\\evil", "/home")).toBe("/home");
  });

  it("safeRedirectPath allows app-relative paths", () => {
    expect(safeRedirectPath("/home", "/fallback")).toBe("/home");
    expect(safeRedirectPath("/pricing?x=1", "/fallback")).toBe("/pricing?x=1");
  });

  it("getPasswordRules evaluates basic complexity", () => {
    expect(getPasswordRules("")).toEqual({
      length: false,
      letter: false,
      number: false,
      special: false,
    });
    expect(getPasswordRules("abcd1234")).toEqual({
      length: true,
      letter: true,
      number: true,
      special: false,
    });
    expect(getPasswordRules("Abcd1234!")).toEqual({
      length: true,
      letter: true,
      number: true,
      special: true,
    });
  });

  it("clerkErrorToMessage extracts Clerk-like error payload", () => {
    const msg = clerkErrorToMessage({
      errors: [{ longMessage: "Bad password" }],
    });
    expect(msg).toBe("Bad password");
  });
});

