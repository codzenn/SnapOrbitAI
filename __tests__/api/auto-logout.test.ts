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
    vi.mocked(clerkClient).mockResolvedValue({
      sessions: {
        revokeSession,
      },
    } as unknown as Awaited<ReturnType<typeof clerkClient>>);
  });

  it("returns ok when no session", async () => {
    vi.mocked(auth).mockResolvedValue({ sessionId: null } as Awaited<ReturnType<typeof auth>>);
    const res = await POST();
    expect(res.status).toBe(200);
    expect(revokeSession).not.toHaveBeenCalled();
  });

  it("revokes session when sessionId present", async () => {
    vi.mocked(auth).mockResolvedValue({ sessionId: "sess_123" } as Awaited<ReturnType<typeof auth>>);
    const res = await POST();
    expect(res.status).toBe(200);
    expect(revokeSession).toHaveBeenCalledWith("sess_123");
  });
});
