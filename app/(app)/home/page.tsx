"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { filesize } from "filesize";
import {
  CircleAlert,
  CloudUpload,
  Eraser,
  ImageIcon,
  RefreshCcw,
  Search,
  Sparkles,
} from "lucide-react";
import { Video } from "@/generated/prisma/client";
import SearchBar from "@/components/ai/SearchBar";
import AssetDetailDrawer from "@/components/media/AssetDetailDrawer";
import { getAssetPreviewUrl } from "@/lib/cloudinary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import UpgradeModal from "@/components/ui/UpgradeModal";

type FilterKey = "all" | "images" | "videos" | "high" | "review";
type AssetRecord = Omit<Video, "createdAt" | "updatedAt"> & {
  createdAt: string | Date;
  updatedAt: string | Date;
};
type SearchResultRecord = {
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
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "images", label: "Images" },
  { key: "videos", label: "Videos" },
  { key: "high", label: "High Quality" },
  { key: "review", label: "Needs Review" },
];

function getQualityTone(score: number | null) {
  if (score === null) {
    return "bg-white/10 text-neutral-300 border-white/10";
  }

  if (score >= 8) {
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  }

  if (score >= 5) {
    return "bg-yellow-500/15 text-yellow-300 border-yellow-500/30";
  }

  return "bg-red-500/15 text-red-300 border-red-500/30";
}

function getQualityLabel(score: number | null) {
  if (score === null) {
    return "Audit not run";
  }

  return `Score ${score}`;
}

