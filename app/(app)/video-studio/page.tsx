"use client";

import { useRef, useState } from "react";
import { filesize } from "filesize";
import { CircleAlert, Film, UploadCloud } from "lucide-react";
import VideoAnalysisPanel from "@/components/video/VideoAnalysisPanel";
import VideoCaptionPanel from "@/components/video/VideoCaptionPanel";
import VideoConverterPanel from "@/components/video/VideoConverterPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ActiveTab = "analyze" | "captions" | "convert";

interface UploadedVideoState {
  id: string;
  publicId: string;
  url: string;
  name: string;
  size: number;
  mimeType: string;
  duration: number;
}

export default function VideoStudioPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [uploadedVideo, setUploadedVideo] = useState<UploadedVideoState | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("analyze");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSeek = (seconds: number) => {
    if (!videoRef.current) {
      return;
    }

    videoRef.current.currentTime = seconds;
    void videoRef.current.play();
  };

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("video/")) {
      setError("Please choose an MP4, MOV, or WebM video.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const response = await fetch("/api/videos/upload", {
        method: "POST",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          "X-File-Name": encodeURIComponent(file.name),
          "X-File-Size": String(file.size),
        },
        body: file,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Video upload failed.");
      }

      setUploadedVideo({
        id: data.id,
        publicId: data.publicId,
        url: data.url,
        name: file.name,
        size: file.size,
        mimeType: file.type || "video/mp4",
        duration: Number(data.duration) || 0,
      });
      setActiveTab("analyze");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Video upload failed.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h2 className="text-2xl font-semibold md:text-3xl">Video Studio</h2>
        <p className="max-w-3xl text-sm leading-6 text-neutral-400">
          Upload one video and run AI analysis, audio-aware caption generation,
          and platform-ready conversions from a shared workspace.
        </p>
      </section>

      {!uploadedVideo ? (
        <Card className="border-white/10 bg-black/40 text-white backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Upload a video</CardTitle>
            <CardDescription className="text-neutral-400">
              Supported formats: MP4, MOV, WebM. Upload once, then switch
              between analysis, captions, and converter tools.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error ? (
              <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
                <CircleAlert className="size-5 shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            ) : null}

            <label
              className="flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/15 bg-white/5 px-6 text-center transition hover:border-white/30 hover:bg-white/10"
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files?.[0];
                if (file) {
                  void uploadFile(file);
                }
              }}
              onDragOver={(event) => event.preventDefault()}
            >
              <Input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void uploadFile(file);
                  }
                }}
              />
              <div className="rounded-2xl bg-white/10 p-4 text-white">
                <Film className="size-8" />
              </div>
              <p className="mt-5 text-lg font-semibold text-white">
                {isUploading ? "Uploading video..." : "Drop a video here or click to choose one"}
              </p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-400">
                Gemini analyzes the full video, including audio, and Cloudinary
                powers conversion outputs for compression and aspect ratio.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs text-neutral-300">
                <UploadCloud className="size-4" />
                Max 500MB recommended for the best AI response time
              </div>
            </label>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_1.05fr]">
          <Card className="border-white/10 bg-black/40 text-white backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl">Preview</CardTitle>
              <CardDescription className="text-neutral-400">
                Shared player for every video tool in this workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <video
                ref={videoRef}
                src={uploadedVideo.url}
                controls
                className="w-full rounded-[1.5rem] bg-black"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                    File
                  </p>
                  <p className="mt-2 break-all text-sm font-semibold text-white">
                    {uploadedVideo.name}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                    Size
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {filesize(uploadedVideo.size)}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setUploadedVideo(null);
                  setError(null);
                }}
                className="border-white/15 bg-transparent text-white hover:bg-white/10"
              >
                Upload a different video
              </Button>
            </CardContent>
          </Card>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as ActiveTab)}
            className="space-y-4"
          >
            <TabsList className="grid w-full grid-cols-3 bg-white/5">
              <TabsTrigger
                value="analyze"
                className="text-neutral-300 data-active:bg-white/15 data-active:text-white hover:text-white dark:data-active:bg-white/15 dark:data-active:text-white"
              >
                Analyze
              </TabsTrigger>
              <TabsTrigger
                value="captions"
                className="text-neutral-300 data-active:bg-white/15 data-active:text-white hover:text-white dark:data-active:bg-white/15 dark:data-active:text-white"
              >
                Captions
              </TabsTrigger>
              <TabsTrigger
                value="convert"
                className="text-neutral-300 data-active:bg-white/15 data-active:text-white hover:text-white dark:data-active:bg-white/15 dark:data-active:text-white"
              >
                Convert
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analyze">
              <VideoAnalysisPanel
                videoUrl={uploadedVideo.url}
                videoId={uploadedVideo.id}
                mimeType={uploadedVideo.mimeType}
                onSeek={handleSeek}
              />
            </TabsContent>

            <TabsContent value="captions">
              <VideoCaptionPanel
                videoUrl={uploadedVideo.url}
                videoId={uploadedVideo.id}
                mimeType={uploadedVideo.mimeType}
              />
            </TabsContent>

            <TabsContent value="convert">
              <VideoConverterPanel
                videoUrl={uploadedVideo.url}
                videoId={uploadedVideo.id}
                cloudinaryPublicId={uploadedVideo.publicId}
                originalSizeBytes={uploadedVideo.size}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
