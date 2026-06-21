import { METAL_SWATCH, type Metal } from '@/types';

const METALS: Metal[] = ['platinum', 'white-gold', 'yellow-gold', 'rose-gold'];

/**
 * Shared gradient + filter definitions for the jewellery engine.
 * IDs are content-addressed, so repeating <ArtDefs/> across many SVGs on one
 * page is harmless — every identical id resolves to an identical definition.
 */
export function ArtDefs() {
  return (
    <defs>
      {METALS.map((m) => {
        const s = METAL_SWATCH[m];
        return (
          <linearGradient key={m} id={`m-${m}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={s.light} />
            <stop offset="42%" stopColor={s.base} />
            <stop offset="70%" stopColor={s.deep} />
            <stop offset="100%" stopColor={s.base} />
          </linearGradient>
        );
      })}
      {METALS.map((m) => {
        const s = METAL_SWATCH[m];
        return (
          <radialGradient key={m} id={`mr-${m}`} cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor={s.light} />
            <stop offset="55%" stopColor={s.base} />
            <stop offset="100%" stopColor={s.deep} />
          </radialGradient>
        );
      })}

      {/* Diamond body — cool brilliant white drifting to glacier blue at the rim */}
      <radialGradient id="eg-d-core" cx="42%" cy="34%" r="72%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="40%" stopColor="#eef6f9" />
        <stop offset="74%" stopColor="#bdd5df" />
        <stop offset="100%" stopColor="#86a7b5" />
      </radialGradient>
      {/* Table (flat top) — brightest plane */}
      <linearGradient id="eg-d-table" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="60%" stopColor="#e6f0f4" />
        <stop offset="100%" stopColor="#c6dae2" />
      </linearGradient>

      {/* Soft halo behind a stone */}
      <filter id="eg-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.4" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Pavé / accent sparkle dot */}
      <radialGradient id="eg-accent" cx="40%" cy="35%" r="70%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="65%" stopColor="#dce9ee" />
        <stop offset="100%" stopColor="#9bb7c4" />
      </radialGradient>
    </defs>
  );
}
