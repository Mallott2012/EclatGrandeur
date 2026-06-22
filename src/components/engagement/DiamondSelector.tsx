'use client';

import { useState } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

const COLORS    = ['D', 'E', 'F', 'G', 'H', 'I'] as const;
const CLARITIES = ['VS2', 'VS1', 'VVS2', 'VVS1', 'IF', 'FL'] as const;

// ─── Individual stones (engagement rings) ────────────────────────────────────
const DIAMONDS = [
  { id: 'd1',  carat: 1.00, color: 'D', clarity: 'VVS1', price: 8500  },
  { id: 'd2',  carat: 1.01, color: 'E', clarity: 'VS1',  price: 7200  },
  { id: 'd3',  carat: 1.05, color: 'F', clarity: 'VVS2', price: 7800  },
  { id: 'd4',  carat: 1.10, color: 'D', clarity: 'VS2',  price: 8100  },
  { id: 'd5',  carat: 1.15, color: 'G', clarity: 'VS1',  price: 6900  },
  { id: 'd6',  carat: 1.20, color: 'E', clarity: 'VVS1', price: 9400  },
  { id: 'd7',  carat: 1.25, color: 'F', clarity: 'IF',   price: 11200 },
  { id: 'd8',  carat: 1.30, color: 'D', clarity: 'FL',   price: 14800 },
  { id: 'd9',  carat: 1.50, color: 'E', clarity: 'VVS2', price: 12600 },
  { id: 'd10', carat: 1.51, color: 'G', clarity: 'VS2',  price: 9200  },
  { id: 'd11', carat: 1.75, color: 'F', clarity: 'VS1',  price: 14100 },
  { id: 'd12', carat: 2.00, color: 'D', clarity: 'VVS2', price: 22000 },
  { id: 'd13', carat: 2.01, color: 'E', clarity: 'VS1',  price: 18400 },
  { id: 'd14', carat: 2.05, color: 'F', clarity: 'VVS1', price: 21500 },
  { id: 'd15', carat: 2.10, color: 'G', clarity: 'VS2',  price: 16800 },
];

// ─── Total carat tiers (necklaces, bracelets, earrings) ──────────────────────
// pricePerCarat is passed in per-product via Props
const CARAT_TIERS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

// Synthesise a "Diamond" object from a carat tier so the onSelect signature stays identical
function caratTierToDiamond(carat: number, pricePerCarat: number) {
  return {
    id:      `tier_${carat}`,
    carat,
    color:   '—',
    clarity: '—',
    price:   Math.round(carat * pricePerCarat),
  };
}

export type Diamond = typeof DIAMONDS[0];
type SortKey = 'carat' | 'color' | 'clarity' | 'price';
type SortDir = 'asc' | 'desc';

