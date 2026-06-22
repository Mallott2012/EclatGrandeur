'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * A two-thumb range slider built from two overlaid native range inputs.
 * Works in discrete (step) mode for both money and grade-index ranges.
 */
export function RangeSlider({
  min,
  max,
  step = 1,
  valueMin,
  valueMax,
  onChange,
  formatValue,
  ticks,
  className,
}: {
  min: number;
  max: number;
  step?: number;
  valueMin: number;
  valueMax: number;
  onChange: (lo: number, hi: number) => void;
  formatValue?: (v: number) => string;
  /** Optional discrete labels shown under the track (e.g. grade names). */
  ticks?: string[];
  className?: string;
}) {
  const id = useId();
  const span = Math.max(1, max - min);
  const loPct = ((valueMin - min) / span) * 100;
  const hiPct = ((valueMax - min) / span) * 100;

  const setLo = (v: number) => onChange(Math.min(v, valueMax), valueMax);
  const setHi = (v: number) => onChange(valueMin, Math.max(v, valueMin));

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-2 flex items-center justify-between text-[13px] font-semibold text-ink">
        <span>{formatValue ? formatValue(valueMin) : valueMin}</span>
        <span>{formatValue ? formatValue(valueMax) : valueMax}</span>
      </div>

      <div className="relative h-6">
        {/* track */}
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-ivory-deep" />
        {/* active range */}
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-champagne"
          style={{ left: `${loPct}%`, right: `${100 - hiPct}%` }}
        />
        {/* low thumb */}
        <input
          id={`${id}-lo`}
          type="range"
          aria-label="Minimum"
          min={min}
          max={max}
          step={step}
          value={valueMin}
          onChange={(e) => setLo(Number(e.target.value))}
          className="range-thumb absolute inset-x-0 top-0 h-6 w-full appearance-none bg-transparent"
        />
        {/* high thumb */}
        <input
          id={`${id}-hi`}
          type="range"
          aria-label="Maximum"
          min={min}
          max={max}
          step={step}
          value={valueMax}
          onChange={(e) => setHi(Number(e.target.value))}
          className="range-thumb absolute inset-x-0 top-0 h-6 w-full appearance-none bg-transparent"
        />
      </div>

      {ticks && (
        <div className="mt-1 flex justify-between text-[10px] font-medium uppercase tracking-luxe text-ink/40">
          {ticks.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}
