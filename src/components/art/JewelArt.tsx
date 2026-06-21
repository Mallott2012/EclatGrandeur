import { DiamondGroup } from './Diamond';
import { ArtDefs } from './ArtDefs';
import type { JewelArt as JewelArtType, Metal, DiamondShape } from '@/types';

type Tone = 'ivory' | 'noir';

// ── metal form helpers ───────────────────────────────────────────────────────

function ringBand(metal: Metal, cx: number, cy: number, rx: number, ry: number, t: number) {
  const ix = rx - t;
  const iy = ry - t;
  const d =
    `M${cx},${cy - ry} A${rx},${ry} 0 1,0 ${cx},${cy + ry} A${rx},${ry} 0 1,0 ${cx},${cy - ry} Z ` +
    `M${cx},${cy - iy} A${ix},${iy} 0 1,1 ${cx},${cy + iy} A${ix},${iy} 0 1,1 ${cx},${cy - iy} Z`;
  return (
    <>
      <path d={d} fillRule="evenodd" fill={`url(#m-${metal})`} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="0.8" />
      <ellipse cx={cx} cy={cy} rx={ix} ry={iy} fill="none" stroke="#000000" strokeOpacity="0.18" strokeWidth="0.8" />
    </>
  );
}

/** Four claws + a basket under a stone. */
function claws(metal: Metal, cx: number, cy: number, r: number) {
  const a = r * 0.7;
  const pts = [
    [cx - a, cy - a],
    [cx + a, cy - a],
    [cx + a, cy + a],
    [cx - a, cy + a],
  ];
  return (
    <g>
      <ellipse cx={cx} cy={cy + r * 0.55} rx={r * 0.7} ry={r * 0.4} fill={`url(#m-${metal})`} opacity="0.9" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={r * 0.16} fill={`url(#mr-${metal})`} stroke="#ffffff" strokeOpacity="0.4" strokeWidth="0.5" />
      ))}
    </g>
  );
}

function bezel(metal: Metal, cx: number, cy: number, r: number) {
  return <circle cx={cx} cy={cy} r={r * 1.18} fill={`url(#mr-${metal})`} stroke="#ffffff" strokeOpacity="0.3" strokeWidth="0.8" />;
}

function post(metal: Metal, x: number, y: number) {
  return (
    <g>
      <rect x={x - 1.4} y={y} width="2.8" height="26" rx="1.4" fill={`url(#m-${metal})`} />
      <circle cx={x} cy={y + 30} r="4.5" fill={`url(#mr-${metal})`} stroke="#ffffff" strokeOpacity="0.3" strokeWidth="0.6" />
    </g>
  );
}

