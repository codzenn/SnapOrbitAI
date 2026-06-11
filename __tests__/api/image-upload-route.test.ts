import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

const { uploadStream, cloudinaryConfig } = vi.hoisted(() => ({
  uploadStream: vi.fn(),
  cloudinaryConfig: vi.fn(),
}));

vi.mock("cloudinary", () => ({
  v2: {
    config: cloudinaryConfig,
    uploader: {
      upload_stream: uploadStream,
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    video: {
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/media-ai", () => ({
  generateDescriptionAndEmbedding: vi.fn(),
}));

vi.mock("@/lib/trial", () => ({
  getAssetLibraryLimit: vi.fn(),
  getUserPlan: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getAssetLibraryLimit, getUserPlan } from "@/lib/trial";
import { POST } from "@/app/api/image-upload/route";

describe("POST /api/image-upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

    const formData = new FormData();
    formData.append("file", new File(["demo"], "demo.png", { type: "image/png" }));

    const response = await POST(
      new Request("http://localhost/api/image-upload", {
        method: "POST",
        body: formData,
      }) as never,
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 403 when the free asset library limit is reached", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(getUserPlan).mockResolvedValue("free");
    vi.mocked(getAssetLibraryLimit).mockReturnValue(5);
    vi.mocked(prisma.video.count).mockResolvedValue(5);

    const formData = new FormData();
    formData.append("file", new File(["demo"], "demo.png", { type: "image/png" }));

    const response = await POST(
      new Request("http://localhost/api/image-upload", {
        method: "POST",
        body: formData,
      }) as never,
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Free plan users can store up to 5 assets. Upgrade to keep uploading.",
    });
    expect(uploadStream).not.toHaveBeenCalled();
  });

  it("returns 403 when the pro asset library limit is reached", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(getUserPlan).mockResolvedValue("pro");
    vi.mocked(getAssetLibraryLimit).mockReturnValue(500);
    vi.mocked(prisma.video.count).mockResolvedValue(500);

    const formData = new FormData();
    formData.append("file", new File(["demo"], "demo.png", { type: "image/png" }));

    const response = await POST(
      new Request("http://localhost/api/image-upload", {
        method: "POST",
        body: formData,
      }) as never,
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Pro plan users can store up to 500 assets. Upgrade to Business for unlimited storage.",
    });
    expect(uploadStream).not.toHaveBeenCalled();
  });
});
