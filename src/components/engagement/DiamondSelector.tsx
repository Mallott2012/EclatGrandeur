'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import useSWR from 'swr';
import { X, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

// ── Exported types ─────────────────────────────────────────────────────────────

/** Minimal legacy type — used by the existing legacy table mode. */
export type Diamond = {
  id:          string;
  sku:         string;
  carat:       number;
  shape:       string;
  color:       string;
  clarity:     string;
  fluorescence:string;
  price:       number;
};

/** Full customer-safe diamond from the compatibility API. */
export type PublicDiamond = Diamond & {
  diamond_category:  'white' | 'coloured';
  colour_family:     'yellow' | 'pink' | null;
  colour_intensity:  string | null;
  colour_description: string | null;
  gia_report_url:    string | null;
  cut_grade:         string | null;
  polish:            string | null;
  symmetry:          string | null;
};

// ── Constants ──────────────────────────────────────────────────────────────────

const WHITE_COLOURS    = ['D', 'E', 'F', 'G', 'H', 'I'] as const;
const CLARITIES        = ['VS2', 'VS1', 'VVS2', 'VVS1', 'IF', 'FL'] as const;
const COLOUR_FAMILIES  = ['yellow', 'pink'] as const;
const INTENSITIES      = [
  { id: 'fancy_light',   label: 'Fancy Light'   },
  { id: 'fancy',         label: 'Fancy'         },
  { id: 'fancy_intense', label: 'Fancy Intense' },
  { id: 'fancy_vivid',   label: 'Fancy Vivid'   },
] as const;

const clarityRank: Record<string, number> = { VS2: 0, VS1: 1, VVS2: 2, VVS1: 3, IF: 4, FL: 5 };
const colorRank:   Record<string, number> = { D: 0, E: 1, F: 2, G: 3, H: 4, I: 5 };

const INITIAL_DISPLAY = 12;

const fetcher = (url: string): Promise<PublicDiamond[]> =>
  fetch(url).then(r => r.json()).then(d => d.diamonds ?? []);

// ── Range slider ───────────────────────────────────────────────────────────────

function RangeSlider({ label, min, max, value, onChange, format }: {
  label: string; min: number; max: number;
  value: [number, number]; onChange: (v: [number, number]) => void;
  format: (n: number) => string;
}) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  return (
    <div>
      <p className="font-sans uppercase mb-3" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}>{label}</p>
      <div className="flex items-center gap-2 mb-4">
        <span className="font-sans border px-2 py-1 text-center" style={{ fontSize: 11, color: G, borderColor: BORDER, minWidth: 52 }}>{format(value[0])}</span>
        <span style={{ fontSize: 11, color: '#ccc' }}>—</span>
        <span className="font-sans border px-2 py-1 text-center" style={{ fontSize: 11, color: G, borderColor: BORDER, minWidth: 52 }}>{format(value[1])}</span>
      </div>
      <div className="relative h-px mx-1" style={{ backgroundColor: '#e8e8e8' }}>
        <div className="absolute h-px" style={{ backgroundColor: G, left: `${pct(value[0])}%`, right: `${100 - pct(value[1])}%` }} />
        <input type="range" min={min} max={max} step={(max - min) / 100} value={value[0]}
          onChange={e => { const v = Number(e.target.value); if (v < value[1]) onChange([v, value[1]]); }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer" style={{ height: 20, top: -10 }} />
        <input type="range" min={min} max={max} step={(max - min) / 100} value={value[1]}
          onChange={e => { const v = Number(e.target.value); if (v > value[0]) onChange([value[0], v]); }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer" style={{ height: 20, top: -10 }} />
        <span className="absolute pointer-events-none" style={{ left: `${pct(value[0])}%`, top: -5, transform: 'translateX(-50%)', width: 11, height: 11, borderRadius: '50%', backgroundColor: '#fff', border: `2px solid ${G}`, display: 'inline-block' }} />
        <span className="absolute pointer-events-none" style={{ left: `${pct(value[1])}%`, top: -5, transform: 'translateX(-50%)', width: 11, height: 11, borderRadius: '50%', backgroundColor: '#fff', border: `2px solid ${G}`, display: 'inline-block' }} />
      </div>
    </div>
  );
}

// ── Toggle chip ────────────────────────────────────────────────────────────────

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-sans transition-colors"
      style={{
        fontSize: 10, letterSpacing: '0.12em', padding: '4px 10px',
        border: `1px solid ${active ? G : '#ddd'}`,
        backgroundColor: active ? G : '#fff',
        color: active ? '#fff' : '#888',
      }}
    >
      {label}
    </button>
  );
}

