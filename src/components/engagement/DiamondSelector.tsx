'use client';

import { useState } from 'react';
import { X, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';

const GREEN = '#1a2b1a';

const COLORS    = ['D', 'E', 'F', 'G', 'H', 'I'];
const CLARITIES = ['VS2', 'VS1', 'VVS2', 'VVS1', 'IF', 'FL'];

// Placeholder diamond data matching Tiffany table format
const DIAMONDS = [
  { id: 'd1',  carat: 1.00, color: 'D', clarity: 'VVS1', cut: 'Excellent', price: 8500  },
  { id: 'd2',  carat: 1.01, color: 'E', clarity: 'VS1',  cut: 'Excellent', price: 7200  },
  { id: 'd3',  carat: 1.05, color: 'F', clarity: 'VVS2', cut: 'Excellent', price: 7800  },
  { id: 'd4',  carat: 1.10, color: 'D', clarity: 'VS2',  cut: 'Excellent', price: 8100  },
  { id: 'd5',  carat: 1.15, color: 'G', clarity: 'VS1',  cut: 'Excellent', price: 6900  },
  { id: 'd6',  carat: 1.20, color: 'E', clarity: 'VVS1', cut: 'Excellent', price: 9400  },
  { id: 'd7',  carat: 1.25, color: 'F', clarity: 'IF',   cut: 'Excellent', price: 11200 },
  { id: 'd8',  carat: 1.30, color: 'D', clarity: 'FL',   cut: 'Excellent', price: 14800 },
  { id: 'd9',  carat: 1.50, color: 'E', clarity: 'VVS2', cut: 'Excellent', price: 12600 },
  { id: 'd10', carat: 1.51, color: 'G', clarity: 'VS2',  cut: 'Excellent', price: 9200  },
  { id: 'd11', carat: 1.75, color: 'F', clarity: 'VS1',  cut: 'Excellent', price: 14100 },
  { id: 'd12', carat: 2.00, color: 'D', clarity: 'VVS2', cut: 'Excellent', price: 22000 },
  { id: 'd13', carat: 2.01, color: 'E', clarity: 'VS1',  cut: 'Excellent', price: 18400 },
  { id: 'd14', carat: 2.05, color: 'F', clarity: 'VVS1', cut: 'Excellent', price: 21500 },
  { id: 'd15', carat: 2.10, color: 'G', clarity: 'VS2',  cut: 'Excellent', price: 16800 },
];

type SortKey = 'carat' | 'color' | 'clarity' | 'price';
type SortDir = 'asc' | 'desc';

interface Props {
  onClose: () => void;
  onSelect: (diamond: typeof DIAMONDS[0]) => void;
  selectedId: string | null;
}

function RangeSlider({
  label, min, max, value, onChange, format,
}: {
  label: string;
  min: number; max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  format: (n: number) => string;
}) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-sans uppercase" style={{ fontSize: 10, letterSpacing: '0.25em', color: '#aaa' }}>{label}</span>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <span className="font-sans border px-2 py-1" style={{ fontSize: 11, color: GREEN, borderColor: '#ddd', minWidth: 52, textAlign: 'center' }}>
          {format(value[0])}
        </span>
        <span className="font-sans" style={{ fontSize: 11, color: '#ccc' }}>—</span>
        <span className="font-sans border px-2 py-1" style={{ fontSize: 11, color: GREEN, borderColor: '#ddd', minWidth: 52, textAlign: 'center' }}>
          {format(value[1])}
        </span>
      </div>
      {/* Track */}
      <div className="relative h-px bg-gray-200 mx-1">
        <div
          className="absolute h-px bg-gray-800"
          style={{ left: `${pct(value[0])}%`, right: `${100 - pct(value[1])}%` }}
        />
        {/* Min thumb */}
        <input
          type="range" min={min} max={max} step={(max - min) / 100}
          value={value[0]}
          onChange={e => {
            const v = Number(e.target.value);
            if (v < value[1]) onChange([v, value[1]]);
          }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-4 -top-2"
        />
        {/* Max thumb */}
        <input
          type="range" min={min} max={max} step={(max - min) / 100}
          value={value[1]}
          onChange={e => {
            const v = Number(e.target.value);
            if (v > value[0]) onChange([value[0], v]);
          }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-4 -top-2"
        />
        <div className="absolute w-3 h-3 rounded-full bg-white border-2 border-gray-800 -top-1.5 -translate-x-1/2 pointer-events-none" style={{ left: `${pct(value[0])}%` }} />
        <div className="absolute w-3 h-3 rounded-full bg-white border-2 border-gray-800 -top-1.5 -translate-x-1/2 pointer-events-none" style={{ left: `${pct(value[1])}%` }} />
      </div>
    </div>
  );
}

export function DiamondSelector({ onClose, onSelect, selectedId }: Props) {
  const [activeTab,    setActiveTab]    = useState<'select' | 'guide'>('select');
  const [caratRange,   setCaratRange]   = useState<[number, number]>([0.5, 3.0]);
  const [priceRange,   setPriceRange]   = useState<[number, number]>([5000, 25000]);
  const [activeColors, setActiveColors] = useState<string[]>([]);
  const [activeClarities, setActiveClarities] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sortKey,      setSortKey]      = useState<SortKey>('carat');
  const [sortDir,      setSortDir]      = useState<SortDir>('asc');

  const toggleColor   = (c: string) => setActiveColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  const toggleClarity = (c: string) => setActiveClarities(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const clarityRank: Record<string, number> = { VS2: 0, VS1: 1, VVS2: 2, VVS1: 3, IF: 4, FL: 5 };
  const colorRank:   Record<string, number> = { D: 0, E: 1, F: 2, G: 3, H: 4, I: 5 };

  const filtered = DIAMONDS
    .filter(d => d.carat >= caratRange[0] && d.carat <= caratRange[1])
    .filter(d => d.price >= priceRange[0] && d.price <= priceRange[1])
    .filter(d => activeColors.length === 0    || activeColors.includes(d.color))
    .filter(d => activeClarities.length === 0 || activeClarities.includes(d.clarity))
    .sort((a, b) => {
      let diff = 0;
      if (sortKey === 'carat')   diff = a.carat - b.carat;
      if (sortKey === 'color')   diff = colorRank[a.color] - colorRank[b.color];
      if (sortKey === 'clarity') diff = clarityRank[a.clarity] - clarityRank[b.clarity];
      if (sortKey === 'price')   diff = a.price - b.price;
      return sortDir === 'asc' ? diff : -diff;
    });

  const SortIcon = ({ col }: { col: SortKey }) => (
    sortKey === col
      ? sortDir === 'asc'
        ? <ChevronUp className="w-2.5 h-2.5 inline ml-0.5" strokeWidth={2} />
        : <ChevronDown className="w-2.5 h-2.5 inline ml-0.5" strokeWidth={2} />
      : <ArrowUpDown className="w-2.5 h-2.5 inline ml-0.5 opacity-30" strokeWidth={2} />
  );

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #eee' }}>
        <div className="flex gap-6">
          {(['select', 'guide'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="font-sans pb-1"
              style={{
                fontSize: 13,
                color: activeTab === tab ? GREEN : '#aaa',
                fontWeight: activeTab === tab ? 500 : 300,
                letterSpacing: '0.04em',
                borderBottom: activeTab === tab ? `1px solid ${GREEN}` : '1px solid transparent',
              }}
            >
              {tab === 'select' ? 'Select a Diamond' : 'Guide to Diamonds'}
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} aria-label="Close">
          <X className="w-4 h-4" strokeWidth={1.5} style={{ color: '#999' }} />
        </button>
      </div>

      {activeTab === 'guide' ? (
        <div className="flex-1 px-6 py-8 overflow-y-auto">
          <h3 className="font-display" style={{ fontSize: 22, fontWeight: 300, color: GREEN, marginBottom: 16 }}>
            The Four Cs
          </h3>
          {[
            { title: 'Cut', desc: 'The most important factor in a diamond\'s beauty. An excellent cut maximises brilliance, fire, and scintillation.' },
            { title: 'Colour', desc: 'Graded D (colourless) to Z. D–F are colourless and most rare; G–H appear near-colourless to the naked eye.' },
            { title: 'Clarity', desc: 'Measures inclusions and blemishes. FL (flawless) to VS1 are eye-clean — inclusions invisible without magnification.' },
            { title: 'Carat', desc: 'The weight of the diamond. One carat = 0.2 grams. Larger diamonds are rarer and exponentially more valuable.' },
          ].map(item => (
            <div key={item.title} className="mb-6" style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 20 }}>
              <p className="font-sans uppercase mb-2" style={{ fontSize: 10, letterSpacing: '0.3em', color: '#aaa' }}>{item.title}</p>
              <p className="font-sans" style={{ fontSize: 13, color: '#555', lineHeight: 1.7, fontWeight: 300 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="px-6 py-5 flex flex-col gap-6" style={{ borderBottom: '1px solid #eee' }}>
            <div className="grid grid-cols-2 gap-6">
              <RangeSlider
                label="Carat Weight"
                min={0.5} max={3.0}
                value={caratRange}
                onChange={setCaratRange}
                format={n => n.toFixed(2)}
              />
              <RangeSlider
                label="Price"
                min={2000} max={30000}
                value={priceRange}
                onChange={setPriceRange}
                format={n => `£${(n / 1000).toFixed(0)}k`}
              />
            </div>

            {/* Advanced toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(v => !v)}
              className="flex items-center gap-1.5 font-sans self-start"
              style={{ fontSize: 11, color: '#777', letterSpacing: '0.1em' }}
            >
              Advanced Filters
              {showAdvanced ? <ChevronUp className="w-3 h-3" strokeWidth={1.5} /> : <ChevronDown className="w-3 h-3" strokeWidth={1.5} />}
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-2 gap-6">
                {/* Color */}
                <div>
                  <p className="font-sans uppercase mb-3" style={{ fontSize: 9, letterSpacing: '0.3em', color: '#aaa' }}>Colour</p>
                  <div className="flex gap-2">
                    {COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleColor(c)}
                        className="flex items-center justify-center font-sans border rounded-full transition-colors"
                        style={{
                          width: 32, height: 32, fontSize: 11,
                          borderColor: activeColors.includes(c) ? GREEN : '#ddd',
                          backgroundColor: activeColors.includes(c) ? GREEN : '#fff',
                          color: activeColors.includes(c) ? '#fff' : '#444',
                          fontWeight: 400,
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clarity */}
                <div>
                  <p className="font-sans uppercase mb-3" style={{ fontSize: 9, letterSpacing: '0.3em', color: '#aaa' }}>Clarity</p>
                  <div className="flex flex-wrap gap-2">
                    {CLARITIES.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleClarity(c)}
                        className="font-sans border px-2 py-1 transition-colors"
                        style={{
                          fontSize: 10, letterSpacing: '0.05em',
                          borderColor: activeClarities.includes(c) ? GREEN : '#ddd',
                          backgroundColor: activeClarities.includes(c) ? GREEN : '#fff',
                          color: activeClarities.includes(c) ? '#fff' : '#444',
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results table */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 pt-4 pb-2 flex items-center justify-between">
              <span className="font-sans uppercase" style={{ fontSize: 10, letterSpacing: '0.3em', color: '#aaa' }}>
                Results
              </span>
              <span className="font-sans" style={{ fontSize: 11, color: '#aaa' }}>{filtered.length} diamonds</span>
            </div>

            {/* Column headers */}
            <div
              className="grid px-6 pb-2"
              style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 32px', borderBottom: '1px solid #eee' }}
            >
              {(['carat', 'color', 'clarity', 'price'] as SortKey[]).map(col => (
                <button
                  key={col}
                  type="button"
                  onClick={() => toggleSort(col)}
                  className="font-sans uppercase text-left flex items-center gap-0.5"
                  style={{ fontSize: 9, letterSpacing: '0.25em', color: sortKey === col ? GREEN : '#aaa' }}
                >
                  {col === 'carat' ? 'Carat Wt' : col.charAt(0).toUpperCase() + col.slice(1)}
                  <SortIcon col={col} />
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="py-12 text-center px-6">
                <p className="font-sans" style={{ fontSize: 13, color: '#bbb' }}>No diamonds match your filters.</p>
              </div>
            ) : (
              <div>
                {filtered.map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => onSelect(d)}
                    className="grid w-full px-6 py-3.5 text-left transition-colors hover:bg-gray-50"
                    style={{
                      gridTemplateColumns: '1fr 1fr 1fr 1fr 32px',
                      borderBottom: '1px solid #f5f5f5',
                      backgroundColor: selectedId === d.id ? '#f8f8f6' : undefined,
                    }}
                  >
                    <span className="font-sans" style={{ fontSize: 12, color: GREEN }}>{d.carat.toFixed(2)}</span>
                    <span className="font-sans" style={{ fontSize: 12, color: '#555' }}>{d.color}</span>
                    <span className="font-sans" style={{ fontSize: 12, color: '#555' }}>{d.clarity}</span>
                    <span className="font-sans" style={{ fontSize: 12, color: '#555' }}>£{d.price.toLocaleString('en-GB')}</span>
                    <span
                      className="flex items-center justify-center rounded-full border-2 self-center"
                      style={{
                        width: 18, height: 18,
                        borderColor: selectedId === d.id ? GREEN : '#ccc',
                        backgroundColor: selectedId === d.id ? GREEN : '#fff',
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="grid px-4 py-3 gap-3"
            style={{ gridTemplateColumns: '1fr 1fr', borderTop: '1px solid #eee' }}
          >
            <button
              type="button"
              className="font-sans uppercase py-3 border"
              style={{ fontSize: 10, letterSpacing: '0.2em', color: GREEN, borderColor: GREEN }}
            >
              Need an Expert?
            </button>
            <button
              type="button"
              onClick={() => {
                const sel = filtered.find(d => d.id === selectedId);
                if (sel) onSelect(sel);
                onClose();
              }}
              disabled={!selectedId}
              className="font-sans uppercase py-3 transition-opacity disabled:opacity-40"
              style={{ fontSize: 10, letterSpacing: '0.2em', backgroundColor: GREEN, color: '#fff' }}
            >
              Select This Diamond
            </button>
          </div>
        </>
      )}
    </div>
  );
}
