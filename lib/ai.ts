import { GoogleGenerativeAI } from "@google/generative-ai";
import { FileState, GoogleAIFileManager } from "@google/generative-ai/server";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "";

export const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey, {
  apiVersion: "v1beta",
});

export const visionModel = process.env.GEMINI_VISION_MODEL ?? "gemini-2.5-flash";
const requestedEmbeddingModel = process.env.GEMINI_EMBEDDING_MODEL?.trim();
export const embeddingModelName =
  !requestedEmbeddingModel || requestedEmbeddingModel === "text-embedding-004"
    ? "gemini-embedding-001"
    : requestedEmbeddingModel;
export const embeddingModel = genAI.getGenerativeModel({
  model: embeddingModelName,
});
export const videoModel = genAI.getGenerativeModel({
  model: visionModel,
  generationConfig: {
    responseMimeType: "application/json",
    maxOutputTokens: 2048,
  },
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getVisionJsonModel() {
  return genAI.getGenerativeModel({
    model: visionModel,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });
}

export function getVisionTextModel() {
  return genAI.getGenerativeModel({
    model: visionModel,
  });
}

export async function uploadVideoToGemini(
  videoBuffer: Buffer,
  mimeType: string,
  displayName: string,
): Promise<string> {
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not configured.");
  }

  const uploadedFile = await fileManager.uploadFile(videoBuffer, {
    mimeType,
    displayName,
  });

  let file = await fileManager.getFile(uploadedFile.file.name);
  let attempts = 0;

  while (file.state === FileState.PROCESSING && attempts < 30) {
    await sleep(2000);
    file = await fileManager.getFile(uploadedFile.file.name);
    attempts += 1;
  }

  if (file.state !== FileState.ACTIVE || !file.uri) {
    throw new Error(
      `Video processing failed${file.error?.message ? `: ${file.error.message}` : "."}`,
    );
  }

  return file.uri;
}

export async function buildVideoPart(
  cloudinaryUrl: string,
  mimeType = "video/mp4",
): Promise<
  | {
      inlineData: {
        mimeType: string;
        data: string;
      };
    }
  | {
      fileData: {
        mimeType: string;
        fileUri: string;
      };
    }
> {
  const response = await fetch(cloudinaryUrl, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Failed to fetch the video for AI analysis.");
  }

  const resolvedMimeType =
    response.headers.get("content-type")?.split(";")[0]?.trim() || mimeType;
  const buffer = Buffer.from(await response.arrayBuffer());
  const fileSizeMB = buffer.length / (1024 * 1024);

  if (fileSizeMB < 100) {
    return {
      inlineData: {
        mimeType: resolvedMimeType,
        data: buffer.toString("base64"),
      },
    };
  }

  const fileUri = await uploadVideoToGemini(
    buffer,
    resolvedMimeType,
    `snaporbit-${Date.now()}`,
  );

  return {
    fileData: {
      mimeType: resolvedMimeType,
      fileUri,
    },
  };
}
