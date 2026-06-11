import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="SnapOrbitAI content studio mark"
      className={cn("size-10 shrink-0", className)}
    >
      <rect width="64" height="64" rx="16" fill="#050807" />
      <rect
        x="14"
        y="18"
        width="34"
        height="28"
        rx="7"
        fill="#10231f"
        stroke="#64d6c1"
        strokeWidth="3"
        opacity="0.74"
        transform="rotate(-9 31 32)"
      />
      <rect
        x="18"
        y="17"
        width="36"
        height="30"
        rx="8"
        fill="#64d6c1"
      />
      <path d="M31 27v10l10-5-10-5z" fill="#04100e" />
      <path
        d="M24 39l6-7 6 7 5-5 7 8H24z"
        fill="#9ff3e3"
        opacity="0.68"
      />
      <circle cx="26" cy="25" r="3" fill="#04100e" opacity="0.85" />
      <path
        d="M47 17c4 2 7 6 8 10M49 47c-5 4-13 6-21 4"
        fill="none"
        stroke="#9ff3e3"
        strokeLinecap="round"
        strokeWidth="4"
      />
      <circle cx="49" cy="16" r="5" fill="#9ff3e3" />
      <circle cx="51" cy="47" r="4" fill="#64d6c1" />
    </svg>
  );
}
