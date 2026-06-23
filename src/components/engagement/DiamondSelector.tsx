'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { X, ChevronUp, ChevronDown } from 'lucide-react';

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

const COLORS    = ['D', 'E', 'F', 'G', 'H', 'I'] as const;
const CLARITIES = ['VS2', 'VS1', 'VVS2', 'VVS1', 'IF', 'FL'] as const;

const fetcher = (url: string) => fetch(url).then(r => r.json()).then(d => d.diamonds as Diamond[]);

// ─── Total carat tiers ────────────────────────────────────────────────────────
const CARAT_TIERS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

function caratTierToDiamond(carat: number, pricePerCarat: number) {
  return { id: `tier_${carat}`, carat, color: '—', clarity: '—', price: Math.round(carat * pricePerCarat), shape: 'round' as const, sku: '', fluorescence: 'none' };
}

export type Diamond = {
  id: string;
  sku: string;
  carat: number;
  shape: string;
  color: string;
  clarity: string;
  fluorescence: string;
  price: number;
};
type SortKey = 'carat' | 'color' | 'clarity' | 'price' | 'ppc';
type SortDir = 'asc' | 'desc';

const clarityRank: Record<string, number> = { VS2: 0, VS1: 1, VVS2: 2, VVS1: 3, IF: 4, FL: 5 };
const colorRank:   Record<string, number> = { D: 0, E: 1, F: 2, G: 3, H: 4, I: 5 };


// ─── Dual range slider ────────────────────────────────────────────────────────
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
        <span className="font-sans border px-2 py-1 text-center" style={{ fontSize: 11, color: G, borderColor: BORDER, minWidth: 56 }}>{format(value[0])}</span>
        <span style={{ fontSize: 11, color: '#ccc' }}>—</span>
        <span className="font-sans border px-2 py-1 text-center" style={{ fontSize: 11, color: G, borderColor: BORDER, minWidth: 56 }}>{format(value[1])}</span>
      </div>
      <div className="relative h-px mx-1" style={{ backgroundColor: '#e0e0e0' }}>
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

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  onClose:         () => void;
  onSelect:        (d: Diamond) => void;
  selectedId:      string | null;
  pairMode?:       boolean;
  totalCaratMode?: boolean;
  pricePerCarat?:  number;
}

