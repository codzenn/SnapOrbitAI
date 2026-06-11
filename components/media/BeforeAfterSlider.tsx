"use client";

import { useId, useState } from "react";

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
}

export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeAlt,
  afterAlt,
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50);
  const sliderId = useId();

  return (
    <div className="space-y-4">
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black/40">
        <img
          src={beforeSrc}
          alt={beforeAlt}
          className="h-full w-full object-contain"
          draggable={false}
        />

        <div
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${position}%` }}
        >
          <img
            src={afterSrc}
            alt={afterAlt}
            className="h-full w-full object-contain"
            draggable={false}
          />
        </div>

        <div
          className="absolute inset-y-0 z-10"
          style={{ left: `calc(${position}% - 1px)` }}
        >
          <div className="h-full w-0.5 bg-white/90" />
          <div className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/70 text-xs font-semibold text-white shadow-lg backdrop-blur">
            <>
              <span className="mr-0.5">{`<`}</span>
              <span>{`>`}</span>
            </>
          </div>
        </div>

        <div className="absolute left-4 top-4 rounded-full bg-black/65 px-3 py-1 text-xs font-medium text-white backdrop-blur">
          Original
        </div>
        <div className="absolute right-4 top-4 rounded-full bg-black/65 px-3 py-1 text-xs font-medium text-white backdrop-blur">
          Result
        </div>

        <label htmlFor={sliderId} className="sr-only">
          Adjust comparison
        </label>
        <input
          id={sliderId}
          type="range"
          min="0"
          max="100"
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
          aria-label="Adjust before and after comparison"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs text-neutral-400">
        <p>Drag the slider to compare the original asset with the AI result.</p>
        <p className="text-right">{position}% revealed</p>
      </div>
    </div>
  );
}