// ─── Dual range slider ────────────────────────────────────────────────────────
function RangeSlider({ label, min, max, value, onChange, format }: {
  label: string;
  min: number; max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  format: (n: number) => string;
}) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  return (
    <div>
      <p className="font-sans uppercase mb-3" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}>{label}</p>
      <div className="flex items-center gap-2 mb-4">
        <span className="font-sans border px-2 py-1 text-center" style={{ fontSize: 11, color: G, borderColor: BORDER, minWidth: 56 }}>
          {format(value[0])}
        </span>
        <span style={{ fontSize: 11, color: '#ccc' }}>—</span>
        <span className="font-sans border px-2 py-1 text-center" style={{ fontSize: 11, color: G, borderColor: BORDER, minWidth: 56 }}>
          {format(value[1])}
        </span>
      </div>
      <div className="relative h-px mx-1" style={{ backgroundColor: '#e0e0e0' }}>
        <div className="absolute h-px" style={{ backgroundColor: G, left: `${pct(value[0])}%`, right: `${100 - pct(value[1])}%` }} />
        <input type="range" min={min} max={max} step={(max - min) / 100} value={value[0]}
          onChange={e => { const v = Number(e.target.value); if (v < value[1]) onChange([v, value[1]]); }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer" style={{ height: 20, top: -10 }}
        />
        <input type="range" min={min} max={max} step={(max - min) / 100} value={value[1]}
          onChange={e => { const v = Number(e.target.value); if (v > value[0]) onChange([value[0], v]); }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer" style={{ height: 20, top: -10 }}
        />
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
  /** When true, shows a matched-pair notice and doubles the price in the footer */
  pairMode?:       boolean;
  /** When true, shows carat-tier rows (necklaces, bracelets, earrings) instead of individual stones */
  totalCaratMode?: boolean;
  /** Price per carat — required when totalCaratMode is true */
  pricePerCarat?:  number;
}

export function DiamondSelector({
  onClose,
  onSelect,
  selectedId,
  pairMode       = false,
  totalCaratMode = false,
  pricePerCarat  = 1000,
}: Props) {
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

  const clarityRank: Record<string, number> = { VS2: 0, VS1: 1, VVS2: 2, VVS1: 3, IF: 4, FL: 5 };
  const colorRank:   Record<string, number> = { D: 0, E: 1, F: 2, G: 3, H: 4, I: 5 };

  // ── Build the rows depending on mode ─────────────────────────────────────
  const rows: Diamond[] = totalCaratMode
    ? CARAT_TIERS
        .filter(ct => ct >= caratRange[0] && ct <= caratRange[1])
        .filter(ct => {
          const price = Math.round(ct * pricePerCarat);
          return price >= priceRange[0] && price <= priceRange[1];
        })
        .map(ct => caratTierToDiamond(ct, pricePerCarat))
    : DIAMONDS
        .filter(d => d.carat >= caratRange[0] && d.carat <= caratRange[1])
        .filter(d => d.price >= priceRange[0]  && d.price <= priceRange[1])
        .filter(d => activeColors.length    === 0 || activeColors.includes(d.color))
        .filter(d => activeClarities.length === 0 || activeClarities.includes(d.clarity));

  const sorted = [...rows].sort((a, b) => {
    let diff = 0;
    if (sortKey === 'carat')   diff = a.carat - b.carat;
    if (sortKey === 'color')   diff = (colorRank[a.color]   ?? 0) - (colorRank[b.color]   ?? 0);
    if (sortKey === 'clarity') diff = (clarityRank[a.clarity] ?? 0) - (clarityRank[b.clarity] ?? 0);
    if (sortKey === 'price')   diff = a.price - b.price;
    return sortDir === 'asc' ? diff : -diff;
  });

  function SortArrow({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span style={{ display: 'inline-block', width: 8, marginLeft: 2, opacity: 0.25, fontSize: 8 }}>↕</span>;
    return sortDir === 'asc'
      ? <ChevronUp   className="inline-block ml-0.5 w-2.5 h-2.5" strokeWidth={2} />
      : <ChevronDown className="inline-block ml-0.5 w-2.5 h-2.5" strokeWidth={2} />;
  }

  const pendingDiamond = sorted.find(x => x.id === pendingId) ?? DIAMONDS.find(x => x.id === pendingId)
    ?? (totalCaratMode ? CARAT_TIERS.map(ct => caratTierToDiamond(ct, pricePerCarat)).find(x => x.id === pendingId) : undefined);

  return (
    <div className="flex flex-col h-full bg-white">

      {/* ── HEADER — tabs + close ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-7 pt-6 pb-0" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex gap-7">
          {(['select', 'guide'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="font-sans pb-4"
              style={{
                fontSize: 13, color: activeTab === tab ? G : '#aaa',
                fontWeight: activeTab === tab ? 400 : 300,
                letterSpacing: '0.04em',
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

      {/* ── PAIR NOTICE ───────────────────────────────────────────────────── */}
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

      {/* ── GUIDE TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'guide' && (
        <div className="flex-1 overflow-y-auto px-7 py-8">
          <h3 className="font-display mb-6" style={{ fontSize: 24, fontWeight: 300, color: G }}>The Four Cs</h3>
          {[
            { title: 'Cut',     desc: "The most important factor in a diamond's beauty. An excellent cut maximises brilliance, fire, and scintillation." },
            { title: 'Colour',  desc: 'Graded D (colourless) to Z. D–F are colourless and most rare; G–H appear near-colourless to the naked eye.' },
            { title: 'Clarity', desc: 'Measures inclusions and blemishes. FL (flawless) to VS1 are eye-clean — inclusions invisible without magnification.' },
            { title: 'Carat',   desc: 'The weight of the diamond. One carat = 0.2 grams. Larger diamonds are rarer and exponentially more valuable.' },
          ].map(item => (
            <div key={item.title} className="py-6" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <p className="font-sans uppercase mb-2" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}>{item.title}</p>
              <p className="font-sans" style={{ fontSize: 13, color: '#555', lineHeight: 1.8, fontWeight: 300 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── SELECT TAB ────────────────────────────────────────────────────── */}
      {activeTab === 'select' && (
        <>
          {/* Filters */}
          <div className="px-7 py-6" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <div className="grid grid-cols-2 gap-8 mb-7">
              <RangeSlider
                label="Carat Weight"
                min={totalCaratMode ? 0.5 : 0.5}
                max={totalCaratMode ? 5.0 : 3.0}
                value={caratRange}
                onChange={setCaratRange}
                format={n => `${n.toFixed(1)}ct`}
              />
              <RangeSlider
                label="Price"
                min={2000}
                max={totalCaratMode ? Math.round(5 * pricePerCarat * 1.1) : 30000}
                value={priceRange}
                onChange={setPriceRange}
                format={n => `£${Math.round(n / 1000)}k`}
              />
            </div>

            {/* Colour + Clarity — always shown */}
            <>
                <div className="mb-5">
                  <p className="font-sans uppercase mb-3" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}>Colour</p>
                  <div className="flex gap-2">
                    {COLORS.map(c => {
                      const on = activeColors.includes(c);
                      return (
                        <button key={c} type="button" onClick={() => toggleColor(c)}
                          className="flex items-center justify-center font-sans rounded-full"
                          style={{ width: 34, height: 34, fontSize: 11, border: `1px solid ${on ? G : '#ddd'}`, backgroundColor: on ? G : '#fff', color: on ? '#fff' : '#555', transition: 'all 0.15s' }}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="font-sans uppercase mb-3" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}>Clarity</p>
                  <div className="flex flex-wrap gap-2">
                    {CLARITIES.map(c => {
                      const on = activeClarities.includes(c);
                      return (
                        <button key={c} type="button" onClick={() => toggleClarity(c)}
                          className="font-sans px-3 py-1.5"
                          style={{ fontSize: 10, letterSpacing: '0.08em', border: `1px solid ${on ? G : '#ddd'}`, backgroundColor: on ? G : '#fff', color: on ? '#fff' : '#555', transition: 'all 0.15s' }}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>
            </>
          </div>

          {/* Results header */}
          <div className="flex items-center justify-between px-7 pt-4 pb-2">
            <span className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}>
              {totalCaratMode ? `${sorted.length} Options` : 'Results'}
            </span>
            <button
              type="button"
              onClick={() => {
                setActiveColors([]);
                setActiveClarities([]);
                setCaratRange(totalCaratMode ? [0.5, 5] : [0.5, 3.0]);
                setPriceRange([2000, 30000]);
              }}
              className="font-sans"
              style={{ fontSize: 10, color: '#bbb', letterSpacing: '0.1em', textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              Reset Filters
            </button>
          </div>

          {/* Table headers — always 4 data columns */}
          <div
            className="grid px-7 py-2"
            style={{
              gridTemplateColumns: '1fr 0.7fr 0.9fr 1fr 28px',
              borderBottom: `1px solid ${BORDER}`,
            }}
          >
            {(['carat', 'color', 'clarity', 'price'] as SortKey[]).map(col => (
              <button
                key={col}
                type="button"
                onClick={() => toggleSort(col)}
                className="font-sans uppercase text-left"
                style={{ fontSize: 9, letterSpacing: '0.22em', color: sortKey === col ? G : '#bbb', fontWeight: sortKey === col ? 500 : 400 }}
              >
                {col === 'carat'
                  ? (totalCaratMode ? 'Total Carat' : 'Carat Wt')
                  : col.charAt(0).toUpperCase() + col.slice(1)}
                <SortArrow col={col} />
              </button>
            ))}
            <span />
          </div>

          {/* Scrollable rows */}
          <div className="flex-1 overflow-y-auto">
            {sorted.length === 0 ? (
              <div className="py-16 text-center px-7">
                <p className="font-sans" style={{ fontSize: 13, color: '#ccc' }}>No options match your filters.</p>
              </div>
            ) : (
              sorted.map(d => {
                const isPending = pendingId === d.id;
                const isHovered = hoveredId === d.id;
                const displayPrice = pairMode && totalCaratMode
                  ? `£${(d.price).toLocaleString('en-GB')} total`
                  : `£${d.price.toLocaleString('en-GB')}`;

                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setPendingId(d.id)}
                    onMouseEnter={() => setHoveredId(d.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="grid w-full px-7 py-4 text-left"
                    style={{
                      gridTemplateColumns: '1fr 0.7fr 0.9fr 1fr 28px',
                      borderBottom: `1px solid ${BORDER}`,
                      backgroundColor: isPending || isHovered ? '#f9f9f9' : '#fff',
                      transition: 'background-color 0.12s',
                    }}
                  >
                    {/* Carat */}
                    <span className="font-sans" style={{ fontSize: 12, color: G }}>
                      {d.carat % 1 === 0 ? `${d.carat}.0ct` : `${d.carat}ct`}
                      {pairMode && totalCaratMode && (
                        <span style={{ fontSize: 10, color: '#999', marginLeft: 6 }}>
                          (2×{(d.carat / 2)}ct)
                        </span>
                      )}
                    </span>
                    {/* Colour — for tiers show selected filter or "Any" */}
                    <span className="font-sans" style={{ fontSize: 12, color: '#555' }}>
                      {totalCaratMode
                        ? (activeColors.length === 1 ? activeColors[0] : activeColors.length > 1 ? activeColors.join('/') : 'Any')
                        : d.color}
                    </span>
                    {/* Clarity — for tiers show selected filter or "Any" */}
                    <span className="font-sans" style={{ fontSize: 12, color: '#555' }}>
                      {totalCaratMode
                        ? (activeClarities.length === 1 ? activeClarities[0] : activeClarities.length > 1 ? activeClarities.join('/') : 'Any')
                        : d.clarity}
                    </span>
                    {/* Price */}
                    <span className="font-sans" style={{ fontSize: 12, color: '#555' }}>{displayPrice}</span>
                    {/* Radio */}
                    <span
                      className="self-center flex-shrink-0 flex items-center justify-center rounded-full"
                      style={{ width: 18, height: 18, border: `1.5px solid ${isPending ? G : '#ccc'}`, backgroundColor: '#fff' }}
                    >
                      {isPending && <span style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: G, display: 'block' }} />}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 px-5 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
            <button
              type="button"
              className="flex-1 font-sans uppercase py-3.5"
              style={{ fontSize: 10, letterSpacing: '0.2em', color: G, border: `1px solid ${G}`, backgroundColor: '#fff' }}
            >
              Need an Expert?
            </button>
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
