// ─────────────────────────────────────────────────────────────────────────────
// Procedural diamond geometry.
//
// All shapes live in a 0–100 viewBox centred at (50,50). For every cut we
// expose a single outline `path` (used for both the visible silhouette and the
// SVG clip-path) plus a facet description the renderer paints inside the clip.
// ─────────────────────────────────────────────────────────────────────────────

import type { DiamondShape } from '@/types';

export type Pt = [number, number];

export const SHAPE_PATH: Record<DiamondShape, string> = {
  round: 'M50,4 A46,46 0 1,0 50,96 A46,46 0 1,0 50,4 Z',
  oval: 'M50,4 A30,46 0 1,0 50,96 A30,46 0 1,0 50,4 Z',
  princess: 'M9,9 H91 V91 H9 Z',
  emerald: 'M32,4 H68 L82,18 V82 L68,96 H32 L18,82 V18 Z',
  asscher: 'M30,8 H70 L92,30 V70 L70,92 H30 L8,70 V30 Z',
  radiant: 'M26,6 H74 L88,20 V80 L74,94 H26 L12,80 V20 Z',
  cushion:
    'M24,6 H76 Q94,6 94,24 V76 Q94,94 76,94 H24 Q6,94 6,76 V24 Q6,6 24,6 Z',
  pear: 'M50,4 C58,16 86,30 86,56 C86,78 70,96 50,96 C30,96 14,78 14,56 C14,30 42,16 50,4 Z',
  marquise:
    'M50,4 C66,20 86,38 86,50 C86,62 66,80 50,96 C34,80 14,62 14,50 C14,38 34,20 50,4 Z',
  heart:
    'M50,92 C24,72 8,54 8,32 C8,18 18,8 31,8 C40,8 47,13 50,22 C53,13 60,8 69,8 C82,8 92,18 92,32 C92,54 76,72 50,92 Z',
};

const pts = (arr: Pt[]) => arr.map((p) => `${round(p[0])},${round(p[1])}`).join(' ');
const round = (n: number) => Math.round(n * 100) / 100;

export interface BrilliantFacets {
  type: 'brilliant';
  table: string; // polygon points
  sectors: { quad: string; main: [Pt, Pt]; star: [Pt, Pt] }[];
  highlights: string[]; // a few quads to paint brighter
}

export interface StepFacets {
  type: 'step';
  rings: string[]; // scaled outline paths (concentric)
  table: string; // innermost path
  corners: [Pt, Pt][]; // diagonal corner lines
  highlights: number[]; // indices of rings to brighten
}

export interface PrincessFacets {
  type: 'princess';
  diagonals: [Pt, Pt][];
  table: string;
  chevrons: [Pt, Pt][];
}

export type Facets = BrilliantFacets | StepFacets | PrincessFacets;

const BRILLIANT: DiamondShape[] = ['round', 'oval', 'cushion', 'pear', 'marquise', 'heart'];
const STEP: DiamondShape[] = ['emerald', 'asscher', 'radiant'];

function brilliant(cx = 50, cy = 50, R = 44, rt = 22, n = 8): BrilliantFacets {
  const ang = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2 + Math.PI / n;
  const G: Pt[] = [];
  const T: Pt[] = [];
  for (let i = 0; i < n; i++) {
    G.push([cx + R * Math.cos(ang(i)), cy + R * Math.sin(ang(i))]);
    T.push([cx + rt * Math.cos(ang(i)), cy + rt * Math.sin(ang(i))]);
  }
  const sectors = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    sectors.push({
      quad: pts([G[i], G[j], T[j], T[i]]),
      main: [T[i], G[i]] as [Pt, Pt],
      star: [T[i], G[j]] as [Pt, Pt],
    });
  }
  return {
    type: 'brilliant',
    table: pts(T),
    sectors,
    highlights: [pts([G[5], G[6], T[6], T[5]]), pts([G[6], G[7], T[7], T[6]])],
  };
}

function step(shape: DiamondShape): StepFacets {
  const outline = SHAPE_PATH[shape];
  const scales = [0.78, 0.56, 0.34];
  const rings = scales.map(
    (s) => `M0,0 ${''}` // placeholder replaced below — we use transform instead
  );
  // We render rings by scaling the outline about (50,50); expose scales via data.
  // Corner diagonal lines (the emerald "hall of mirrors").
  const c = 50;
  const r = 40;
  const corners: [Pt, Pt][] = [
    [[c - r, c - r], [c - 14, c - 14]],
    [[c + r, c - r], [c + 14, c - 14]],
    [[c + r, c + r], [c + 14, c + 14]],
    [[c - r, c + r], [c - 14, c + 14]],
  ];
  return {
    type: 'step',
    rings: scales.map(String) as unknown as string[], // scales, consumed by renderer
    table: outline,
    corners,
    highlights: [1],
  };
}

function princess(): PrincessFacets {
  const lo = 9;
  const hi = 91;
  const c = 50;
  const diagonals: [Pt, Pt][] = [
    [[lo, lo], [hi, hi]],
    [[hi, lo], [lo, hi]],
  ];
  const t = 26;
  const table = pts([
    [c, c - t],
    [c + t, c],
    [c, c + t],
    [c - t, c],
  ]);
  const chevrons: [Pt, Pt][] = [
    [[c, lo], [c, c - t]],
    [[hi, c], [c + t, c]],
    [[c, hi], [c, c + t]],
    [[lo, c], [c - t, c]],
  ];
  return { type: 'princess', diagonals, table, chevrons };
}

export function facetsFor(shape: DiamondShape): Facets {
  if (STEP.includes(shape)) return step(shape);
  if (shape === 'princess') return princess();
  // Elongated brilliants get a tighter table so facets radiate convincingly.
  if (shape === 'marquise' || shape === 'pear') return brilliant(50, 50, 44, 18, 8);
  if (shape === 'oval') return brilliant(50, 50, 44, 20, 8);
  return brilliant();
}

export function isBrilliant(shape: DiamondShape) {
  return BRILLIANT.includes(shape) || shape === 'princess';
}