// ── Diamond card ───────────────────────────────────────────────────────────────

function DiamondCard({
  d, selected, onSelect, settingName,
}: {
  d: PublicDiamond; selected: boolean; onSelect: () => void; settingName?: string;
}) {
  const isWhite    = d.diamond_category === 'white';
  const shapeLabel = d.shape.charAt(0).toUpperCase() + d.shape.slice(1);

  // Build headline line
  const headline = isWhite
    ? `${d.carat.toFixed(2)}ct ${shapeLabel}`
    : (() => {
        const intensityLabel: Record<string, string> = {
          fancy_light:   'Fancy Light',
          fancy:         'Fancy',
          fancy_intense: 'Fancy Intense',
          fancy_vivid:   'Fancy Vivid',
        };
        const familyLabel: Record<string, string> = { yellow: 'Yellow', pink: 'Pink' };
        const parts = [d.carat.toFixed(2) + 'ct'];
        if (d.colour_intensity) parts.push(intensityLabel[d.colour_intensity] ?? d.colour_intensity);
        if (d.colour_family)    parts.push(familyLabel[d.colour_family] ?? d.colour_family);
        parts.push(shapeLabel);
        return parts.join(' ');
      })();

  const subtitle = isWhite
    ? `${d.color} Colour · ${d.clarity} Clarity`
    : `${d.clarity} Clarity`;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="text-left flex flex-col"
      style={{
        border: `1px solid ${selected ? G : BORDER}`,
        padding: '14px 13px',
        backgroundColor: selected ? '#f7f9f7' : '#fff',
        transition: 'border-color 0.15s, background-color 0.15s',
        position: 'relative',
      }}
    >
      {/* Selection indicator */}
      <span
        style={{
          position: 'absolute', top: 10, right: 10,
          width: 14, height: 14, borderRadius: '50%',
          border: `1.5px solid ${selected ? G : '#ddd'}`,
          backgroundColor: selected ? G : '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {selected && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#fff', display: 'block' }} />}
      </span>

      {/* Headline */}
      <span className="font-sans" style={{ fontSize: 12, color: G, fontWeight: 400, lineHeight: 1.4, paddingRight: 20 }}>
        {headline}
      </span>

      {/* Subtitle */}
      <span className="font-sans mt-1" style={{ fontSize: 11, color: '#888', fontWeight: 300, lineHeight: 1.4 }}>
        {subtitle}
      </span>

      {/* Price */}
      <span className="font-sans mt-2" style={{ fontSize: 13, color: G, fontWeight: 400 }}>
        £{d.price.toLocaleString('en-GB')}
      </span>

      {/* Certificate link */}
      {d.gia_report_url && (
        <a
          href={d.gia_report_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="flex items-center gap-1 mt-2 font-sans"
          style={{ fontSize: 9, color: '#aaa', letterSpacing: '0.08em', textDecoration: 'none' }}
        >
          <ExternalLink className="w-2.5 h-2.5" strokeWidth={1.5} />
          View Certificate
        </a>
      )}
    </button>
  );
}

// ── Legacy table row (kept for backward compat / jewellery pages) ─────────────

type SortKey = 'carat' | 'color' | 'clarity' | 'price' | 'ppc';
type SortDir = 'asc' | 'desc';

const CARAT_TIERS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

