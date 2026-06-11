"use client";

import { useMemo, useState } from "react";
import JSZip from "jszip";
import BatchDropzone from "@/components/batch/BatchDropzone";
import BatchOperationSelector, {
  type BatchOperation,
} from "@/components/batch/BatchOperationSelector";
import BatchProgressBar from "@/components/batch/BatchProgressBar";
import BatchResultGrid from "@/components/batch/BatchResultGrid";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UpgradeModal from "@/components/ui/UpgradeModal";

interface UploadedBatchAsset {
  assetId: string;
  public_id: string;
  imageUrl: string;
}

interface BatchResult {
  sourceUrl: string;
  outputUrl: string;
  downloadUrl: string;
  publicId: string;
  title: string;
  fileName: string;
  audit?: {
    overallScore: number;
  };
  captions?: {
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  };
}

export default function BatchProcessPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [operations, setOperations] = useState<BatchOperation[]>([]);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [results, setResults] = useState<BatchResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const canProcess = files.length >= 2 && operations.length > 0 && !isProcessing;

  const helperText = useMemo(() => {
    if (files.length === 0) {
      return "Upload at least 2 images to start a batch job.";
    }

    return `${files.length} images ready for batch processing.`;
  }, [files.length]);

  const handleProcess = async () => {
    setError(null);
    setResults([]);
    setIsProcessing(true);
    setProgress(0);

    try {
      const uploadedAssets: UploadedBatchAsset[] = [];

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const formData = new FormData();
        formData.append("file", file);

        const uploadResponse = await fetch("/api/image-upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || "Failed to upload a batch image.");
        }

        uploadedAssets.push(uploadData);
        setProgress(index + 1);
      }

      const batchResponse = await fetch("/api/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrls: uploadedAssets.map((asset) => asset.imageUrl),
          operations,
          aspectRatio,
        }),
      });
      const batchData = await batchResponse.json();

      if (!batchResponse.ok) {
        if (batchData.error === "TRIAL_EXHAUSTED") {
          setShowUpgradeModal(true);
        }
        throw new Error(
          batchData.message || batchData.error || "Batch processing failed.",
        );
      }

      setProgress(files.length);
      setResults(batchData.results ?? []);
    } catch (processError) {
      setError(
        processError instanceof Error
          ? processError.message
          : "Batch processing failed.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadZip = async () => {
    try {
      setError(null);

      const zip = new JSZip();
      const captionsFile: string[] = [];

      for (const result of results) {
        const response = await fetch(result.downloadUrl, { cache: "no-store" });
        const contentType = response.headers.get("content-type") || "";

        if (!response.ok || !contentType.startsWith("image/")) {
          const errorBody = await response.text();
          throw new Error(
            `Could not download "${result.title}". Cloudinary returned ${
              response.status
            } ${response.statusText}. ${
              errorBody.slice(0, 120) || "The response was not an image file."
            }`,
          );
        }

        const bytes = await response.arrayBuffer();
        zip.file(result.fileName, bytes);

        if (result.captions) {
          captionsFile.push(
            [
              `Asset: ${result.title}`,
              `Instagram: ${result.captions.instagram ?? ""}`,
              `LinkedIn: ${result.captions.linkedin ?? ""}`,
              `Twitter: ${result.captions.twitter ?? ""}`,
              "",
            ].join("\n"),
          );
        }
      }

      if (captionsFile.length > 0) {
        zip.file("captions.txt", captionsFile.join("\n"));
      }

      const archive = await zip.generateAsync({ type: "blob" });
      const downloadUrl = URL.createObjectURL(archive);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "snaporbit-batch-results.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Could not create the ZIP download.",
      );
    }
  };

  return (
    <>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Smart Batch Processor
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-neutral-400">
            Upload multiple images, apply the same AI operations to each one, and
            download the processed results as a ZIP archive.
          </p>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="border-white/10 bg-black/40 text-white backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Batch job setup</CardTitle>
              <CardDescription className="text-neutral-400">
                {helperText}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <BatchDropzone
                files={files}
                disabled={isProcessing}
                onFilesSelected={setFiles}
              />

              <BatchOperationSelector
                operations={operations}
                aspectRatio={aspectRatio}
                disabled={isProcessing}
                onOperationsChange={setOperations}
                onAspectRatioChange={setAspectRatio}
              />

              {error ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                  {error}
                </div>
              ) : null}

              <Button
                type="button"
                onClick={handleProcess}
                disabled={!canProcess}
                className="w-full bg-white text-black hover:bg-neutral-200 disabled:bg-white/20 disabled:text-white/50"
              >
                Process All
              </Button>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-black/40 text-white backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Progress</CardTitle>
              <CardDescription className="text-neutral-400">
                Sequential processing keeps the queue predictable and avoids rate limits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isProcessing ? (
                <BatchProgressBar current={progress} total={files.length} />
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-300">
                  Start a batch job to see live progress here.
                </div>
              )}

              {results.length > 0 ? (
                <BatchResultGrid
                  results={results}
                  onDownloadZip={() => void handleDownloadZip()}
                />
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
      <UpgradeModal
        open={showUpgradeModal}
        featureName="Smart Batch Processor"
        onOpenChange={setShowUpgradeModal}
      />
    </>
  );
}
