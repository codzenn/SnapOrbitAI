import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/auto-logout/route";
import { auth, clerkClient } from "@clerk/nextjs/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}));

describe("Auto logout API", () => {
  const revokeSession = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (clerkClient as any).mockResolvedValue({
      sessions: {
        revokeSession,
      },
    });
  });

  it("returns ok when no session", async () => {
    (auth as any).mockResolvedValue({ sessionId: null });
    const res = await POST();
    expect(res.status).toBe(200);
    expect(revokeSession).not.toHaveBeenCalled();
  });

  it("revokes session when sessionId present", async () => {
    (auth as any).mockResolvedValue({ sessionId: "sess_123" });
    const res = await POST();
    expect(res.status).toBe(200);
    expect(revokeSession).toHaveBeenCalledWith("sess_123");
  });
});

