"use client";

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
  };
}

interface BatchResultGridProps {
  results: BatchResult[];
  onDownloadZip: () => void;
}

export default function BatchResultGrid({
  results,
  onDownloadZip,
}: BatchResultGridProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-white">Batch results</p>
          <p className="text-sm text-neutral-400">
            Review the processed outputs and download the ZIP archive.
          </p>
        </div>
        <button
          type="button"
          onClick={onDownloadZip}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-200"
        >
          Download ZIP
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {results.map((result) => (
          <div
            key={result.publicId}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
          >
            <img
              src={result.outputUrl}
              alt={result.title}
              className="aspect-video w-full object-cover"
            />
            <div className="space-y-2 p-4 text-sm text-neutral-300">
              <p className="font-medium text-white">{result.title}</p>
              {result.audit ? (
                <p>Quality score: {result.audit.overallScore}/10</p>
              ) : null}
              {result.captions?.instagram ? (
                <p className="line-clamp-2">{result.captions.instagram}</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
