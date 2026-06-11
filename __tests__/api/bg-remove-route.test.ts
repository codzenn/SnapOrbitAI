import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    video: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/cloudinary", () => ({
  getCloudinaryAssetUrl: vi.fn(),
}));

vi.mock("@/lib/trial", () => ({
  getFeatureAccess: vi.fn(),
  markTrialUsed: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCloudinaryAssetUrl } from "@/lib/cloudinary";
import { getFeatureAccess, markTrialUsed } from "@/lib/trial";
import { POST } from "@/app/api/transform/bg-remove/route";

describe("POST /api/transform/bg-remove", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

    const response = await POST(
      new Request("http://localhost/api/transform/bg-remove", {
        method: "POST",
        body: JSON.stringify({ publicId: "asset_123" }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when publicId is missing", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);

    const response = await POST(
      new Request("http://localhost/api/transform/bg-remove", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "publicId is required",
    });
  });

  it("returns 403 when the free background removal trial is exhausted", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(prisma.video.findFirst).mockResolvedValue({
      id: "asset_123",
      publicId: "asset_123",
    } as unknown as Awaited<ReturnType<typeof prisma.video.findFirst>>);
    vi.mocked(getFeatureAccess).mockResolvedValue({
      allowed: false,
      plan: "free",
      remainingUses: 0,
    });

    const response = await POST(
      new Request("http://localhost/api/transform/bg-remove", {
        method: "POST",
        body: JSON.stringify({ publicId: "asset_123" }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "TRIAL_EXHAUSTED",
      feature: "bg-remove",
    });
  });

  it("returns the transformed url and records free-plan usage", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(prisma.video.findFirst).mockResolvedValue({
      id: "asset_123",
      publicId: "asset_123",
    } as unknown as Awaited<ReturnType<typeof prisma.video.findFirst>>);
    vi.mocked(getFeatureAccess).mockResolvedValue({
      allowed: true,
      plan: "free",
      remainingUses: 1,
    });
    vi.mocked(getCloudinaryAssetUrl).mockReturnValue(
      "https://cdn.snaporbit.test/asset_123/bg-removed.png",
    );

    const response = await POST(
      new Request("http://localhost/api/transform/bg-remove", {
        method: "POST",
        body: JSON.stringify({ publicId: "asset_123" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      url: "https://cdn.snaporbit.test/asset_123/bg-removed.png",
    });
    expect(markTrialUsed).toHaveBeenCalledWith("user_123", "bg-remove");
  });

  it("returns 500 when the transformation helper fails", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(prisma.video.findFirst).mockResolvedValue({
      id: "asset_123",
      publicId: "asset_123",
    } as unknown as Awaited<ReturnType<typeof prisma.video.findFirst>>);
    vi.mocked(getFeatureAccess).mockResolvedValue({
      allowed: true,
      plan: "pro",
      remainingUses: null,
    });
    vi.mocked(getCloudinaryAssetUrl).mockImplementation(() => {
      throw new Error("Cloudinary down");
    });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(
      new Request("http://localhost/api/transform/bg-remove", {
        method: "POST",
        body: JSON.stringify({ publicId: "asset_123" }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Background removal failed. Please try again.",
    });

    consoleError.mockRestore();
  });
});
