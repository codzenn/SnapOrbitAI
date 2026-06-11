export function isAIProviderUnavailableError(error: unknown) {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";

  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes("quota exceeded") ||
    normalizedMessage.includes("insufficient_quota") ||
    normalizedMessage.includes("resource_exhausted") ||
    normalizedMessage.includes("too many requests") ||
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("429")
  );
}

export function getAIProviderUnavailableMessage(featureName: string) {
  return `${featureName} is temporarily unavailable because the AI provider is rate-limited. Please try again later.`;
}
