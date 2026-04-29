"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  Download,
  Video as VideoIcon,
  Scissors,
  Sparkles,
  Wand2,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getCldVideoUrl } from "next-cloudinary";

export default function AIReelExtraction() {
  const { user, isLoaded } = useUser();
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const plan = user?.publicMetadata?.plan as string;
  const isProduction = plan === "pro_plus";

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsUploading(true);
    setError(null);
    setUploadedVideo(null);
    setPreviewUrl(null);
    setIsGenerating(false);
    setRetryCount(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", `Reel Source: ${file.name}`);
    formData.append("description", "Uploaded for AI Reel Extraction");
    formData.append("originalSize", file.size.toString());
    formData.append("isReel", "true");

    await processUpload(formData);
  };

  const processUpload = async (formData: FormData) => {
    try {
      const response = await fetch("/api/video-upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process video");
      }

      setUploadedVideo(data.publicId);
      
      // Directly use the eager-generated reel URL returned by the backend
      // and ensure we clear any previous errors
      if (data.reelUrl) {
        setError(null);
        setPreviewUrl(data.reelUrl);
        setIsGenerating(true);
        setRetryCount(0);
      }
    } catch (err: any) {
      setError(err.message || "Video processing failed. Please try again.");
      setIsGenerating(false);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    // We only set the URL if we have an uploaded video.
    // We no longer rely on `previewUrl` being set here to avoid overwriting a server-provided eager URL,
    // but since we reverted eager loading, we construct it client-side.
    if (uploadedVideo && !previewUrl) {
      const url = `https://res.cloudinary.com/${
        process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      }/video/upload/c_fill,g_auto,h_1280,w_720,q_auto:eco,f_mp4/e_preview:duration_15/${uploadedVideo}.mp4`;
      
      setError(null);
      setPreviewUrl(url);
      setIsGenerating(true);
      setRetryCount(0);
    }
  }, [uploadedVideo, previewUrl]);

  const handleVideoDownload = () => {
    if (!uploadedVideo || !previewUrl) return;

    // Use fl_attachment to force download instead of opening in a new tab
    const downloadUrl = previewUrl.includes('fl_attachment') 
      ? previewUrl 
      : previewUrl.replace('/video/upload/', '/video/upload/fl_attachment/');

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `reel-${fileName || "highlight"}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="container mx-auto max-w-5xl px-4 py-[clamp(1rem,3vw,2rem)] text-white" aria-labelledby="page-title">
      <header className="mb-[clamp(1.5rem,4vw,2rem)]">
        <h1 id="page-title" className="text-[clamp(1.75rem,5vw,2.25rem)] font-extrabold tracking-tight leading-tight">
          AI Reel Extraction
        </h1>
        <p className="mt-2 text-[clamp(1rem,2vw,1.125rem)] text-neutral-400 max-w-3xl">
          Upload a long video and let Cloudinary AI automatically extract the best 15-second highlight clip perfectly cropped for TikTok, Shorts, and Reels.
        </p>
      </header>

      <div className="grid gap-[clamp(1.5rem,4vw,2rem)] lg:grid-cols-[1fr_380px]">
        <section aria-label="Video Preview" className="flex flex-col">
          <div className="flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm relative min-h-[min(600px,70vh)] w-full">
            {previewUrl ? (
              <div className="relative w-full h-full flex items-center justify-center bg-black/80">
                {isGenerating && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                    <Loader2 className="size-10 animate-spin text-white mb-4" aria-hidden="true" />
                    <p className="text-white font-medium text-center px-4">AI is generating your highlight reel...</p>
                    <p className="text-white/60 text-sm mt-2 text-center px-4">
                      This can take a few minutes. Ensure your video is under 10 mins and contains audio.
                    </p>
                  </div>
                )}
                <video
                  key={`${previewUrl}-${retryCount}`}
                  ref={videoRef}
                  src={previewUrl ? `${previewUrl}?retry=${retryCount}` : undefined}
                  controls={!isGenerating}
                  autoPlay
                  loop
                  muted
                  onCanPlay={() => setIsGenerating(false)}
                  onError={(e) => {
                    // Only log a simple message to avoid serializing the SyntheticEvent 
                    // which triggers Next.js 15 'params' enumeration warnings
                    console.log("Video load error, retrying...", retryCount);
                    
                    // The video might take several minutes to generate. Give it plenty of retries.
                    if (retryCount < 100) {
                      setTimeout(() => {
                        // We trick React into re-rendering the video by updating the key
                        setRetryCount(prev => prev + 1);
                      }, 8000);
                    } else {
                      setIsGenerating(false);
                      setError("Failed to generate preview. The video might be too long or unsupported.");
                    }
                  }}
                  className="max-h-[600px] w-auto max-w-full rounded-lg shadow-2xl"
                />
              </div>
            ) : (
              <div className="text-center p-[clamp(1rem,4vw,2rem)]">
                <Scissors className="mx-auto mb-4 size-[clamp(2.5rem,5vw,3rem)] text-neutral-600" aria-hidden="true" />
                <p className="text-[clamp(1rem,1.5vw,1.125rem)] font-medium text-neutral-500">
                  Upload a video to magically extract highlights
                </p>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-[clamp(1rem,3vw,1.5rem)]" aria-label="Extraction Controls">
          <Card className="bg-[#050505] border-white/20 text-white rounded-[24px] shadow-2xl">
            <CardContent className="p-[clamp(1.25rem,4vw,1.75rem)]">
              {!isProduction && isLoaded && (
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-center mb-6">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                    <Wand2 className="size-5" />
                  </div>
                  <p className="text-sm font-bold text-white">Production Plan Required</p>
                  <p className="mt-1 text-xs text-neutral-300">
                    Unlock AI Reel Extraction with the Production plan.
                  </p>
                  <Button asChild size="sm" className="mt-3 bg-white text-black hover:bg-neutral-200">
                    <Link href="/pricing">Upgrade to Production</Link>
                  </Button>
                </div>
              )}

              <div className={`space-y-6 ${!isProduction ? "opacity-50 pointer-events-none" : ""}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-white">
                    <VideoIcon className="size-5" aria-hidden="true" />
                    <h2 className="text-xl font-bold">Source video</h2>
                  </div>
                  
                  {fileName && (
                    <Button variant="outline" size="sm" className="bg-[#1f1f1f] text-white hover:bg-[#2a2a2a] border border-white/10 min-h-[44px] min-w-[44px]" onClick={() => {
                      setFileName("");
                      setPreviewUrl(null);
                      setUploadedVideo(null);
                      setError(null);
                    }} aria-label="Change source video">
                      Change
                    </Button>
                  )}
                </div>

                {!fileName ? (
                  <div className="w-full flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="relative shrink-0">
                        <Button 
                          type="button"
                          variant="outline"
                          disabled={isUploading}
                          className="bg-[#1f1f1f] text-white hover:bg-[#2a2a2a] border border-white/10 px-6 min-h-[48px] rounded-xl transition-colors font-medium w-[140px]"
                        >
                          Choose file
                        </Button>
                        <Input
                          type="file"
                          accept="video/*"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          aria-label="Upload local video file"
                        />
                      </div>
                      <div className="flex-1 text-sm text-neutral-400 text-right truncate">
                        No file chosen
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4 mt-4">
                    <div className="relative shrink-0">
                      <Button 
                        type="button"
                        variant="outline"
                        disabled={true}
                        className="bg-[#1f1f1f] text-white hover:bg-[#2a2a2a] border border-white/10 px-6 min-h-[48px] rounded-xl font-medium w-[140px] opacity-50"
                      >
                        Choose file
                      </Button>
                    </div>
                    <div className="flex-1 text-sm text-white text-right truncate">
                      {fileName}
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-white/5 bg-[#161616] p-[clamp(1rem,3vw,1.25rem)]">
                  <div className="mb-3 flex items-center gap-2 text-white">
                    <Sparkles className="size-5" aria-hidden="true" />
                    <p className="font-bold text-white">AI Highlights</p>
                  </div>
                  <p className="text-[clamp(0.875rem,1.5vw,0.9375rem)] leading-relaxed text-neutral-400">
                    The AI analyzes audio and visual action to generate a 15-second 9:16 vertical highlight reel suitable for social platforms.
                  </p>
                </div>

                {error && (
                  <div role="alert" aria-live="assertive" className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                {isUploading && (
                  <div role="status" aria-live="polite" className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-sm text-blue-400 flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Uploading & Analyzing video...
                  </div>
                )}

                {previewUrl && !isGenerating && !error && (
                  <div role="status" aria-live="polite" className="rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400 flex items-center gap-2 mb-4">
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    Reel generated successfully!
                  </div>
                )}

                <Button
                  onClick={handleVideoDownload}
                  disabled={!previewUrl || isUploading || isGenerating || !!error}
                  className="w-full bg-[#1f1f1f] text-white hover:bg-[#2a2a2a] disabled:bg-[#121212] disabled:text-[#333333] min-h-[48px] rounded-2xl font-medium transition-colors"
                >
                  <Download className="mr-2 size-4" aria-hidden="true" /> Download Reel
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}