// quadratic sampler for drapes / arcs
const quad = (p0: number[], p1: number[], p2: number[], t: number): [number, number] => [
  (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
  (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
];

function diamondsAlong(
  p0: number[],
  p1: number[],
  p2: number[],
  count: number,
  size: number,
  shape: DiamondShape,
  gid: string,
  metal: Metal,
  graduate = false
) {
  const items = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const [x, y] = quad(p0, p1, p2, t);
    const grad = graduate ? 0.6 + 0.4 * (1 - Math.abs(t - 0.5) * 2) : 1;
    const s = size * grad;
    items.push(
      <g key={i}>
        <circle cx={x} cy={y} r={s * 0.62} fill={`url(#mr-${metal})`} opacity="0.85" />
        <DiamondGroup shape={shape} cx={x} cy={y} size={s} gid={`${gid}-${i}`} sparkle={i % 2 === 0} />
      </g>
    );
  }
  return items;
}

// ── the composer ─────────────────────────────────────────────────────────────

function Piece({ art, gid }: { art: JewelArtType; gid: string }) {
  const { kind, shape, metal } = art;
  const cv = art.caratVisual ?? 1;

  switch (kind) {
    case 'solitaire-ring':
      return (
        <g>
          {ringBand(metal, 200, 330, 92, 104, 26)}
          <rect x="196" y="232" width="8" height="40" fill={`url(#m-${metal})`} />
          {claws(metal, 200, 196, 56 * cv)}
          <DiamondGroup shape={shape} cx={200} cy={196} size={116 * cv} gid={`${gid}-c`} />
        </g>
      );

    case 'halo-ring':
      return (
        <g>
          {ringBand(metal, 200, 332, 90, 102, 24)}
          {/* pavé shoulders */}
          {diamondsAlong([150, 250], [200, 232], [250, 250], 7, 14, 'round', `${gid}-sh`, metal)}
          <rect x="196" y="238" width="8" height="36" fill={`url(#m-${metal})`} />
          {/* halo */}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <DiamondGroup key={i} shape="round" cx={200 + Math.cos(a) * 52 * cv} cy={196 + Math.sin(a) * 52 * cv} size={20} gid={`${gid}-halo${i}`} sparkle={false} />;
          })}
          {claws(metal, 200, 196, 44 * cv)}
          <DiamondGroup shape={shape} cx={200} cy={196} size={88 * cv} gid={`${gid}-c`} />
        </g>
      );

    case 'three-stone-ring':
      return (
        <g>
          {ringBand(metal, 200, 332, 90, 102, 24)}
          <rect x="196" y="238" width="8" height="36" fill={`url(#m-${metal})`} />
          {claws(metal, 138, 200, 34)}
          <DiamondGroup shape={shape} cx={138} cy={200} size={66} gid={`${gid}-l`} />
          {claws(metal, 262, 200, 34)}
          <DiamondGroup shape={shape} cx={262} cy={200} size={66} gid={`${gid}-r`} />
          {claws(metal, 200, 188, 52 * cv)}
          <DiamondGroup shape={shape} cx={200} cy={188} size={104 * cv} gid={`${gid}-c`} />
        </g>
      );

    case 'pave-ring':
      return (
        <g>
          {ringBand(metal, 200, 330, 92, 104, 26)}
          {diamondsAlong([120, 232], [200, 210], [280, 232], 11, 15, 'round', `${gid}-row`, metal)}
          {claws(metal, 200, 196, 46 * cv)}
          <DiamondGroup shape={shape} cx={200} cy={196} size={92 * cv} gid={`${gid}-c`} />
        </g>
      );

    case 'eternity-band':
      return (
        <g>
          {ringBand(metal, 200, 250, 120, 132, 30)}
          {Array.from({ length: 16 }).map((_, i) => {
            const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
            const r = 126;
            return <DiamondGroup key={i} shape="round" cx={200 + Math.cos(a) * r} cy={250 + Math.sin(a) * (r * 0.91)} size={28} gid={`${gid}-e${i}`} sparkle={i % 3 === 0} />;
          })}
        </g>
      );

    case 'signet-band':
      return (
        <g>
          {ringBand(metal, 200, 250, 124, 136, 46)}
          <ellipse cx={200} cy={250} rx="120" ry="132" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1.4" />
          <DiamondGroup shape={shape} cx={200} cy={124} size={26} gid={`${gid}-flush`} />
        </g>
      );

    case 'stud-earrings':
      return (
        <g>
          {[130, 270].map((x, k) => (
            <g key={x}>
              {post(metal, x, 168)}
              {claws(metal, x, 230, 40 * cv)}
              <DiamondGroup shape={shape} cx={x} cy={230} size={82 * cv} gid={`${gid}-s${k}`} />
            </g>
          ))}
        </g>
      );

    case 'drop-earrings':
      return (
        <g>
          {[132, 268].map((x, k) => (
            <g key={x}>
              {post(metal, x, 120)}
              {claws(metal, x, 176, 22)}
              <DiamondGroup shape="round" cx={x} cy={176} size={44} gid={`${gid}-top${k}`} />
              <line x1={x} y1={194} x2={x} y2={236} stroke={`url(#m-${metal})`} strokeWidth="3" />
              {claws(metal, x, 268, 36 * cv)}
              <DiamondGroup shape={shape} cx={x} cy={268} size={74 * cv} gid={`${gid}-drop${k}`} />
            </g>
          ))}
        </g>
      );

    case 'hoop-earrings':
      return (
        <g>
          {[140, 260].map((x, k) => (
            <g key={x}>
              <circle cx={x} cy={250} r="66" fill="none" stroke={`url(#m-${metal})`} strokeWidth="13" />
              <circle cx={x} cy={250} r="66" fill="none" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="2" />
              {Array.from({ length: 7 }).map((_, i) => {
                const a = Math.PI * 0.62 + (i / 6) * Math.PI * 0.76;
                return <DiamondGroup key={i} shape="round" cx={x + Math.cos(a) * 66} cy={250 + Math.sin(a) * 66} size={18} gid={`${gid}-h${k}-${i}`} sparkle={false} />;
              })}
            </g>
          ))}
        </g>
      );

    case 'pendant-necklace':
      return (
        <g>
          <path d="M64,150 Q200,300 336,150" fill="none" stroke={`url(#m-${metal})`} strokeWidth="3.5" />
          <path d="M64,150 Q200,300 336,150" fill="none" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="1 5" />
          <line x1="200" y1="262" x2="200" y2="296" stroke={`url(#m-${metal})`} strokeWidth="2.5" />
          {claws(metal, 200, 330, 44 * cv)}
          <DiamondGroup shape={shape} cx={200} cy={330} size={90 * cv} gid={`${gid}-p`} />
        </g>
      );

    case 'riviere-necklace':
      return (
        <g>
          <path d="M54,150 Q200,330 346,150" fill="none" stroke={`url(#m-${metal})`} strokeWidth="2.5" opacity="0.7" />
          {diamondsAlong([60, 152], [200, 320], [340, 152], 17, 30, shape, `${gid}-rv`, metal, true)}
        </g>
      );

    case 'tennis-bracelet':
      return (
        <g>
          <path d="M40,250 Q200,300 360,250" fill="none" stroke={`url(#m-${metal})`} strokeWidth="3" opacity="0.6" />
          {diamondsAlong([46, 250], [200, 296], [354, 250], 13, 34, shape, `${gid}-tn`, metal)}
        </g>
      );

    case 'bangle-bracelet':
      return (
        <g>
          {ringBand(metal, 200, 250, 150, 110, 22)}
          {Array.from({ length: 5 }).map((_, i) => (
            <DiamondGroup key={i} shape={shape} cx={140 + i * 30} cy={142 + (i === 2 ? -4 : 0)} size={i === 2 ? 40 : 26} gid={`${gid}-b${i}`} />
          ))}
        </g>
      );

    case 'chain-bracelet':
      return (
        <g>
          <path d="M44,250 Q200,290 356,250" fill="none" stroke={`url(#m-${metal})`} strokeWidth="4" />
          <path d="M44,250 Q200,290 356,250" fill="none" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1.2" strokeDasharray="2 7" />
          {diamondsAlong([72, 254], [200, 282], [328, 254], 5, 38, shape, `${gid}-ch`, metal)}
        </g>
      );

    default:
      return null;
  }
}

