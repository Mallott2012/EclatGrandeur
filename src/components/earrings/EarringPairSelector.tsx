'use client';

import { useEffect, useState, useMemo } from 'react';
import { X, RotateCw } from 'lucide-react';
import { MatchedPairCard } from './MatchedPairCard';
import type { CompatiblePairCard } from '@/lib/earrings/types';

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

interface Props {
  productId:        string;
  slotKey:          string;
  slotLabel:        string;
  selectedPairId:   string | null;
  disabledPairIds:  Set<string>;
  onSelect:         (pair: CompatiblePairCard) => void;
  onClose:          () => void;
  isSingleSlot:     boolean;
}

type FilterState = {
  shape:   string;
  colour:  string;
  clarity: string;
};

const FILTER_NONE = '';

export function EarringPairSelector({
  productId, slotKey, slotLabel, selectedPairId,
  disabledPairIds, onSelect, onClose, isSingleSlot,
}: Props) {
  const [pairs,   setPairs]   = useState<CompatiblePairCard[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({ shape: FILTER_NONE, colour: FILTER_NONE, clarity: FILTER_NONE });

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/earrings/${productId}/slots/${slotKey}/pairs`)
      .then(r => r.json())
      .then((data: { pairs?: CompatiblePairCard[]; error?: string }) => {
        if (data.error) throw new Error(data.error);
        setPairs(data.pairs ?? []);
      })
      .catch(() => setError('Could not load available pairs. Please try again.'))
      .finally(() => setLoading(false));
  }, [productId, slotKey]);

  const showFilters = (pairs?.length ?? 0) >= 6;

  const distinctShapes  = useMemo(() => [...new Set((pairs ?? []).map(p => p.shape))],  [pairs]);
  const distinctColours = useMemo(() => {
    const vals = (pairs ?? []).map(p => p.colour_description ?? p.colour ?? '').filter(Boolean);
    return [...new Set(vals)];
  }, [pairs]);
  const distinctClarities = useMemo(() => [...new Set((pairs ?? []).map(p => p.clarity ?? '').filter(Boolean))], [pairs]);

  const filtered = useMemo(() => {
    if (!pairs) return [];
    return pairs.filter(p => {
      if (filters.shape   && p.shape !== filters.shape)   return false;
      if (filters.colour  && (p.colour_description ?? p.colour ?? '') !== filters.colour) return false;
      if (filters.clarity && (p.clarity ?? '') !== filters.clarity) return false;
      return true;
    });
  }, [pairs, filters]);

  const heading = isSingleSlot
    ? 'SELECT YOUR DIAMOND PAIR'
    : `SELECT ${slotLabel.toUpperCase()}`;

  return (
    <div className="flex flex-col h-full" style={{ color: G }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-5 flex-shrink-0"
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        <span className="font-sans uppercase" style={{ fontSize: 10, letterSpacing: '0.22em', color: '#999' }}>
          {heading}
        </span>
        <button type="button" onClick={onClose} className="transition-opacity hover:opacity-60">
          <X className="w-4 h-4" style={{ color: '#aaa' }} strokeWidth={1.5} />
        </button>
      </div>

      {/* Filters — only shown for 6+ pairs */}
      {showFilters && !loading && !error && (
        <div
          className="px-6 py-4 flex flex-wrap gap-3 flex-shrink-0"
          style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: '#fafaf9' }}
        >
          {distinctShapes.length > 1 && (
            <FilterChip
              label="Shape"
              options={distinctShapes}
              value={filters.shape}
              onChange={v => setFilters(f => ({ ...f, shape: v }))}
            />
          )}
          {distinctColours.length > 1 && (
            <FilterChip
              label="Colour"
              options={distinctColours}
              value={filters.colour}
              onChange={v => setFilters(f => ({ ...f, colour: v }))}
            />
          )}
          {distinctClarities.length > 1 && (
            <FilterChip
              label="Clarity"
              options={distinctClarities}
              value={filters.clarity}
              onChange={v => setFilters(f => ({ ...f, clarity: v }))}
            />
          )}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <RotateCw className="w-4 h-4 animate-spin" style={{ color: '#ccc' }} strokeWidth={1.5} />
          </div>
        )}

        {error && (
          <p className="font-sans text-center py-8" style={{ fontSize: 12, color: '#aaa' }}>
            {error}
          </p>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p className="font-sans text-center py-8" style={{ fontSize: 12, color: '#aaa' }}>
            No pairs match the selected filters.
          </p>
        )}

        {!loading && !error && filtered.map(pair => (
          <MatchedPairCard
            key={pair.id}
            pair={pair}
            selected={pair.id === selectedPairId}
            disabled={disabledPairIds.has(pair.id) && pair.id !== selectedPairId}
            onSelect={onSelect}
          />
        ))}

        {!loading && !error && filtered.length > 0 && (
          <p
            className="font-sans text-center mt-6 pb-2"
            style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.04em' }}
          >
            {filtered.length} pair{filtered.length !== 1 ? 's' : ''} available
          </p>
        )}
      </div>
    </div>
  );
}

// ── Inline filter chip ────────────────────────────────────────────────────────

function FilterChip({
  label, options, value, onChange,
}: {
  label:    string;
  options:  string[];
  value:    string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-sans" style={{ fontSize: 10, color: '#aaa', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="font-sans"
        style={{
          fontSize: 11, color: '#666', border: `1px solid ${BORDER}`,
          padding: '3px 6px', backgroundColor: '#fff', outline: 'none',
          textTransform: 'capitalize',
        }}
      >
        <option value="">All</option>
        {options.map(o => (
          <option key={o} value={o} style={{ textTransform: 'capitalize' }}>{o}</option>
        ))}
      </select>
    </div>
  );
}
