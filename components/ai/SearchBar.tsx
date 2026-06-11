"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchResultAsset {
  id: string;
  title: string;
  description: string | null;
  publicId: string;
  originalSize: string;
  compressedSize: string;
  duration: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  mediaType: string;
  aiDescription: string | null;
  embedding: string | null;
  aiCaptions: unknown;
  qualityScore: number | null;
}

interface SearchBarProps {
  onResults: (results: SearchResultAsset[]) => void;
  onSearchingChange: (isSearching: boolean) => void;
  onError: (message: string | null) => void;
  onTrialExhausted: () => void;
  onClear: () => void;
}

export default function SearchBar({
  onResults,
  onSearchingChange,
  onError,
  onTrialExhausted,
  onClear,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [exhaustedQuery, setExhaustedQuery] = useState<string | null>(null);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setExhaustedQuery(null);
      onSearchingChange(false);
      onError(null);
      onClear();
      return;
    }

    if (exhaustedQuery === trimmedQuery) {
      onSearchingChange(false);
      return;
    }

    onSearchingChange(true);
    onError(null);

    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: trimmedQuery }),
        });
        const data = await response.json();

        if (!response.ok) {
          if (data.error === "TRIAL_EXHAUSTED") {
            setExhaustedQuery(trimmedQuery);
            onTrialExhausted();
            onSearchingChange(false);
            return;
          }

          throw new Error(data.error || "Search failed.");
        }

        onResults(data.results ?? []);
      } catch (searchError) {
        onError(
          searchError instanceof Error ? searchError.message : "Search failed.",
        );
      } finally {
        onSearchingChange(false);
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [
    exhaustedQuery,
    onClear,
    onError,
    onResults,
    onSearchingChange,
    onTrialExhausted,
    query,
  ]);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
          <Input
            value={query}
            onChange={(event) => {
              const nextQuery = event.target.value;
              if (nextQuery.trim() !== exhaustedQuery) {
                setExhaustedQuery(null);
              }
              setQuery(nextQuery);
            }}
            placeholder="Search your images in plain English..."
            className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-neutral-500"
          />
        </div>
        {query ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setExhaustedQuery(null);
              setQuery("");
            }}
            className="border-white/15 bg-transparent text-white hover:bg-white/10"
          >
            <X className="mr-2 size-4" />
            Clear search
          </Button>
        ) : null}
      </div>
    </div>
  );
}