export function JewelArt({
  art,
  gid,
  tone = 'ivory',
  className = '',
  priority = false,
}: {
  art: JewelArtType;
  gid: string;
  tone?: Tone;
  className?: string;
  priority?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 400 500"
      className={className}
      role="img"
      aria-label="Jewellery illustration"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="bg-ivory" cx="50%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#faf7f1" />
          <stop offset="55%" stopColor="#f1ebde" />
          <stop offset="100%" stopColor="#e4dac9" />
        </radialGradient>
        <radialGradient id="bg-noir" cx="50%" cy="26%" r="85%">
          <stop offset="0%" stopColor="#211c17" />
          <stop offset="45%" stopColor="#151210" />
          <stop offset="100%" stopColor="#090807" />
        </radialGradient>
        <radialGradient id="bg-glow" cx="50%" cy="24%" r="40%">
          <stop offset="0%" stopColor="#c3a35c" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#c3a35c" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ArtDefs />

      <rect width="400" height="500" fill={`url(#bg-${tone})`} />
      <rect width="400" height="500" fill="url(#bg-glow)" />
      {/* floor shadow */}
      <ellipse cx="200" cy="430" rx="118" ry="20" fill="#000000" opacity={tone === 'noir' ? 0.4 : 0.08} />

      <Piece art={art} gid={gid} />

      {/* faint vignette */}
      <rect width="400" height="500" fill="url(#bg-glow)" opacity="0.4" />
    </svg>
  );
}
