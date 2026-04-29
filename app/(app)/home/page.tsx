"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { filesize } from "filesize";
import { useAuth } from "@clerk/nextjs";
import {
  CircleAlert,
  CloudUpload,
  RefreshCcw,
  Share2,
  VideoIcon,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import VideoCard from "@/components/VideoCard";
import { Video } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function Home() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingStatus, setBillingStatus] = useState<"success" | "cancelled" | null>(null);

  const fetchVideos = useCallback(async () => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      setVideos([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await axios.get("/api/videos", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (Array.isArray(response.data)) {
        setVideos(response.data);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch {
      setError("Failed to fetch videos");
    } finally {
      setLoading(false);
    }
  }, [getToken, isLoaded, isSignedIn]);

  useEffect(() => {
    fetchVideos();
    
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const billing = params.get("billing");
      if (billing === "success") {
        setBillingStatus("success");
      } else if (billing === "cancelled") {
        setBillingStatus("cancelled");
      }
      
      if (billing) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [fetchVideos]);

  const handleDownload = useCallback((url: string, title: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${title}.mp4`);
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const metrics = useMemo(() => {
    const totalOriginal = videos.reduce((sum, video) => sum + Number(video.originalSize), 0);
    const totalCompressed = videos.reduce((sum, video) => sum + Number(video.compressedSize), 0);
    const totalDuration = videos.reduce((sum, video) => sum + video.duration, 0);
    const averageCompression = totalOriginal > 0 ? Math.round(((totalOriginal - totalCompressed) / totalOriginal) * 100) : 0;

    return {
      count: videos.length,
      totalOriginal,
      totalCompressed,
      totalDuration,
      averageCompression,
    };
  }, [videos]);

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
      {billingStatus === "success" && (
        <div className="flex items-start gap-4 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-green-400 shadow-sm">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <div className="flex flex-1 flex-col gap-1">
            <h3 className="font-bold">Subscription updated successfully!</h3>
            <p className="text-sm opacity-90">Your account has been upgraded. You now have access to premium features.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setBillingStatus(null)} className="h-6 w-6 text-green-400 hover:bg-green-500/20">
            <XCircle className="size-4" />
          </Button>
        </div>
      )}

      {billingStatus === "cancelled" && (
        <div className="flex items-start gap-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-yellow-400 shadow-sm">
          <CircleAlert className="mt-0.5 size-5 shrink-0" />
          <div className="flex flex-1 flex-col gap-1">
            <h3 className="font-bold">Payment cancelled</h3>
            <p className="text-sm opacity-90">The checkout process was cancelled. Your subscription has not been changed.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setBillingStatus(null)} className="h-6 w-6 text-yellow-400 hover:bg-yellow-500/20">
            <XCircle className="size-4" />
          </Button>
        </div>
      )}

      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold md:text-3xl">Media library</h2>
          <p className="max-w-2xl text-sm leading-6 text-neutral-400">
            Review uploaded videos, compare compression results, and jump into your next upload or social export.
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
            <Link href="/social-share">
              Social formatter
              <Share2 className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-black/40 border-white/10 text-white backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Library size</CardTitle>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
              <VideoIcon className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="text-3xl font-bold tracking-tight">{metrics.count}</h3>
            <p className="text-xs text-neutral-500 mt-1">Videos currently stored</p>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/10 text-white backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Original footprint</CardTitle>
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
              <CloudUpload className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="text-3xl font-bold tracking-tight">{filesize(metrics.totalOriginal || 0)}</h3>
            <p className="text-xs text-neutral-500 mt-1">Before Cloudinary optimization</p>
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
            <CardTitle className="text-sm font-medium text-neutral-400">Average reduction</CardTitle>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <RefreshCcw className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="text-3xl font-bold tracking-tight text-green-400">{metrics.averageCompression}%</h3>
            <p className="text-xs text-neutral-500 mt-1">{Math.round(metrics.totalDuration / 60)} minutes of video tracked</p>
          </CardContent>
        </Card>
      </section>

      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-400 shadow-sm">
          <div className="flex items-center gap-3">
            <CircleAlert className="size-5" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchVideos} className="border-red-500/30 hover:bg-red-500/20 text-red-400">
            Retry
          </Button>
        </div>
      )}

      {videos.length === 0 ? (
        <Card className="bg-black/40 border-white/10 text-center p-12 text-white backdrop-blur-sm">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-white">
              <VideoIcon className="size-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">No videos uploaded yet</h3>
              <p className="text-base leading-7 text-neutral-400">
                Your dashboard is connected and ready. Upload the first video to populate the media library with real Cloudinary data.
              </p>
            </div>
            <Button asChild className="bg-white text-black hover:bg-neutral-200 mt-4">
              <Link href="/video-upload">Start uploading</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="bg-black/40 border-white/10 p-6 text-white backdrop-blur-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold">Recent uploads</h3>
              <p className="text-sm text-neutral-400 mt-1">Hover over a card to preview the generated Cloudinary clip.</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchVideos} className="gap-2 border-white/20 bg-transparent text-white hover:bg-white/10">
              <RefreshCcw className="size-3.5" />
              Refresh data
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} onDownload={handleDownload} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default Home;