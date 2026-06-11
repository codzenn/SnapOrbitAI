"use client";

interface BatchProgressBarProps {
  current: number;
  total: number;
}

export default function BatchProgressBar({
  current,
  total,
}: BatchProgressBarProps) {
  const safeTotal = Math.max(total, 1);
  const percentage = Math.min((current / safeTotal) * 100, 100);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-center justify-between text-sm text-neutral-300">
        <span>
          Processing image {Math.min(current, total)} of {total}...
        </span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-white transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
