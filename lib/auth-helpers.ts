export function safeRedirectPath(input: string | null | undefined, fallback = "/home") {
  if (!input) return fallback;
  if (!input.startsWith("/")) return fallback;
  if (input.startsWith("//")) return fallback;
  if (input.includes("\\")) return fallback;
  return input;
}

type ClerkErrorItem = {
  message?: string;
  longMessage?: string;
  code?: string;
  meta?: unknown;
};

function isClerkApiErrorLike(err: unknown): err is { errors: ClerkErrorItem[] } {
  if (!err || typeof err !== "object") return false;
  return Array.isArray((err as any).errors);
}

export function clerkErrorToMessage(err: unknown) {
  if (isClerkApiErrorLike(err) && err.errors.length) {
    const first = err.errors[0];
    return first.longMessage || first.message || "Authentication failed";
  }
  if (err instanceof Error) return err.message;
  return "Authentication failed";
}

export function getPasswordRules(password: string) {
  const value = password || "";
  return {
    length: value.length >= 8,
    letter: /[A-Za-z]/.test(value),
    number: /\d/.test(value),
    special: /[^A-Za-z\d]/.test(value),
  };
}

