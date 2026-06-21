import { cn } from '@/lib/utils';

/** A single 4-point sparkle star. */
export function Sparkle({ size = 14, className = '', delay = 0 }: { size?: number; className?: string; delay?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cn('animate-twinkle', className)}
      style={{ animationDelay: `${delay}s` }}
      aria-hidden
    >
      <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill="currentColor" />
    </svg>
  );
}

// Deterministic positions so server and client render identically.
const FIELD = [
  { x: 8, y: 18, s: 16, d: 0 },
  { x: 18, y: 62, s: 10, d: 1.2 },
  { x: 30, y: 30, s: 8, d: 2.1 },
  { x: 44, y: 78, s: 12, d: 0.6 },
  { x: 60, y: 22, s: 9, d: 1.7 },
  { x: 72, y: 58, s: 14, d: 0.3 },
  { x: 84, y: 34, s: 11, d: 2.4 },
  { x: 92, y: 72, s: 8, d: 1 },
  { x: 52, y: 48, s: 7, d: 2.8 },
  { x: 24, y: 86, s: 9, d: 1.5 },
  { x: 66, y: 84, s: 8, d: 0.9 },
  { x: 38, y: 12, s: 10, d: 2.2 },
];

/** Scattered, twinkling sparkles across a container (absolute). */
export function SparkleField({ className = '', color = 'text-champagne/70' }: { className?: string; color?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      {FIELD.map((f, i) => (
        <span key={i} className={cn('absolute', color)} style={{ left: `${f.x}%`, top: `${f.y}%` }}>
          <Sparkle size={f.s} delay={f.d} />
        </span>
      ))}
    </div>
  );
}
