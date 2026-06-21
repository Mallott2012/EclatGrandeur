import type { DiamondShape } from '@/types/common';

interface Props {
  shape: DiamondShape;
  size?: number;
  className?: string;
}

// Geometric silhouettes in a 100×100 viewBox — stroke only, no fill.
// Each path traces the characteristic outline of the cut as seen from the table (top) view.
const SHAPE_ELEMENTS: Record<DiamondShape, React.ReactNode> = {
  round: (
    <circle cx="50" cy="50" r="42" />
  ),
  oval: (
    <ellipse cx="50" cy="50" rx="27" ry="43" />
  ),
  princess: (
    <rect x="8" y="8" width="84" height="84" />
  ),
  emerald: (
    // Octagonal, portrait orientation — bevelled corners characterise the emerald cut
    <polygon points="26,6 74,6 94,22 94,78 74,94 26,94 6,78 6,22" />
  ),
  cushion: (
    // Square with generous corner radius
    <rect x="9" y="9" width="82" height="82" rx="17" />
  ),
  pear: (
    // Rounded bottom, pointed tip at top
    <path d="M50,8 C62,8 88,28 88,52 C88,72 72,92 50,92 C28,92 12,72 12,52 C12,28 38,8 50,8 Z" />
  ),
  marquise: (
    // Eye shape — points at east/west, wide belly
    <path d="M6,50 C6,22 26,8 50,8 C74,8 94,22 94,50 C94,78 74,92 50,92 C26,92 6,78 6,50 Z" />
  ),
  radiant: (
    // Rectangular octagon with more angled corners than the emerald
    <polygon points="20,6 80,6 94,20 94,80 80,94 20,94 6,80 6,20" />
  ),
  asscher: (
    // Square octagon — deeper corner cuts than emerald
    <polygon points="30,6 70,6 94,30 94,70 70,94 30,94 6,70 6,30" />
  ),
  heart: (
    <path d="M50,82 C20,62 8,44 8,30 C8,16 18,8 30,8 C38,8 45,12 50,20 C55,12 62,8 70,8 C82,8 92,16 92,30 C92,44 80,62 50,82 Z" />
  ),
};

export function DiamondShapeSvg({ shape, size = 64, className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {SHAPE_ELEMENTS[shape]}
    </svg>
  );
}
