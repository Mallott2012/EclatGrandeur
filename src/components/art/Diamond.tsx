import { SHAPE_PATH, facetsFor } from './geometry';
import { ArtDefs } from './ArtDefs';
import type { DiamondShape } from '@/types';

function Star({ x, y, r, delay = 0 }: { x: number; y: number; r: number; delay?: number }) {
  const i = r * 0.22;
  const d = `M${x},${y - r} L${x + i},${y - i} L${x + r},${y} L${x + i},${y + i} L${x},${y + r} L${x - i},${y + i} L${x - r},${y} L${x - i},${y - i} Z`;
  return (
    <path
      d={d}
      fill="#ffffff"
      className="animate-twinkle"
      style={{ animationDelay: `${delay}s`, transformOrigin: `${x}px ${y}px` }}
    />
  );
}

interface GroupOpts {
  shape: DiamondShape;
  cx: number;
  cy: number;
  size: number;
  gid: string;
  sparkle?: boolean;
}

/** A diamond as a positioned <g>, for composing into a larger piece. */
export function DiamondGroup({ shape, cx, cy, size, gid, sparkle = true }: GroupOpts) {
  const outline = SHAPE_PATH[shape];
  const f = facetsFor(shape);
  const scale = size / 100;
  const clipId = `clip-${gid}`;

  return (
    <g transform={`translate(${cx - size / 2} ${cy - size / 2}) scale(${scale})`}>
      <clipPath id={clipId}>
        <path d={outline} />
      </clipPath>

      {/* Soft cast glow */}
      <path d={outline} fill="#ffffff" opacity="0.12" filter="url(#eg-glow)" />

      {/* Base body */}
      <path d={outline} fill="url(#eg-d-core)" />

      <g clipPath={`url(#${clipId})`}>
        {f.type === 'brilliant' && (
          <>
            {f.sectors.map((s, i) => (
              <polygon
                key={`q${i}`}
                points={s.quad}
                fill="#ffffff"
                opacity={i % 2 === 0 ? 0.1 : 0.02}
              />
            ))}
            {f.highlights.map((h, i) => (
              <polygon key={`h${i}`} points={h} fill="#ffffff" opacity="0.24" />
            ))}
            {f.sectors.map((s, i) => (
              <line
                key={`m${i}`}
                x1={s.main[0][0]}
                y1={s.main[0][1]}
                x2={s.main[1][0]}
                y2={s.main[1][1]}
                stroke="#ffffff"
                strokeOpacity="0.4"
                strokeWidth="0.5"
              />
            ))}
            {f.sectors.map((s, i) => (
              <line
                key={`s${i}`}
                x1={s.star[0][0]}
                y1={s.star[0][1]}
                x2={s.star[1][0]}
                y2={s.star[1][1]}
                stroke="#2c4a58"
                strokeOpacity="0.18"
                strokeWidth="0.3"
              />
            ))}
            <polygon
              points={f.table}
              fill="url(#eg-d-table)"
              stroke="#ffffff"
              strokeOpacity="0.6"
              strokeWidth="0.5"
            />
          </>
        )}

        {f.type === 'step' &&
          f.rings.map((scStr, k) => {
            const sc = Number(scStr);
            return (
              <path
                key={`r${k}`}
                d={SHAPE_PATH[shape]}
                transform={`translate(50 50) scale(${sc}) translate(-50 -50)`}
                fill="#ffffff"
                fillOpacity={f.highlights.includes(k) ? 0.22 : 0.06}
                stroke="#ffffff"
                strokeOpacity="0.4"
                strokeWidth={0.5 / sc}
              />
            );
          })}
        {f.type === 'step' && (
          <>
            {f.corners.map((c, i) => (
              <line
                key={`c${i}`}
                x1={c[0][0]}
                y1={c[0][1]}
                x2={c[1][0]}
                y2={c[1][1]}
                stroke="#ffffff"
                strokeOpacity="0.3"
                strokeWidth="0.4"
              />
            ))}
            <path
              d={SHAPE_PATH[shape]}
              transform="translate(50 50) scale(0.2) translate(-50 -50)"
              fill="url(#eg-d-table)"
            />
          </>
        )}

        {f.type === 'princess' && (
          <>
            {f.diagonals.map((c, i) => (
              <line
                key={`d${i}`}
                x1={c[0][0]}
                y1={c[0][1]}
                x2={c[1][0]}
                y2={c[1][1]}
                stroke="#ffffff"
                strokeOpacity="0.35"
                strokeWidth="0.5"
              />
            ))}
            {f.chevrons.map((c, i) => (
              <line
                key={`v${i}`}
                x1={c[0][0]}
                y1={c[0][1]}
                x2={c[1][0]}
                y2={c[1][1]}
                stroke="#ffffff"
                strokeOpacity="0.25"
                strokeWidth="0.4"
              />
            ))}
            <polygon points={f.table} fill="url(#eg-d-table)" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="0.5" />
          </>
        )}
      </g>

      {/* Crisp outline */}
      <path d={outline} fill="none" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="0.8" />
      <path d={outline} fill="none" stroke="#2c4a58" strokeOpacity="0.22" strokeWidth="0.4" />

      {sparkle && (
        <g>
          <Star x={40} y={32} r={5.5} delay={0} />
          <Star x={63} y={44} r={3.4} delay={1.1} />
          <Star x={47} y={62} r={2.4} delay={2.1} />
        </g>
      )}
    </g>
  );
}

/** Standalone diamond (its own <svg> + defs). */
export function Diamond({
  shape,
  size = 120,
  id = 'd',
  sparkle = true,
  className = '',
}: {
  shape: DiamondShape;
  size?: number;
  id?: string;
  sparkle?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-hidden
    >
      <ArtDefs />
      <DiamondGroup shape={shape} cx={50} cy={50} size={96} gid={id} sparkle={sparkle} />
    </svg>
  );
}

/** Outline-only silhouette, for the builder's shape picker. */
export function DiamondShapeSvg({
  shape,
  size = 56,
  className = '',
}: {
  shape: DiamondShape;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d={SHAPE_PATH[shape]} />
    </svg>
  );
}