function caratTierToDiamond(carat: number, ppc: number): PublicDiamond {
  return {
    id: `tier_${carat}`, sku: '', carat, shape: 'round', color: '—',
    clarity: '—', fluorescence: 'none', price: Math.round(carat * ppc),
    diamond_category: 'white', colour_family: null, colour_intensity: null,
    colour_description: null, gia_report_url: null, cut_grade: null,
    polish: null, symmetry: null,
  };
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  onClose:           () => void;
  onSelect:          (d: PublicDiamond) => void;
  selectedId:        string | null;
  /** When present: use compatibility API + card view */
  ringSettingId?:    string;
  compatibleShapes?: string[];
  minCarat?:         number | null;
  maxCarat?:         number | null;
  settingName?:      string;
  /** Legacy: explicit API URL for non-ring contexts */
  diamondApiUrl?:    string;
  pairMode?:         boolean;
  totalCaratMode?:   boolean;
  pricePerCarat?:    number;
}

// ── Main component ─────────────────────────────────────────────────────────────

export function DiamondSelector({
  onClose, onSelect, selectedId,
  ringSettingId, compatibleShapes, minCarat, maxCarat, settingName,
  diamondApiUrl = '/api/diamonds',
  pairMode = false, totalCaratMode = false, pricePerCarat = 1000,
}: Props) {

  const isCompatibilityMode = Boolean(ringSettingId);

  // ── Category toggle (compatibility mode only) ──────────────────────────────
  const [diamondType, setDiamondType] = useState<'white' | 'coloured'>('white');

  // For coloured, choose active family (both by default)
  const [activeFamily, setActiveFamily] = useState<'yellow' | 'pink' | null>(null);

  // ── Build API URLs ─────────────────────────────────────────────────────────
  const compatBase = ringSettingId ? `/api/diamonds?ring_setting_id=${ringSettingId}` : null;

  const whiteUrl    = compatBase ? `${compatBase}&category=white` : null;
  const colouredUrl = compatBase
    ? (activeFamily
        ? `${compatBase}&category=coloured&colour_family=${activeFamily}`
        : `${compatBase}&category=coloured`)
    : null;

  const activeUrl = isCompatibilityMode
    ? (diamondType === 'white' ? whiteUrl : colouredUrl)
    : diamondApiUrl;

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: liveDiamonds = [], isLoading } = useSWR<PublicDiamond[]>(
    totalCaratMode ? null : activeUrl,
    fetcher,
    { revalidateOnFocus: false },
  );

  // ── Filter state ───────────────────────────────────────────────────────────
  const caratMin = minCarat ?? 0.5;
  const caratMax = maxCarat ?? 5.0;
  const [caratRange,       setCaratRange]       = useState<[number, number]>([caratMin, caratMax]);
  const [priceRange,       setPriceRange]       = useState<[number, number]>([2000, 80000]);
  const [activeColors,     setActiveColors]     = useState<string[]>([]);
  const [activeClarities,  setActiveClarities]  = useState<string[]>([]);
  const [activeIntensities,setActiveIntensities]= useState<string[]>([]);
  const [activeShapes,     setActiveShapes]     = useState<string[]>([]);
  const [displayLimit,     setDisplayLimit]     = useState(INITIAL_DISPLAY);

  // Reset display limit when type or filters change
  useEffect(() => { setDisplayLimit(INITIAL_DISPLAY); }, [diamondType, activeFamily, activeUrl]);

  // Analytics debounce
  const filterChangeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fireFilterChanged = useCallback((extra?: object) => {
    if (filterChangeTimer.current) clearTimeout(filterChangeTimer.current);
    filterChangeTimer.current = setTimeout(() => {
      trackEvent('engagement_diamond_filter_changed', {
        settingId:   ringSettingId,
        settingName,
        diamondType,
        ...extra,
      });
    }, 300);
  }, [ringSettingId, settingName, diamondType]);

  // Legacy state
  const [activeTab,  setActiveTab]  = useState<'select' | 'guide'>('select');
  const [sortKey,    setSortKey]    = useState<SortKey>('carat');
  const [sortDir,    setSortDir]    = useState<SortDir>('asc');
  const [hoveredId,  setHoveredId]  = useState<string | null>(null);
  const [pendingId,  setPendingId]  = useState<string | null>(selectedId);

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (totalCaratMode) {
      return CARAT_TIERS
        .filter(ct => ct >= caratRange[0] && ct <= caratRange[1])
        .filter(ct => { const p = Math.round(ct * pricePerCarat); return p >= priceRange[0] && p <= priceRange[1]; })
        .map(ct => caratTierToDiamond(ct, pricePerCarat));
    }
    return liveDiamonds
      .filter(d => d.carat >= caratRange[0] && d.carat <= caratRange[1])
      .filter(d => d.price >= priceRange[0] && d.price <= priceRange[1])
      .filter(d => activeColors.length    === 0 || activeColors.includes(d.color))
      .filter(d => activeClarities.length === 0 || activeClarities.includes(d.clarity))
      .filter(d => activeShapes.length    === 0 || activeShapes.includes(d.shape))
      .filter(d => {
        if (!isCompatibilityMode || diamondType !== 'coloured') return true;
        if (activeIntensities.length === 0) return true;
        return d.colour_intensity ? activeIntensities.includes(d.colour_intensity) : false;
      });
  }, [
    totalCaratMode, liveDiamonds, caratRange, priceRange,
    activeColors, activeClarities, activeShapes, activeIntensities,
    isCompatibilityMode, diamondType, pricePerCarat,
  ]);

  // Legacy sort
  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    let diff = 0;
    if (sortKey === 'carat')   diff = a.carat - b.carat;
    if (sortKey === 'color')   diff = (colorRank[a.color]     ?? 0) - (colorRank[b.color]   ?? 0);
    if (sortKey === 'clarity') diff = (clarityRank[a.clarity] ?? 0) - (clarityRank[b.clarity] ?? 0);
    if (sortKey === 'price')   diff = a.price - b.price;
    if (sortKey === 'ppc')     diff = (a.price / a.carat) - (b.price / b.carat);
    return sortDir === 'asc' ? diff : -diff;
  }), [filtered, sortKey, sortDir]);

  const pendingDiamond = sorted.find(x => x.id === pendingId) ?? liveDiamonds.find(x => x.id === pendingId);
  const displayedCards = sorted.slice(0, displayLimit);

  function resetFilters() {
    setCaratRange([caratMin, caratMax]);
    setPriceRange([2000, 80000]);
    setActiveColors([]);
    setActiveClarities([]);
    setActiveIntensities([]);
    setActiveShapes([]);
    setDisplayLimit(INITIAL_DISPLAY);
  }

  function handleTypeChange(type: 'white' | 'coloured') {
    if (type === diamondType) return;
    setDiamondType(type);
    setActiveFamily(null);
    resetFilters();
    trackEvent('engagement_diamond_type_selected', {
      settingId:   ringSettingId,
      settingName,
      diamondType: type,
    });
  }

  function toggle<T extends string>(arr: T[], item: T, set: (v: T[]) => void) {
    set(arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]);
    fireFilterChanged();
  }

  function SortArrow({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span style={{ display: 'inline-block', width: 8, marginLeft: 2, opacity: 0.25, fontSize: 8 }}>↕</span>;
    return sortDir === 'asc'
      ? <ChevronUp   className="inline-block ml-0.5 w-2.5 h-2.5" strokeWidth={2} />
      : <ChevronDown className="inline-block ml-0.5 w-2.5 h-2.5" strokeWidth={2} />;
  }

  const colTemplate = totalCaratMode ? '1fr 0.7fr 0.9fr 1fr 28px' : '1.1fr 0.55fr 0.7fr 1fr 0.9fr 28px';

  // ── COMPATIBILITY MODE (ring selector — card view) ─────────────────────────

  if (isCompatibilityMode) {
    return (
      <div className="flex flex-col h-full bg-white">

        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-5 pb-5" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div>
            <p className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}>Diamond Type</p>
            <div className="flex gap-0 mt-2">
              {(['white', 'coloured'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  className="font-sans px-4 py-2 transition-colors"
                  style={{
                    fontSize: 11, letterSpacing: '0.1em',
                    border: `1px solid ${diamondType === t ? G : '#ddd'}`,
                    backgroundColor: diamondType === t ? G : '#fff',
                    color: diamondType === t ? '#fff' : '#888',
                    marginRight: t === 'white' ? -1 : 0,
                    position: 'relative', zIndex: diamondType === t ? 1 : 0,
                  }}
                >
                  {t === 'white' ? 'White Diamond' : 'Coloured Diamond'}
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ marginTop: -24 }}>
            <X className="w-4 h-4" strokeWidth={1.5} style={{ color: '#aaa' }} />
          </button>
        </div>

        {/* Filters */}
        <div className="px-7 py-5" style={{ borderBottom: `1px solid ${BORDER}` }}>

          {/* Coloured: family toggle */}
          {diamondType === 'coloured' && (
            <div className="mb-4">
              <p className="font-sans uppercase mb-2" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}>Colour Family</p>
              <div className="flex gap-2">
                {COLOUR_FAMILIES.map(f => {
                  const familyLabels = { yellow: 'Yellow', pink: 'Pink' };
                  const active = activeFamily === f;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => {
                        setActiveFamily(prev => prev === f ? null : f);
                        fireFilterChanged({ colourFamily: f });
                      }}
                      className="font-sans px-4 py-2 transition-colors"
                      style={{
                        fontSize: 11, letterSpacing: '0.1em',
                        border: `1px solid ${active ? G : '#ddd'}`,
                        backgroundColor: active ? G : '#fff',
                        color: active ? '#fff' : '#888',
                      }}
                    >
                      {familyLabels[f]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Shape chips (if ring has specific compatible shapes) */}
          {compatibleShapes && compatibleShapes.length > 0 && (
            <div className="mb-4">
              <p className="font-sans uppercase mb-2" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}>Shape</p>
              <div className="flex flex-wrap gap-1.5">
                {compatibleShapes.map(s => (
                  <Chip
                    key={s}
                    label={s.charAt(0).toUpperCase() + s.slice(1)}
                    active={activeShapes.includes(s)}
                    onClick={() => toggle(activeShapes, s, setActiveShapes)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6 mb-4">
            <RangeSlider
              label="Carat"
              min={caratMin} max={caratMax}
              value={caratRange} onChange={v => { setCaratRange(v); fireFilterChanged(); }}
              format={n => `${n.toFixed(1)}ct`}
            />
            <RangeSlider
              label="Budget"
              min={2000} max={80000}
              value={priceRange} onChange={v => { setPriceRange(v); fireFilterChanged(); }}
              format={n => `£${Math.round(n / 1000)}k`}
            />
          </div>

          {/* White: Colour + Clarity chips */}
          {diamondType === 'white' && (
            <>
              <div className="mb-3">
                <p className="font-sans uppercase mb-2" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}>Colour</p>
                <div className="flex gap-1.5">
                  {WHITE_COLOURS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggle(activeColors, c, setActiveColors)}
                      className="flex items-center justify-center font-sans rounded-full"
                      style={{
                        width: 30, height: 30, fontSize: 10,
                        border: `1px solid ${activeColors.includes(c) ? G : '#ddd'}`,
                        backgroundColor: activeColors.includes(c) ? G : '#fff',
                        color: activeColors.includes(c) ? '#fff' : '#666',
                      }}
                    >{c}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-sans uppercase mb-2" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}>Clarity</p>
                <div className="flex flex-wrap gap-1.5">
                  {CLARITIES.map(c => (
                    <Chip
                      key={c} label={c}
                      active={activeClarities.includes(c)}
                      onClick={() => toggle(activeClarities, c, setActiveClarities)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Coloured: Intensity */}
          {diamondType === 'coloured' && (
            <div>
              <p className="font-sans uppercase mb-2" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}>Intensity</p>
              <div className="flex flex-wrap gap-1.5">
                {INTENSITIES.map(i => (
                  <Chip
                    key={i.id} label={i.label}
                    active={activeIntensities.includes(i.id)}
                    onClick={() => toggle(activeIntensities, i.id, setActiveIntensities)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results header + quality reassurance */}
        <div className="px-7 pt-3 pb-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.24em', color: '#bbb' }}>
              {isLoading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'Diamond' : 'Diamonds'}`}
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="font-sans"
              style={{ fontSize: 10, color: '#bbb', textDecoration: 'underline', textUnderlineOffset: 3 }}
            >Reset</button>
          </div>
          <p className="font-sans" style={{ fontSize: 9, color: '#bbb', letterSpacing: '0.04em', fontStyle: 'italic' }}>
            Éclat Standard: Excellent Polish · Excellent Symmetry · No Fluorescence
          </p>
        </div>

        {/* Card grid */}
        <div className="flex-1 overflow-y-auto px-7 py-5">
          {isLoading ? (
            <div className="py-16 text-center">
              <p className="font-sans" style={{ fontSize: 12, color: '#ccc' }}>Loading diamonds…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-sans" style={{ fontSize: 12, color: '#ccc' }}>No diamonds match your filters.</p>
              <button
                type="button"
                onClick={resetFilters}
                className="font-sans mt-3 underline"
                style={{ fontSize: 11, color: '#bbb', textUnderlineOffset: 3 }}
              >Clear filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {displayedCards.map(d => (
                  <DiamondCard
                    key={d.id}
                    d={d}
                    selected={pendingId === d.id}
                    onSelect={() => {
                      setPendingId(d.id);
                      fireFilterChanged();
                    }}
                    settingName={settingName}
                  />
                ))}
              </div>

              {/* Show more */}
              {filtered.length > displayLimit && (
                <button
                  type="button"
                  onClick={() => setDisplayLimit(prev => prev + 12)}
                  className="w-full font-sans uppercase mt-4 py-3"
                  style={{ fontSize: 10, letterSpacing: '0.18em', color: '#888', border: `1px solid #e0e0e0` }}
                >
                  Show more ({filtered.length - displayLimit} remaining)
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button
            type="button"
            className="flex-1 font-sans uppercase py-3.5"
            style={{ fontSize: 10, letterSpacing: '0.18em', color: G, border: `1px solid ${G}` }}
            onClick={onClose}
          >
            Need an Expert?
          </button>
          <button
            type="button"
            disabled={!pendingId}
            onClick={() => {
              const d = pendingDiamond;
              if (!d) return;
              onSelect(d);
              trackEvent('engagement_diamond_selected', {
                settingId:       ringSettingId,
                settingName,
                diamondId:       d.id,
                diamondType:     d.diamond_category,
                diamondShape:    d.shape,
                diamondCarat:    d.carat,
                colourFamily:    d.colour_family ?? undefined,
                colourIntensity: d.colour_intensity ?? undefined,
              });
            }}
            className="flex-1 font-sans uppercase py-3.5 flex flex-col items-center justify-center gap-0.5"
            style={{ backgroundColor: pendingId ? G : '#ccc', color: '#fff', transition: 'background-color 0.15s' }}
          >
            <span style={{ fontSize: 10, letterSpacing: '0.18em' }}>Select Diamond</span>
            {pendingDiamond && (
              <span style={{ fontSize: 9, letterSpacing: '0.08em', opacity: 0.75 }}>
                £{pendingDiamond.price.toLocaleString('en-GB')}
              </span>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── LEGACY MODE (table view for jewellery / non-ring contexts) ────────────

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-7 pt-6 pb-0" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex gap-7">
          {(['select', 'guide'] as const).map(tab => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)}
              className="font-sans pb-4"
              style={{ fontSize: 13, color: activeTab === tab ? G : '#aaa', fontWeight: activeTab === tab ? 400 : 300, letterSpacing: '0.04em', borderBottom: activeTab === tab ? `1px solid ${G}` : '1px solid transparent', transition: 'color 0.15s' }}
            >
              {tab === 'select' ? 'Select a Diamond' : 'Guide to Diamonds'}
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="pb-4">
          <X className="w-4 h-4" strokeWidth={1.5} style={{ color: '#aaa' }} />
        </button>
      </div>

      {pairMode && activeTab === 'select' && (
        <div className="flex items-center gap-3 px-7 py-3" style={{ backgroundColor: '#f9f9f9', borderBottom: `1px solid ${BORDER}` }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: G, flexShrink: 0, display: 'inline-block' }} />
          <p className="font-sans" style={{ fontSize: 11, color: '#666', letterSpacing: '0.03em', lineHeight: 1.5 }}>
            You are selecting a <strong style={{ fontWeight: 500, color: G }}>matched pair</strong>.{' '}
            {totalCaratMode ? 'The carat weight shown is the combined total across both earrings.' : 'One stone will be duplicated for both earrings. Price shown is per stone; total reflects ×2.'}
          </p>
        </div>
      )}

      {activeTab === 'guide' && (
        <div className="flex-1 overflow-y-auto px-7 py-8">
          <h3 className="font-display mb-6" style={{ fontSize: 24, fontWeight: 300, color: G }}>The Four Cs</h3>
          {[
            { title: 'Cut',     desc: "Every Éclat diamond is Excellent cut — the highest grade awarded by the GIA. Excellent cut maximises brilliance, fire, and scintillation. We do not offer anything less." },
            { title: 'Colour',  desc: 'Graded D (colourless) to Z. D–F are colourless and most rare; G–H appear near-colourless to the naked eye. All Éclat stones are graded D–I.' },
            { title: 'Clarity', desc: 'Measures inclusions and blemishes. FL (flawless) to VS1 are eye-clean. All Éclat stones are VS2 or above.' },
            { title: 'Carat',   desc: 'The weight of the diamond. One carat = 0.2 grams. Larger diamonds are rarer and exponentially more valuable per carat.' },
          ].map(item => (
            <div key={item.title} className="py-6" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <p className="font-sans uppercase mb-2" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}>{item.title}</p>
              <p className="font-sans" style={{ fontSize: 13, color: '#555', lineHeight: 1.8, fontWeight: 300 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'select' && (
        <>
          <div className="px-7 py-6" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div className="grid grid-cols-2 gap-8 mb-7">
              <RangeSlider label="Carat Weight" min={0.5} max={totalCaratMode ? 5.0 : 3.0} value={caratRange} onChange={setCaratRange} format={n => `${n.toFixed(1)}ct`} />
              <RangeSlider label="Price" min={2000} max={totalCaratMode ? Math.round(5 * pricePerCarat * 1.1) : 30000} value={priceRange} onChange={setPriceRange} format={n => `£${Math.round(n / 1000)}k`} />
            </div>
            <div className="mb-5">
              <p className="font-sans uppercase mb-3" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}>Colour</p>
              <div className="flex gap-2">
                {WHITE_COLOURS.map(c => { const on = activeColors.includes(c); return (
                  <button key={c} type="button" onClick={() => toggle(activeColors, c, setActiveColors)}
                    className="flex items-center justify-center font-sans rounded-full"
                    style={{ width: 34, height: 34, fontSize: 11, border: `1px solid ${on ? G : '#ddd'}`, backgroundColor: on ? G : '#fff', color: on ? '#fff' : '#555', transition: 'all 0.15s' }}
                  >{c}</button>
                ); })}
              </div>
            </div>
            <div className="mb-5">
              <p className="font-sans uppercase mb-3" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}>Clarity</p>
              <div className="flex flex-wrap gap-2">
                {CLARITIES.map(c => { const on = activeClarities.includes(c); return (
                  <button key={c} type="button" onClick={() => toggle(activeClarities, c, setActiveClarities)}
                    className="font-sans px-3 py-1.5"
                    style={{ fontSize: 10, letterSpacing: '0.08em', border: `1px solid ${on ? G : '#ddd'}`, backgroundColor: on ? G : '#fff', color: on ? '#fff' : '#555', transition: 'all 0.15s' }}
                  >{c}</button>
                ); })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-7 pt-4 pb-2">
            <span className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}>
              {sorted.length} {sorted.length === 1 ? 'Result' : 'Results'}
            </span>
            <button type="button" onClick={resetFilters} className="font-sans" style={{ fontSize: 10, color: '#bbb', textDecoration: 'underline', textUnderlineOffset: 3 }}>Reset Filters</button>
          </div>

          <div className="grid px-7 py-2" style={{ gridTemplateColumns: colTemplate, borderBottom: `1px solid ${BORDER}` }}>
            {(['carat', 'color', 'clarity', 'price'] as SortKey[]).map(col => (
              <button key={col} type="button" onClick={() => toggleSort(col)}
                className="font-sans uppercase text-left"
                style={{ fontSize: 9, letterSpacing: '0.18em', color: sortKey === col ? G : '#bbb', fontWeight: sortKey === col ? 500 : 400 }}
              >
                {col === 'carat' ? (totalCaratMode ? 'Total Ct' : 'Carat') : col === 'color' ? 'Colour' : col === 'clarity' ? 'Clarity' : 'Price'}
                <SortArrow col={col} />
              </button>
            ))}
            {!totalCaratMode && <button type="button" onClick={() => toggleSort('ppc')} className="font-sans uppercase text-left" style={{ fontSize: 9, letterSpacing: '0.18em', color: sortKey === 'ppc' ? G : '#bbb', fontWeight: sortKey === 'ppc' ? 500 : 400 }}>£/ct <SortArrow col="ppc" /></button>}
            <span />
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="py-16 text-center px-7"><p className="font-sans" style={{ fontSize: 13, color: '#ccc' }}>Loading diamonds…</p></div>
            ) : sorted.length === 0 ? (
              <div className="py-16 text-center px-7"><p className="font-sans" style={{ fontSize: 13, color: '#ccc' }}>No diamonds match your filters.</p></div>
            ) : sorted.map(d => {
              const isPending = pendingId === d.id; const isHovered = hoveredId === d.id;
              const ppc = Math.round(d.price / d.carat);
              return (
                <button key={d.id} type="button" onClick={() => setPendingId(d.id)}
                  onMouseEnter={() => setHoveredId(d.id)} onMouseLeave={() => setHoveredId(null)}
                  className="grid w-full px-7 py-3.5 text-left relative"
                  style={{ gridTemplateColumns: colTemplate, borderBottom: `1px solid ${BORDER}`, backgroundColor: isPending ? '#f5f8f5' : isHovered ? '#f9f9f9' : '#fff', transition: 'background-color 0.12s' }}
                >
                  <span className="font-sans flex items-center gap-2" style={{ fontSize: 12, color: G }}>{d.carat % 1 === 0 ? `${d.carat}.0ct` : `${d.carat}ct`}</span>
                  <span className="font-sans" style={{ fontSize: 12, color: '#555' }}>{d.color}</span>
                  <span className="font-sans" style={{ fontSize: 12, color: '#555' }}>{d.clarity}</span>
                  <span className="font-sans" style={{ fontSize: 12, color: '#555' }}>£{d.price.toLocaleString('en-GB')}</span>
                  {!totalCaratMode && <span className="font-sans" style={{ fontSize: 11, color: '#999' }}>£{ppc.toLocaleString('en-GB')}</span>}
                  <span className="self-center flex-shrink-0 flex items-center justify-center rounded-full" style={{ width: 18, height: 18, border: `1.5px solid ${isPending ? G : '#ccc'}`, backgroundColor: '#fff' }}>
                    {isPending && <span style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: G, display: 'block' }} />}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 px-5 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
            <button type="button" className="flex-1 font-sans uppercase py-3.5" style={{ fontSize: 10, letterSpacing: '0.2em', color: G, border: `1px solid ${G}`, backgroundColor: '#fff' }}>Need an Expert?</button>
            <button type="button" disabled={!pendingId}
              onClick={() => { if (pendingDiamond) onSelect(pendingDiamond); }}
              className="flex-1 font-sans uppercase py-3.5 flex flex-col items-center justify-center gap-0.5"
              style={{ backgroundColor: pendingId ? G : '#ccc', color: '#fff', transition: 'background-color 0.15s' }}
            >
              <span style={{ fontSize: 10, letterSpacing: '0.2em' }}>{pairMode ? 'Select This Pair' : 'Select This Diamond'}</span>
              {pendingDiamond && <span style={{ fontSize: 9, letterSpacing: '0.1em', opacity: 0.75 }}>£{pendingDiamond.price.toLocaleString('en-GB')}{pairMode && !totalCaratMode ? ` × 2 = £${(pendingDiamond.price * 2).toLocaleString('en-GB')}` : ''}</span>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
