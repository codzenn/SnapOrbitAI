"use client";

import { Button } from "@/components/ui/button";

export type BatchOperation = "bg-remove" | "gen-fill" | "audit" | "captions";

interface BatchOperationSelectorProps {
  operations: BatchOperation[];
  aspectRatio: string;
  disabled?: boolean;
  onOperationsChange: (operations: BatchOperation[]) => void;
  onAspectRatioChange: (aspectRatio: string) => void;
}

const OPERATION_OPTIONS: { value: BatchOperation; label: string }[] = [
  { value: "bg-remove", label: "Background removal" },
  { value: "gen-fill", label: "Generative fill" },
  { value: "audit", label: "AI quality audit" },
  { value: "captions", label: "AI captions" },
];

const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:5"];

export default function BatchOperationSelector({
  operations,
  aspectRatio,
  disabled,
  onOperationsChange,
  onAspectRatioChange,
}: BatchOperationSelectorProps) {
  const hasBgRemove = operations.includes("bg-remove");
  const hasGenFill = operations.includes("gen-fill");

  const toggleOperation = (operation: BatchOperation) => {
    if (operations.includes(operation)) {
      onOperationsChange(operations.filter((item) => item !== operation));
      return;
    }

    if (
      (operation === "bg-remove" && hasGenFill) ||
      (operation === "gen-fill" && hasBgRemove)
    ) {
      return;
    }

    onOperationsChange([...operations, operation]);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-sm font-semibold text-white">Choose operations</p>
        {hasBgRemove && hasGenFill ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            Background removal and Generative fill need separate batch runs.
          </div>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          {OPERATION_OPTIONS.map((option) => {
            const isActive = operations.includes(option.value);
            const isBlocked =
              (option.value === "bg-remove" && hasGenFill && !isActive) ||
              (option.value === "gen-fill" && hasBgRemove && !isActive);
            return (
              <button
                key={option.value}
                type="button"
                disabled={disabled || isBlocked}
                onClick={() => toggleOperation(option.value)}
                className={`rounded-2xl border px-4 py-4 text-left text-sm transition ${
                  isActive
                    ? "border-white/30 bg-white/15 text-white"
                    : isBlocked
                      ? "cursor-not-allowed border-white/5 bg-white/[0.03] text-neutral-600"
                    : "border-white/10 bg-white/5 text-neutral-300 hover:bg-white/[0.07]"
                }`}
              >
                <div className="space-y-1">
                  <p>{option.label}</p>
                  {isBlocked ? (
                    <p className="text-xs text-neutral-500">
                      Run separately from the other AI image transform.
                    </p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {operations.includes("gen-fill") ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-white">Aspect ratio</p>
          <div className="flex flex-wrap gap-2">
            {ASPECT_RATIOS.map((ratio) => (
              <Button
                key={ratio}
                type="button"
                disabled={disabled}
                variant={aspectRatio === ratio ? "default" : "outline"}
                onClick={() => onAspectRatioChange(ratio)}
                className={
                  aspectRatio === ratio
                    ? "bg-white text-black hover:bg-neutral-200"
                    : "border-white/15 bg-transparent text-white hover:bg-white/10"
                }
              >
                {ratio}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
