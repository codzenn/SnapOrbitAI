import { useCallback, useState } from "react";
import { CldImage, getCldVideoUrl } from "next-cloudinary";
import {
  ArrowDownToLine,
  Clock3,
  FileDown,
  FileUp,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { filesize } from "filesize";
import { Video } from "@/generated/prisma/client";

dayjs.extend(relativeTime);

interface VideoCardProps {
  video: Video;
  onDownload: (url: string, title: string) => void;
}

const VideoCard = ({ video, onDownload }: VideoCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const getFullVideoUrl = useCallback((publicId: string) => {
    return getCldVideoUrl({
      src: publicId,
      width: 1920,
      height: 1080,
    });
  }, []);

  const getPreviewVideoUrl = useCallback((publicId: string) => {
    return getCldVideoUrl({
      src: publicId,
      width: 400,
      height: 225,
      rawTransformations: ["e_preview:duration_15:max_seg_9:min_seg_dur_1"],
    });
  }, []);

  const formatSize = useCallback((size: number) => filesize(size), []);

  const formatDuration = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);

    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }, []);

  const originalSize = Number(video.originalSize);
  const compressedSize = Number(video.compressedSize);
  const compressionPercentage =
    originalSize > 0
      ? Math.round((1 - compressedSize / originalSize) * 100)
      : 0;
  const savedBytes = Math.max(originalSize - compressedSize, 0);

  return (
    <article
      className="card overflow-hidden rounded-2xl border border-base-300/70 bg-base-100 shadow-sm transition-all duration-200 hover:border-base-300 hover:shadow-md"
      onMouseEnter={() => {
        setPreviewError(false);
        setIsHovered(true);
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <figure className="relative aspect-video overflow-hidden bg-neutral">
        {isHovered ? (
          previewError ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-neutral text-neutral-content">
              <PlayCircle className="size-10 opacity-70" />
              <p className="text-sm font-medium opacity-70">
                Preview not available
              </p>
            </div>
          ) : (
            <video
              src={getPreviewVideoUrl(video.publicId)}
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
              onError={() => setPreviewError(true)}
            />
          )
        ) : (
          <CldImage
            src={video.publicId}
            width={640}
            height={360}
            crop="fill"
            gravity="auto"
            format="jpg"
            quality="auto"
            assetType="video"
            alt={video.title}
            sizes="(max-width: 1024px) 100vw, 33vw"
            className="h-full w-full object-cover"
            priority
          />
        )}

        <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent p-4 text-white">
          <div className="badge badge-neutral gap-2 border-none bg-black/60 text-white backdrop-blur-md">
            <PlayCircle className="size-4" />
            {isHovered && !previewError ? "Previewing" : "Thumbnail"}
          </div>
          <div className="badge badge-neutral gap-2 border-none bg-black/60 text-white backdrop-blur-md">
            <Clock3 className="size-4" />
            {formatDuration(video.duration)}
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 text-white">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium opacity-90">
              Uploaded {dayjs(video.createdAt).fromNow()}
            </span>
            <span className="font-semibold text-success">{formatSize(savedBytes)} saved</span>
          </div>
        </div>
      </figure>

      <div className="card-body gap-4 p-5">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h2 className="card-title text-base font-semibold leading-6 text-base-content">
              {video.title}
            </h2>
            <div className="badge badge-success badge-sm badge-outline whitespace-nowrap text-[10px] font-bold uppercase tracking-wider">
              {compressionPercentage}% smaller
            </div>
          </div>
          <p className="min-h-10 text-sm leading-6 text-base-content/60">
            {video.description || "No description provided for this upload."}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-base-300/50 bg-base-200/20 p-4 transition-colors hover:bg-base-200/40">
            <div className="mb-2 flex items-center gap-2">
              <span className="badge badge-secondary badge-sm badge-outline text-[10px] font-bold uppercase tracking-wider">
                Original
              </span>
            </div>
            <div className="text-xl font-bold text-secondary">{formatSize(originalSize)}</div>
            <div className="text-xs text-base-content/50 mt-1">
              Before upload optimization
            </div>
          </div>

          <div className="rounded-xl border border-base-300/50 bg-base-200/20 p-4 transition-colors hover:bg-base-200/40">
            <div className="mb-2 flex items-center gap-2">
              <span className="badge badge-accent badge-sm badge-outline text-[10px] font-bold uppercase tracking-wider">
                Compressed
              </span>
            </div>
            <div className="text-xl font-bold text-accent">
              {formatSize(compressedSize)}
            </div>
            <div className="text-xs text-base-content/50 mt-1">
              Cloudinary processed output
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-base-300/50 bg-base-200/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="size-4 text-success" />
              Compression savings
            </p>
          </div>
          <button
            className="btn btn-primary btn-sm rounded-full w-full sm:w-auto"
            onClick={() =>
              onDownload(getFullVideoUrl(video.publicId), video.title)
            }
          >
            <ArrowDownToLine className="size-4" />
            Download
          </button>
        </div>
      </div>
    </article>
  );
};

export default VideoCard;