export function DiamondSelector({
  onClose, onSelect, selectedId,
  pairMode = false, totalCaratMode = false, pricePerCarat = 1000,
}: Props) {
  // ── Live diamond data from Supabase via API ───────────────────────────────
  const { data: liveDiamonds = [], isLoading: diamondsLoading } = useSWR<Diamond[]>(
    totalCaratMode ? null : '/api/diamonds',
    fetcher,
    { revalidateOnFocus: false },
  );

  const [activeTab,       setActiveTab]       = useState<'select' | 'guide'>('select');
  const [caratRange,      setCaratRange]      = useState<[number, number]>(totalCaratMode ? [0.5, 5] : [0.5, 3.0]);
  const [priceRange,      setPriceRange]      = useState<[number, number]>([2000, 30000]);
  const [activeColors,    setActiveColors]    = useState<string[]>([]);
  const [activeClarities, setActiveClarities] = useState<string[]>([]);
  const [sortKey,         setSortKey]         = useState<SortKey>('carat');
  const [sortDir,         setSortDir]         = useState<SortDir>('asc');
  const [hoveredId,       setHoveredId]       = useState<string | null>(null);
  const [pendingId,       setPendingId]       = useState<string | null>(selectedId);

  const toggleColor   = (c: string) => setActiveColors(p   => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);
  const toggleClarity = (c: string) => setActiveClarities(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  // ── Build + sort rows ────────────────────────────────────────────────────
  const rows: Diamond[] = useMemo(() => {
    if (totalCaratMode) {
      return CARAT_TIERS
        .filter(ct => ct >= caratRange[0] && ct <= caratRange[1])
        .filter(ct => { const p = Math.round(ct * pricePerCarat); return p >= priceRange[0] && p <= priceRange[1]; })
        .map(ct => caratTierToDiamond(ct, pricePerCarat));
    }
    return liveDiamonds
      .filter(d => d.carat >= caratRange[0] && d.carat <= caratRange[1])
      .filter(d => d.price >= priceRange[0]  && d.price <= priceRange[1])
      .filter(d => activeColors.length    === 0 || activeColors.includes(d.color))
      .filter(d => activeClarities.length === 0 || activeClarities.includes(d.clarity));
  }, [totalCaratMode, caratRange, priceRange, activeColors, activeClarities, pricePerCarat, liveDiamonds]);

  const sorted = useMemo(() => [...rows].sort((a, b) => {
    let diff = 0;
    if (sortKey === 'carat')   diff = a.carat - b.carat;
    if (sortKey === 'color')   diff = (colorRank[a.color]     ?? 0) - (colorRank[b.color]   ?? 0);
    if (sortKey === 'clarity') diff = (clarityRank[a.clarity] ?? 0) - (clarityRank[b.clarity] ?? 0);
    if (sortKey === 'price')   diff = a.price - b.price;
    if (sortKey === 'ppc')     diff = (a.price / a.carat) - (b.price / b.carat);
    return sortDir === 'asc' ? diff : -diff;
  }), [rows, sortKey, sortDir]);

  const pendingDiamond = sorted.find(x => x.id === pendingId)
    ?? liveDiamonds.find(x => x.id === pendingId)
    ?? (totalCaratMode ? CARAT_TIERS.map(ct => caratTierToDiamond(ct, pricePerCarat)).find(x => x.id === pendingId) : undefined);

  function SortArrow({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span style={{ display: 'inline-block', width: 8, marginLeft: 2, opacity: 0.25, fontSize: 8 }}>↕</span>;
    return sortDir === 'asc'
      ? <ChevronUp   className="inline-block ml-0.5 w-2.5 h-2.5" strokeWidth={2} />
      : <ChevronDown className="inline-block ml-0.5 w-2.5 h-2.5" strokeWidth={2} />;
  }

  // table column layout: carat | color | clarity | price | £/ct | radio
  const colTemplate = totalCaratMode
    ? '1fr 0.7fr 0.9fr 1fr 28px'
    : '1.1fr 0.55fr 0.7fr 1fr 0.9fr 28px';

  return (
    <div className="flex flex-col h-full bg-white">

      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-7 pt-6 pb-0" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex gap-7">
          {(['select', 'guide'] as const).map(tab => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)}
              className="font-sans pb-4"
              style={{
                fontSize: 13, color: activeTab === tab ? G : '#aaa',
                fontWeight: activeTab === tab ? 400 : 300, letterSpacing: '0.04em',
                borderBottom: activeTab === tab ? `1px solid ${G}` : '1px solid transparent',
                transition: 'color 0.15s',
              }}
            >
              {tab === 'select' ? 'Select a Diamond' : 'Guide to Diamonds'}
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="pb-4">
          <X className="w-4 h-4" strokeWidth={1.5} style={{ color: '#aaa' }} />
        </button>
      </div>

      {/* ── PAIR NOTICE ──────────────────────────────────────────────────── */}
      {pairMode && activeTab === 'select' && (
        <div className="flex items-center gap-3 px-7 py-3" style={{ backgroundColor: '#f9f9f9', borderBottom: `1px solid ${BORDER}` }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: G, flexShrink: 0, display: 'inline-block' }} />
          <p className="font-sans" style={{ fontSize: 11, color: '#666', letterSpacing: '0.03em', lineHeight: 1.5 }}>
            You are selecting a <strong style={{ fontWeight: 500, color: G }}>matched pair</strong>.{' '}
            {totalCaratMode
              ? 'The carat weight shown is the combined total across both earrings.'
              : 'One stone will be duplicated for both earrings. Price shown is per stone; total reflects ×2.'}
          </p>
        </div>
      )}

      {/* ── GUIDE TAB ────────────────────────────────────────────────────── */}
      {activeTab === 'guide' && (
        <div className="flex-1 overflow-y-auto px-7 py-8">
          <h3 className="font-display mb-6" style={{ fontSize: 24, fontWeight: 300, color: G }}>The Four Cs</h3>
          {[
            { title: 'Cut',     desc: "Every Éclat diamond is Excellent cut — the highest grade awarded by the GIA. Excellent cut maximises brilliance, fire, and scintillation, ensuring your stone returns the maximum light possible. We do not offer anything less." },
            { title: 'Colour',  desc: 'Graded D (colourless) to Z. D–F are colourless and most rare; G–H appear near-colourless to the naked eye and offer exceptional value. All Éclat stones are graded D–I.' },
            { title: 'Clarity', desc: 'Measures inclusions and blemishes. FL (flawless) to VS1 are eye-clean — inclusions invisible without magnification. VVS grades are considered premium. All Éclat stones are VS2 or above.' },
            { title: 'Carat',   desc: 'The weight of the diamond. One carat = 0.2 grams. Larger diamonds are rarer and exponentially more valuable per carat.' },
          ].map(item => (
            <div key={item.title} className="py-6" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <p className="font-sans uppercase mb-2" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}>{item.title}</p>
              <p className="font-sans" style={{ fontSize: 13, color: '#555', lineHeight: 1.8, fontWeight: 300 }}>{item.desc}</p>
            </div>
          ))}

        </div>
      )}

      {/* ── SELECT TAB ───────────────────────────────────────────────────── */}
      {activeTab === 'select' && (
        <>
          {/* Filters */}
          <div className="px-7 py-6" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div className="grid grid-cols-2 gap-8 mb-7">
              <RangeSlider
                label="Carat Weight"
                min={0.5} max={totalCaratMode ? 5.0 : 3.0}
                value={caratRange} onChange={setCaratRange}
                format={n => `${n.toFixed(1)}ct`}
              />
              <RangeSlider
                label="Price"
                min={2000} max={totalCaratMode ? Math.round(5 * pricePerCarat * 1.1) : 30000}
                value={priceRange} onChange={setPriceRange}
                format={n => `£${Math.round(n / 1000)}k`}
              />
            </div>

            {/* Colour */}
            <div className="mb-5">
              <p className="font-sans uppercase mb-3" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}>Colour</p>
              <div className="flex gap-2">
                {COLORS.map(c => {
                  const on = activeColors.includes(c);
                  return (
                    <button key={c} type="button" onClick={() => toggleColor(c)}
                      className="flex items-center justify-center font-sans rounded-full"
                      style={{ width: 34, height: 34, fontSize: 11, border: `1px solid ${on ? G : '#ddd'}`, backgroundColor: on ? G : '#fff', color: on ? '#fff' : '#555', transition: 'all 0.15s' }}
                    >{c}</button>
                  );
                })}
              </div>
            </div>

            {/* Clarity */}
            <div className="mb-5">
              <p className="font-sans uppercase mb-3" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}>Clarity</p>
              <div className="flex flex-wrap gap-2">
                {CLARITIES.map(c => {
                  const on = activeClarities.includes(c);
                  return (
                    <button key={c} type="button" onClick={() => toggleClarity(c)}
                      className="font-sans px-3 py-1.5"
                      style={{ fontSize: 10, letterSpacing: '0.08em', border: `1px solid ${on ? G : '#ddd'}`, backgroundColor: on ? G : '#fff', color: on ? '#fff' : '#555', transition: 'all 0.15s' }}
                    >{c}</button>
                  );
                })}
              </div>
            </div>


          </div>

          {/* Results header */}
          <div className="flex items-center justify-between px-7 pt-4 pb-2">
            <span className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}>
              {sorted.length} {sorted.length === 1 ? 'Result' : 'Results'}
            </span>
            <button
              type="button"
              onClick={() => { setActiveColors([]); setActiveClarities([]); setCaratRange(totalCaratMode ? [0.5, 5] : [0.5, 3.0]); setPriceRange([2000, 30000]); }}
              className="font-sans"
              style={{ fontSize: 10, color: '#bbb', letterSpacing: '0.1em', textDecoration: 'underline', textUnderlineOffset: 3 }}
            >Reset Filters</button>
          </div>

          {/* Table header */}
          <div className="grid px-7 py-2" style={{ gridTemplateColumns: colTemplate, borderBottom: `1px solid ${BORDER}` }}>
            {(['carat', 'color', 'clarity', 'price'] as SortKey[]).map(col => (
              <button key={col} type="button" onClick={() => toggleSort(col)}
                className="font-sans uppercase text-left"
                style={{ fontSize: 9, letterSpacing: '0.18em', color: sortKey === col ? G : '#bbb', fontWeight: sortKey === col ? 500 : 400 }}
              >
                {col === 'carat'   ? (totalCaratMode ? 'Total Ct' : 'Carat')
                  : col === 'color'   ? 'Colour'
                  : col === 'clarity' ? 'Clarity'
                  : 'Price'}
                <SortArrow col={col} />
              </button>
            ))}
            {/* £/ct — individual stones only */}
            {!totalCaratMode && (
              <button type="button" onClick={() => toggleSort('ppc')}
                className="font-sans uppercase text-left"
                style={{ fontSize: 9, letterSpacing: '0.18em', color: sortKey === 'ppc' ? G : '#bbb', fontWeight: sortKey === 'ppc' ? 500 : 400 }}
              >
                £/ct <SortArrow col="ppc" />
              </button>
            )}
            <span />
          </div>

          {/* Scrollable rows */}
          <div className="flex-1 overflow-y-auto">
            {diamondsLoading ? (
              <div className="py-16 text-center px-7">
                <p className="font-sans" style={{ fontSize: 13, color: '#ccc', letterSpacing: '0.04em' }}>Loading diamonds…</p>
              </div>
            ) : sorted.length === 0 ? (
              <div className="py-16 text-center px-7">
                <p className="font-sans" style={{ fontSize: 13, color: '#ccc' }}>No diamonds match your filters.</p>
              </div>
            ) : sorted.map(d => {
              const isPending = pendingId === d.id;
              const isHovered = hoveredId === d.id;
              const ppc       = Math.round(d.price / d.carat);
              const displayPrice = pairMode && totalCaratMode
                ? `£${d.price.toLocaleString('en-GB')} total`
                : `£${d.price.toLocaleString('en-GB')}`;

              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setPendingId(d.id)}
                  onMouseEnter={() => setHoveredId(d.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="grid w-full px-7 py-3.5 text-left relative"
                  style={{
                    gridTemplateColumns: colTemplate,
                    borderBottom: `1px solid ${BORDER}`,
                    backgroundColor: isPending ? '#f5f8f5' : isHovered ? '#f9f9f9' : '#fff',
                    transition: 'background-color 0.12s',
                  }}
                >
                  {/* Carat */}
                  <span className="font-sans flex items-center gap-2" style={{ fontSize: 12, color: G }}>
                    {d.carat % 1 === 0 ? `${d.carat}.0ct` : `${d.carat}ct`}
                    {pairMode && totalCaratMode && (
                      <span style={{ fontSize: 10, color: '#999' }}>(2×{d.carat / 2}ct)</span>
                    )}
                  </span>

                  {/* Colour */}
                  <span className="font-sans" style={{ fontSize: 12, color: '#555' }}>
                    {totalCaratMode
                      ? (activeColors.length === 1 ? activeColors[0] : activeColors.length > 1 ? activeColors.join('/') : 'Any')
                      : d.color}
                  </span>

                  {/* Clarity */}
                  <span className="font-sans" style={{ fontSize: 12, color: '#555' }}>
                    {totalCaratMode
                      ? (activeClarities.length === 1 ? activeClarities[0] : activeClarities.length > 1 ? activeClarities.join('/') : 'Any')
                      : d.clarity}
                  </span>

                  {/* Price */}
                  <span className="font-sans" style={{ fontSize: 12, color: '#555' }}>{displayPrice}</span>

                  {/* £/ct — individual stones only */}
                  {!totalCaratMode && (
                    <span className="font-sans" style={{ fontSize: 11, color: '#999' }}>
                      £{ppc.toLocaleString('en-GB')}
                    </span>
                  )}

                  {/* Radio */}
                  <span
                    className="self-center flex-shrink-0 flex items-center justify-center rounded-full"
                    style={{ width: 18, height: 18, border: `1.5px solid ${isPending ? G : '#ccc'}`, backgroundColor: '#fff' }}
                  >
                    {isPending && <span style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: G, display: 'block' }} />}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 px-5 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
            <button type="button"
              className="flex-1 font-sans uppercase py-3.5"
              style={{ fontSize: 10, letterSpacing: '0.2em', color: G, border: `1px solid ${G}`, backgroundColor: '#fff' }}
            >Need an Expert?</button>
            <button
              type="button"
              disabled={!pendingId}
              onClick={() => { if (pendingDiamond) onSelect(pendingDiamond); }}
              className="flex-1 font-sans uppercase py-3.5 flex flex-col items-center justify-center gap-0.5"
              style={{ backgroundColor: pendingId ? G : '#ccc', color: '#fff', transition: 'background-color 0.15s' }}
            >
              <span style={{ fontSize: 10, letterSpacing: '0.2em' }}>
                {pairMode ? 'Select This Pair' : 'Select This Diamond'}
              </span>
              {pendingDiamond && (
                <span style={{ fontSize: 9, letterSpacing: '0.1em', opacity: 0.75 }}>
                  £{pendingDiamond.price.toLocaleString('en-GB')}
                  {pairMode && !totalCaratMode && ` × 2 = £${(pendingDiamond.price * 2).toLocaleString('en-GB')}`}
                </span>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
