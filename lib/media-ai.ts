import { generateEmbedding } from "@/lib/embeddings";
import { getVisionJsonModel, getVisionTextModel } from "@/lib/ai";

export interface CaptionResult {
  instagram: string;
  linkedin: string;
  twitter: string;
  hashtags: {
    high: string[];
    medium: string[];
    niche: string[];
  };
}

export interface AuditResult {
  overallScore: number;
  composition: number;
  brightness: "too dark" | "good" | "too bright";
  blur: "sharp" | "slightly blurry" | "blurry";
  platformSuitability: {
    instagram: boolean;
    linkedin: boolean;
    twitter: boolean;
  };
  topIssue: string;
  tip: string;
}

const CAPTION_PROMPT = `
You are a social media expert. Analyze this image and generate captions.
Return ONLY valid JSON, no extra text, in exactly this shape:
{
  "instagram": "casual caption with emojis, max 150 chars",
  "linkedin": "professional caption no emojis, max 200 chars",
  "twitter": "punchy caption under 260 chars with 1-2 inline hashtags",
  "hashtags": {
    "high": ["tag1","tag2","tag3","tag4","tag5"],
    "medium": ["tag1","tag2","tag3","tag4","tag5"],
    "niche": ["tag1","tag2","tag3","tag4","tag5"]
  }
}
`;

const AUDIT_PROMPT = `
Analyze this image and return ONLY valid JSON, no extra text:
{
  "overallScore": 8,
  "composition": 8,
  "brightness": "good",
  "blur": "sharp",
  "platformSuitability": {
    "instagram": true,
    "linkedin": true,
    "twitter": true
  },
  "topIssue": "Image looks great",
  "tip": "Keep the subject framing consistent for reuse across channels."
}
`;

const DESCRIPTION_PROMPT = `
Describe this image in 2-3 sentences. Focus on the main subject, colors, mood,
objects present, and the best use case for this image.
`;

export function parseJsonResponse<T>(responseText: string): T {
  const cleaned = responseText
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  return JSON.parse(cleaned) as T;
}

async function getInlineImagePart(imageUrl: string) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error("Failed to fetch the image for AI analysis.");
  }

  const mimeType = response.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    inlineData: {
      mimeType,
      data: buffer.toString("base64"),
    },
  };
}

async function generateVisionJson<T>(imageUrl: string, prompt: string): Promise<T> {
  const model = getVisionJsonModel();
  const imagePart = await getInlineImagePart(imageUrl);
  const result = await model.generateContent([prompt, imagePart]);

  return parseJsonResponse<T>(result.response.text());
}

export async function generateCaptionsFromImage(
  imageUrl: string,
): Promise<CaptionResult> {
  return generateVisionJson<CaptionResult>(imageUrl, CAPTION_PROMPT);
}

export async function generateAuditFromImage(
  imageUrl: string,
): Promise<AuditResult> {
  return generateVisionJson<AuditResult>(imageUrl, AUDIT_PROMPT);
}

export async function generateDescriptionAndEmbedding(imageUrl: string) {
  const model = getVisionTextModel();
  const imagePart = await getInlineImagePart(imageUrl);
  const result = await model.generateContent([DESCRIPTION_PROMPT, imagePart]);
  const description = result.response.text().trim();
  const embedding = await generateEmbedding(description);

  return {
    description,
    embedding,
  };
}