function Home() {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [searchResults, setSearchResults] = useState<AssetRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trialLocked, setTrialLocked] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [selectedAsset, setSelectedAsset] = useState<AssetRecord | null>(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/videos");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch assets");
      }

      setAssets(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error ? fetchError.message : "Failed to fetch assets",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleSearchResults = useCallback((results: AssetRecord[]) => {
    setTrialLocked(false);
    setSearchResults(results);
  }, []);

  const handleSearchBarResults = useCallback(
    (results: SearchResultRecord[]) => {
      handleSearchResults(results as unknown as AssetRecord[]);
    },
    [handleSearchResults],
  );

  const handleSearchTrialExhausted = useCallback(() => {
    setTrialLocked(true);
    setError(null);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchResults(null);
    setTrialLocked(false);
  }, []);

  const sourceAssets = searchResults ?? assets;
  const filteredAssets = useMemo(() => {
    switch (activeFilter) {
      case "images":
        return sourceAssets.filter((asset) => asset.mediaType === "image");
      case "videos":
        return sourceAssets.filter((asset) => asset.mediaType === "video");
      case "high":
        return sourceAssets.filter((asset) => (asset.qualityScore ?? 0) >= 7);
      case "review":
        return sourceAssets.filter((asset) => (asset.qualityScore ?? 10) < 5);
      default:
        return sourceAssets;
    }
  }, [activeFilter, sourceAssets]);

  const metrics = useMemo(() => {
    const totalOriginal = assets.reduce(
      (sum, asset) => sum + Number(asset.originalSize),
      0,
    );
    const totalCompressed = assets.reduce(
      (sum, asset) => sum + Number(asset.compressedSize),
      0,
    );

    return {
      count: assets.length,
      imageCount: assets.filter((asset) => asset.mediaType === "image").length,
      videoCount: assets.filter((asset) => asset.mediaType === "video").length,
      highQualityCount: assets.filter((asset) => (asset.qualityScore ?? 0) >= 7)
        .length,
      totalOriginal,
      totalCompressed,
    };
  }, [assets]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-3xl bg-neutral-800/50" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} className="h-[420px] rounded-[2rem] bg-neutral-800/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold md:text-3xl">Asset Library</h2>
          <p className="max-w-2xl text-sm leading-6 text-neutral-400">
            Search your uploads in plain English, review AI metadata, and open
            every asset in a dedicated detail drawer.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="gap-2 bg-white text-black hover:bg-neutral-200">
            <Link href="/video-upload">
              New upload
              <CloudUpload className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2 border-white/20 bg-transparent text-white hover:bg-white/10">
            <Link href="/ai-bg-removal">
              Remove background
              <Eraser className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <SearchBar
        onResults={handleSearchBarResults}
        onSearchingChange={setIsSearching}
        onError={setError}
        onTrialExhausted={handleSearchTrialExhausted}
        onClear={handleSearchClear}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-black/40 border-white/10 text-white backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Library size</CardTitle>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
              <Search className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="text-3xl font-bold tracking-tight">{metrics.count}</h3>
            <p className="text-xs text-neutral-500 mt-1">Assets currently stored</p>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/10 text-white backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Images vs videos</CardTitle>
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
              <ImageIcon className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="text-3xl font-bold tracking-tight">
              {metrics.imageCount} / {metrics.videoCount}
            </h3>
            <p className="text-xs text-neutral-500 mt-1">Images and videos in your library</p>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/10 text-white backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Compressed footprint</CardTitle>
            <div className="rounded-lg bg-green-500/10 p-2 text-green-400">
              <RefreshCcw className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="text-3xl font-bold tracking-tight">{filesize(metrics.totalCompressed || 0)}</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Saved <span className="font-medium text-green-400">{filesize(Math.max(metrics.totalOriginal - metrics.totalCompressed, 0))}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/10 text-white backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">High quality assets</CardTitle>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <Sparkles className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="text-3xl font-bold tracking-tight text-green-400">
              {metrics.highQualityCount}
            </h3>
            <p className="text-xs text-neutral-500 mt-1">Assets with quality score 7 or above</p>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-wrap gap-3">
        {FILTERS.map((filter) => (
          <Button
            key={filter.key}
            type="button"
            variant={activeFilter === filter.key ? "default" : "outline"}
            onClick={() => setActiveFilter(filter.key)}
            className={
              activeFilter === filter.key
                ? "bg-white text-black hover:bg-neutral-200"
                : "border-white/15 bg-transparent text-white hover:bg-white/10"
            }
          >
            {filter.label}
          </Button>
        ))}
      </section>

      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-400 shadow-sm">
          <div className="flex items-center gap-3">
            <CircleAlert className="size-5" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAssets} className="border-red-500/30 hover:bg-red-500/20 text-red-400">
            Retry
          </Button>
        </div>
      )}

      {isSearching ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <Skeleton
              key={index}
              className="h-[320px] rounded-[2rem] bg-neutral-800/50"
            />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <Card className="bg-black/40 border-white/10 text-center p-12 text-white backdrop-blur-sm">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-white">
              <ImageIcon className="size-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">No assets uploaded yet</h3>
              <p className="text-base leading-7 text-neutral-400">
                Upload your first image to start generating captions, quality
                audits, and searchable asset metadata.
              </p>
            </div>
            <Button asChild className="bg-white text-black hover:bg-neutral-200 mt-4">
              <Link href="/video-upload">Start uploading</Link>
            </Button>
          </div>
        </Card>
      ) : filteredAssets.length === 0 ? (
        <Card className="bg-black/40 border-white/10 p-12 text-center text-white backdrop-blur-sm">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-white">
              <Search className="size-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">No matching assets found</h3>
              <p className="text-base leading-7 text-neutral-400">
                No matching images found. Try describing what&apos;s in the image
                - colors, subjects, or mood.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="bg-black/40 border-white/10 p-6 text-white backdrop-blur-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold">Your assets</h3>
              <p className="text-sm text-neutral-400 mt-1">
                Click any card to open the detail drawer with AI captions and
                quality metadata.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchAssets} className="gap-2 border-white/20 bg-transparent text-white hover:bg-white/10">
              Refresh data
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
            {filteredAssets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => setSelectedAsset(asset)}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-left transition hover:border-white/20 hover:bg-white/[0.07]"
              >
                <div className="relative aspect-video overflow-hidden bg-black/30">
                  {asset.mediaType === "video" ? (
                    <video
                      src={getAssetPreviewUrl(asset.publicId, asset.mediaType)}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={getAssetPreviewUrl(asset.publicId, asset.mediaType)}
                      alt={asset.title}
                      className="h-full w-full object-cover"
                    />
                  )}

                  <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                    <div className="rounded-full bg-black/65 px-3 py-1 text-xs font-medium text-white">
                      {asset.mediaType}
                    </div>
                    <div
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${getQualityTone(
                        asset.qualityScore,
                      )}`}
                    >
                      {getQualityLabel(asset.qualityScore)}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 p-5">
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-white">
                      {asset.title}
                    </p>
                    <p className="line-clamp-2 text-sm leading-6 text-neutral-400">
                      {asset.aiDescription ||
                        asset.description ||
                        "No AI description stored for this asset yet."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>{filesize(Number(asset.compressedSize || 0))}</span>
                    <span>
                      {asset.aiCaptions
                        ? "Captions ready"
                        : "Captions not generated"}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      <AssetDetailDrawer
        asset={selectedAsset}
        open={Boolean(selectedAsset)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAsset(null);
          }
        }}
      />
      <UpgradeModal
        open={trialLocked}
        featureName="Natural Language Search"
        onOpenChange={setTrialLocked}
      />
    </div>
  );
}

export default Home;
