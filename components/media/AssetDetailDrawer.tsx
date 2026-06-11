"use client";

import Link from "next/link";
import { Download, ExternalLink, ImageIcon, VideoIcon } from "lucide-react";
import type { Video } from "@/generated/prisma/client";
import { getAssetDownloadUrl, getAssetPreviewUrl } from "@/lib/cloudinary";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface CaptionShape {
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  hashtags?: {
    high?: string[];
    medium?: string[];
    niche?: string[];
  };
}

interface AssetDetailDrawerProps {
  asset:
    | (Omit<Video, "createdAt" | "updatedAt"> & {
        createdAt: string | Date;
        updatedAt: string | Date;
      })
    | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

export default function AssetDetailDrawer({
  asset,
  open,
  onOpenChange,
}: AssetDetailDrawerProps) {
  const captions = (asset?.aiCaptions as CaptionShape | null) ?? null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-2xl overflow-y-auto border-white/10 bg-black text-white"
      >
        <SheetHeader className="border-b border-white/10">
          <SheetTitle className="text-white">
            {asset?.title ?? "Asset details"}
          </SheetTitle>
          <SheetDescription className="text-neutral-400">
            Review the asset, AI captions, and quality metadata.
          </SheetDescription>
        </SheetHeader>

        {asset ? (
          <div className="space-y-6 p-4">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              {asset.mediaType === "video" ? (
                <video
                  src={getAssetPreviewUrl(asset.publicId, asset.mediaType)}
                  controls
                  className="h-full w-full"
                />
              ) : (
                <img
                  src={getAssetPreviewUrl(asset.publicId, asset.mediaType)}
                  alt={asset.title}
                  className="h-full w-full object-contain"
                />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-neutral-300">
                {asset.mediaType === "video" ? (
                  <VideoIcon className="size-4" />
                ) : (
                  <ImageIcon className="size-4" />
                )}
                {asset.mediaType}
              </div>
              <div
                className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${getQualityTone(
                  asset.qualityScore,
                )}`}
              >
                {asset.qualityScore !== null
                  ? `Quality score: ${asset.qualityScore}/10`
                  : "Quality score pending"}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button asChild className="bg-white text-black hover:bg-neutral-200">
                <a
                  href={getAssetDownloadUrl(asset.publicId, asset.mediaType)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download className="mr-2 size-4" />
                  Download asset
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/15 bg-transparent text-white hover:bg-white/10"
              >
                <Link href="/video-upload">
                  <ExternalLink className="mr-2 size-4" />
                  Upload another
                </Link>
              </Button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="mb-2 text-sm font-semibold text-white">
                AI description
              </p>
              <p className="text-sm leading-6 text-neutral-300">
                {asset.aiDescription || "No AI description stored for this asset yet."}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="mb-3 text-sm font-semibold text-white">AI captions</p>
              {captions ? (
                <div className="space-y-3 text-sm text-neutral-300">
                  <div>
                    <p className="font-medium text-white">Instagram</p>
                    <p className="mt-1 leading-6">{captions.instagram}</p>
                  </div>
                  <div>
                    <p className="font-medium text-white">LinkedIn</p>
                    <p className="mt-1 leading-6">{captions.linkedin}</p>
                  </div>
                  <div>
                    <p className="font-medium text-white">Twitter</p>
                    <p className="mt-1 leading-6">{captions.twitter}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-neutral-400">
                  No cached captions for this asset yet.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
