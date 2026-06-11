import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { cosineSimilarity, generateEmbedding } from "@/lib/embeddings";
import { getFeatureAccess, markTrialUsed } from "@/lib/trial";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getTextScore(query: string, ...fields: Array<string | null | undefined>) {
  const normalizedQuery = query.toLowerCase();
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const haystack = fields
    .filter((field): field is string => Boolean(field))
    .join(" ")
    .toLowerCase();

  if (!haystack) {
    return 0;
  }

  let score = 0;

  if (haystack.includes(normalizedQuery)) {
    score += 1.5;
  }

  for (const token of tokens) {
    if (!token) {
      continue;
    }

    const matches = haystack.match(new RegExp(escapeRegExp(token), "g")) ?? [];
    score += matches.length * 0.5;
  }

  return score;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query } = await request.json();
    const trimmedQuery = typeof query === "string" ? query.trim() : "";

    if (!trimmedQuery) {
      return NextResponse.json(
        { error: "query is required" },
        { status: 400 },
      );
    }

    const access = await getFeatureAccess(userId, "search");
    if (!access.allowed) {
      return NextResponse.json(
        { error: "TRIAL_EXHAUSTED", feature: "search" },
        { status: 403 },
      );
    }

    const assets = await prisma.video.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let queryEmbedding: number[] | null = null;

    try {
      queryEmbedding = await generateEmbedding(trimmedQuery);
    } catch (embeddingError) {
      console.warn("[Search] falling back to text search:", embeddingError);
    }

    const results = assets
      .map((asset) => {
        const textScore = getTextScore(
          trimmedQuery,
          asset.title,
          asset.description,
          asset.aiDescription,
        );

        let semanticScore = 0;
        if (queryEmbedding && asset.embedding) {
          try {
            semanticScore = cosineSimilarity(
              queryEmbedding,
              JSON.parse(asset.embedding) as number[],
            );
          } catch (parseError) {
            console.warn("[Search] invalid embedding skipped:", parseError);
          }
        }

        return {
          ...asset,
          score: semanticScore > 0 ? semanticScore + textScore * 0.15 : textScore,
          textScore,
          semanticScore,
        };
      })
      .filter((asset) => asset.semanticScore > 0.6 || asset.textScore > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 8);

    if (access.plan === "free") {
      await markTrialUsed(userId, "search");
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[Search] error:", error);
    return NextResponse.json(
      { error: "Search failed. Please try again." },
      { status: 500 },
    );
  }
}
