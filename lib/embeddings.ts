import { embeddingModel } from "@/lib/ai";

const LEGACY_EMBEDDING_MODEL = "text-embedding-004";

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!message.includes(LEGACY_EMBEDDING_MODEL)) {
      throw error;
    }

    throw new Error(
      "The configured Gemini embedding model is no longer supported. Update GEMINI_EMBEDDING_MODEL to gemini-embedding-001 or gemini-embedding-2.",
    );
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, value, index) => sum + value * (b[index] ?? 0), 0);
  const magnitudeA = Math.sqrt(
    a.reduce((sum, value) => sum + value * value, 0),
  );
  const magnitudeB = Math.sqrt(
    b.reduce((sum, value) => sum + value * value, 0),
  );

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dot / (magnitudeA * magnitudeB);
}
