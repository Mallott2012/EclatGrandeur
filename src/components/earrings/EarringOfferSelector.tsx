'use client';

import { useMemo, useState, useEffect } from 'react';
import useSWR from 'swr';
import { X } from 'lucide-react';
import { EarringOfferCard } from './EarringOfferCard';
import { clarityLabel, type PublicEarringOffer } from '@/lib/earrings/offer-types';

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

const CLARITY_RANK = ['VS2', 'VS1', 'VVS2', 'VVS1', 'IF', 'FL'];
const INITIAL_DISPLAY = 12;

const fetcher = (url: string): Promise<PublicEarringOffer[]> =>
  fetch(url).then(r => r.json()).then(d => Array.isArray(d?.offers) ? d.offers : []);

interface Props {
  productId:        string;
  metal:            string | null;
  selectedOfferId:  string | null;
  onSelect:         (offer: PublicEarringOffer) => void;
  onClose:          () => void;
}

// ── Dual-handle range slider (mirrors the engagement selector's RangeSlider) ────
function RangeSlider({ label, min, max, value, onChange, format }: {
  label: string; min: number; max: number;
  value: [number, number]; onChange: (v: [number, number]) => void; format: (n: number) => string;
}) {
  const span = max - min || 1;
  const pct = (v: number) => ((v - min) / span) * 100;
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
        <input type="range" min={min} max={max} step={span / 100} value={value[0]}
          onChange={e => { const v = Number(e.target.value); if (v <= value[1]) onChange([v, value[1]]); }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer" style={{ height: 20, top: -10 }} />
        <input type="range" min={min} max={max} step={span / 100} value={value[1]}
          onChange={e => { const v = Number(e.target.value); if (v >= value[0]) onChange([value[0], v]); }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer" style={{ height: 20, top: -10 }} />
        <span className="absolute pointer-events-none" style={{ left: `${pct(value[0])}%`, top: -5, transform: 'translateX(-50%)', width: 11, height: 11, borderRadius: '50%', backgroundColor: '#fff', border: `2px solid ${G}` }} />
        <span className="absolute pointer-events-none" style={{ left: `${pct(value[1])}%`, top: -5, transform: 'translateX(-50%)', width: 11, height: 11, borderRadius: '50%', backgroundColor: '#fff', border: `2px solid ${G}` }} />
      </div>
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="font-sans transition-colors"
      style={{ fontSize: 10, letterSpacing: '0.12em', padding: '4px 10px', border: `1px solid ${active ? G : '#ddd'}`, backgroundColor: active ? G : '#fff', color: active ? '#fff' : '#888' }}>
      {label}
    </button>
  );
}

export function EarringOfferSelector({ productId, metal, selectedOfferId, onSelect, onClose }: Props) {
  const url = `/api/earrings/${productId}/offers${metal ? `?metal=${encodeURIComponent(metal)}` : ''}`;
  const { data: offers = [], isLoading } = useSWR<PublicEarringOffer[]>(url, fetcher, { revalidateOnFocus: false });

  // Carat bounds from the available offers.
  const caratValues = useMemo(() => offers.map(o => o.total_carat), [offers]);
  const caratMin = caratValues.length ? Math.min(...caratValues) : 0.5;
  const caratMax = caratValues.length ? Math.max(...caratValues) : 5;

  const [caratRange, setCaratRange] = useState<[number, number]>([caratMin, caratMax]);
  const [activeColours, setActiveColours]   = useState<string[]>([]);
  const [activeClarities, setActiveClarities] = useState<string[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(selectedOfferId);
  const [displayLimit, setDisplayLimit] = useState(INITIAL_DISPLAY);

  // Keep the carat range in sync once offers load.
  useEffect(() => { setCaratRange([caratMin, caratMax]); }, [caratMin, caratMax]);

  const colourOpts  = useMemo(() => [...new Set(offers.map(o => o.colour))].sort(), [offers]);
  const clarityOpts = useMemo(() => [...new Set(offers.map(o => o.clarity))].sort((a, b) => CLARITY_RANK.indexOf(a) - CLARITY_RANK.indexOf(b)), [offers]);

  const filtered = useMemo(() => offers.filter(o =>
    o.total_carat >= caratRange[0] - 1e-9 && o.total_carat <= caratRange[1] + 1e-9 &&
    (activeColours.length === 0 || activeColours.includes(o.colour)) &&
    (activeClarities.length === 0 || activeClarities.includes(o.clarity))
  ), [offers, caratRange, activeColours, activeClarities]);

  const displayed = filtered.slice(0, displayLimit);
  const pendingOffer = offers.find(o => o.id === pendingId) ?? null;

  function toggle(arr: string[], v: string, set: (x: string[]) => void) {
    set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  }
  function resetFilters() {
    setCaratRange([caratMin, caratMax]); setActiveColours([]); setActiveClarities([]); setDisplayLimit(INITIAL_DISPLAY);
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-7 pt-5 pb-5" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div>
          <p className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}>Select Your Diamond Pair</p>
          <p className="font-sans mt-1.5" style={{ fontSize: 11, color: '#999', letterSpacing: '0.02em' }}>Each pair is selected for balance and visual harmony.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close"><X className="w-4 h-4" strokeWidth={1.5} style={{ color: '#aaa' }} /></button>
      </div>

      {/* Filters */}
      <div className="px-7 py-5" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="mb-4">
          <RangeSlider label="Carat Weight" min={caratMin} max={caratMax} value={caratRange} onChange={setCaratRange} format={n => `${n.toFixed(2)}ct`} />
        </div>
        {colourOpts.length > 1 && (
          <div className="mb-3">
            <p className="font-sans uppercase mb-2" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}>Colour</p>
            <div className="flex gap-1.5">
              {colourOpts.map(c => (
                <button key={c} type="button" onClick={() => toggle(activeColours, c, setActiveColours)}
                  className="flex items-center justify-center font-sans rounded-full"
                  style={{ width: 30, height: 30, fontSize: 10, border: `1px solid ${activeColours.includes(c) ? G : '#ddd'}`, backgroundColor: activeColours.includes(c) ? G : '#fff', color: activeColours.includes(c) ? '#fff' : '#666' }}>{c}</button>
              ))}
            </div>
          </div>
        )}
        {clarityOpts.length > 1 && (
          <div>
            <p className="font-sans uppercase mb-2" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}>Clarity</p>
            <div className="flex flex-wrap gap-1.5">
              {clarityOpts.map(c => (
                <Chip key={c} label={clarityLabel(c)} active={activeClarities.includes(c)} onClick={() => toggle(activeClarities, c, setActiveClarities)} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results header */}
      <div className="px-7 pt-3 pb-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.24em', color: '#bbb' }}>
            {isLoading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'Pair' : 'Pairs'}`}
          </span>
          <button type="button" onClick={resetFilters} className="font-sans" style={{ fontSize: 10, color: '#bbb', textDecoration: 'underline', textUnderlineOffset: 3 }}>Reset</button>
        </div>
        <p className="font-sans" style={{ fontSize: 9, color: '#bbb', letterSpacing: '0.04em', fontStyle: 'italic' }}>
          Each pair is matched for balance and visual harmony.
        </p>
      </div>

      {/* Card grid */}
      <div className="flex-1 overflow-y-auto px-7 py-5">
        {isLoading ? (
          <div className="py-16 text-center"><p className="font-sans" style={{ fontSize: 12, color: '#ccc' }}>Loading pairs…</p></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-sans" style={{ fontSize: 12, color: '#ccc' }}>No diamond pairs match your filters.</p>
            <button type="button" onClick={resetFilters} className="font-sans mt-3 underline" style={{ fontSize: 11, color: '#bbb', textUnderlineOffset: 3 }}>Clear filters</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {displayed.map(o => (
                <EarringOfferCard key={o.id} offer={o} selected={pendingId === o.id} onSelect={() => setPendingId(o.id)} />
              ))}
            </div>
            {filtered.length > displayLimit && (
              <button type="button" onClick={() => setDisplayLimit(v => v + 12)} className="w-full font-sans uppercase mt-4 py-3"
                style={{ fontSize: 10, letterSpacing: '0.18em', color: '#888', border: '1px solid #e0e0e0' }}>
                Show more ({filtered.length - displayLimit} remaining)
              </button>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
        <button type="button" onClick={onClose} className="flex-1 font-sans uppercase py-3.5" style={{ fontSize: 10, letterSpacing: '0.18em', color: G, border: `1px solid ${G}` }}>
          Need an Expert?
        </button>
        <button type="button" disabled={!pendingId} onClick={() => { if (pendingOffer) onSelect(pendingOffer); }}
          className="flex-1 font-sans uppercase py-3.5 flex flex-col items-center justify-center gap-0.5"
          style={{ backgroundColor: pendingId ? G : '#ccc', color: '#fff', transition: 'background-color 0.15s' }}>
          <span style={{ fontSize: 10, letterSpacing: '0.18em' }}>Select Pair</span>
          {pendingOffer && <span style={{ fontSize: 9, letterSpacing: '0.08em', opacity: 0.75 }}>£{pendingOffer.price_gbp.toLocaleString('en-GB')}</span>}
        </button>
      </div>
    </div>
  );
}
