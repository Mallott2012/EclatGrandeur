'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Diamond } from '@/lib/diamonds/types';
import type { CreatePairInput } from '@/lib/pairs/types';

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

interface LockState {
  [diamondId: string]: boolean;
}

interface Props {
  diamonds:  Diamond[];
  lockState: LockState;   // diamondId → isLockedByActivePair
  createAction: (input: CreatePairInput) => Promise<{ id: string } | { error: string }>;
}

const SHAPES = [
  { value: 'round',    label: 'Round'    },
  { value: 'oval',     label: 'Oval'     },
  { value: 'cushion',  label: 'Cushion'  },
  { value: 'emerald',  label: 'Emerald'  },
  { value: 'pear',     label: 'Pear'     },
  { value: 'radiant',  label: 'Radiant'  },
  { value: 'princess', label: 'Princess' },
  { value: 'marquise', label: 'Marquise' },
  { value: 'asscher',  label: 'Asscher'  },
  { value: 'heart',    label: 'Heart'    },
];

export function CreatePairForm({ diamonds, lockState, createAction }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [search, setSearch]             = useState('');
  const [selectedA, setSelectedA]       = useState<string | null>(null);
  const [selectedB, setSelectedB]       = useState<string | null>(null);
  const [globalError, setGlobalError]   = useState<string | null>(null);

  // Pair metadata fields
  const [shape, setShape]           = useState('round');
  const [pairPrice, setPairPrice]   = useState('');
  const [totalCarat, setTotalCarat] = useState('');
  const [caratPerStone, setCaratPerStone] = useState('');
  const [pairSku, setPairSku]       = useState('');
  const [clarity, setClarity]       = useState('');
  const [colour, setColour]         = useState('');
  const [notes, setNotes]           = useState('');
  const [publishOnSave, setPublishOnSave] = useState(false);

  const filtered = diamonds.filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.sku.toLowerCase().includes(q) ||
      d.cut.toLowerCase().includes(q) ||
      (d.colour?.toLowerCase() ?? '').includes(q) ||
      (d.clarity?.toLowerCase() ?? '').includes(q)
    );
  });

  const dA = diamonds.find(d => d.id === selectedA);
  const dB = diamonds.find(d => d.id === selectedB);

  function toggleSelect(id: string) {
    if (selectedA === id) { setSelectedA(null); return; }
    if (selectedB === id) { setSelectedB(null); return; }
    if (!selectedA) { setSelectedA(id); return; }
    if (!selectedB) { setSelectedB(id); return; }
    // Already 2 selected — replace A, shift A→B
    setSelectedA(selectedB);
    setSelectedB(id);
  }

  function getRowWarning(d: Diamond): string | null {
    if (d.status === 'sold') return 'Sold';
    if (!d.is_published) return 'Unpublished';
    if (lockState[d.id]) return 'In active pair';
    if (d.status === 'reserved') return 'Reserved';
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);

    if (!selectedA || !selectedB) {
      setGlobalError('Select exactly two distinct diamonds.');
      return;
    }
    if (selectedA === selectedB) {
      setGlobalError('Constituent diamonds must be distinct.');
      return;
    }

    const price = parseFloat(pairPrice);
    const carat = parseFloat(totalCarat);

    if (isNaN(price) || price <= 0) {
      setGlobalError('Pair price must be a positive number.');
      return;
    }
    if (isNaN(carat) || carat <= 0) {
      setGlobalError('Total carat must be a positive number.');
      return;
    }

    const daCat = dA?.diamond_category ?? 'white';

    const input: CreatePairInput = {
      diamond_id_a:    selectedA,
      diamond_id_b:    selectedB,
      shape,
      diamond_category: daCat,
      colour_family:   dA?.colour_family ?? null,
      colour:          colour || null,
      clarity:         clarity || null,
      total_carat:     carat,
      carat_per_stone: caratPerStone ? parseFloat(caratPerStone) : null,
      pair_price_gbp:  price,
      matching_notes:  notes || null,
      pair_sku:        pairSku || undefined,
    };

    startTransition(async () => {
      const result = await createAction(input);
      if ('error' in result) {
        setGlobalError(result.error);
        return;
      }
      if (publishOnSave) {
        // Note: publishPairValidated is called server-side on the edit page.
        // For create+publish, we redirect to edit page which will show publish option.
      }
      router.push(`/admin/diamond-pairs/${result.id}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* Diamond Selection */}
      <div>
        <SectionHeader>Select Two Constituent Diamonds</SectionHeader>

        {/* Selected summary */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {[{ label: 'Diamond A', id: selectedA, d: dA }, { label: 'Diamond B', id: selectedB, d: dB }].map(({ label, id, d }) => (
            <div
              key={label}
              className="rounded"
              style={{ border: `1px solid ${id ? G : BORDER}`, padding: '12px 14px', minHeight: 60 }}
            >
              <p className="font-sans uppercase mb-1" style={{ fontSize: 8, letterSpacing: '0.3em', color: '#bbb' }}>{label}</p>
              {d ? (
                <>
                  <p className="font-mono" style={{ fontSize: 12, color: G }}>{d.sku}</p>
                  <p className="font-sans" style={{ fontSize: 11, color: '#888' }}>
                    {d.cut} · {d.carat.toFixed(2)} ct · {d.colour ?? d.colour_family ?? '—'}
                    {d.clarity ? ` · ${d.clarity}` : ''}
                  </p>
                </>
              ) : (
                <p className="font-sans" style={{ fontSize: 11, color: '#ccc' }}>Not selected</p>
              )}
            </div>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Filter by SKU, cut, colour, clarity…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full font-sans mb-4"
          style={{ fontSize: 12, border: `1px solid ${BORDER}`, padding: '8px 12px', outline: 'none', color: G }}
        />

        {/* Diamond table */}
        <div style={{ maxHeight: 340, overflowY: 'auto', border: `1px solid ${BORDER}` }}>
          <table className="w-full font-sans" style={{ borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#fafafa' }}>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {['', 'SKU', 'Cut', 'Carat', 'Colour', 'Clarity', 'Status', 'Warning'].map(h => (
                  <th key={h} className="text-left py-2 px-3" style={{ fontSize: 9, letterSpacing: '0.22em', color: '#ccc', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const warn    = getRowWarning(d);
                const isSelA  = selectedA === d.id;
                const isSelB  = selectedB === d.id;
                const isSel   = isSelA || isSelB;
                const rowBg   = isSelA ? '#f0f7f2' : isSelB ? '#f7f0f2' : 'white';

                return (
                  <tr
                    key={d.id}
                    onClick={() => toggleSelect(d.id)}
                    className="cursor-pointer"
                    style={{ borderBottom: `1px solid ${BORDER}`, background: rowBg }}
                  >
                    <td className="py-3 px-3 w-6">
                      <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 2, border: `1.5px solid ${isSel ? G : '#ccc'}`, background: isSel ? G : 'transparent' }} />
                    </td>
                    <td className="py-3 px-3 font-mono" style={{ fontSize: 11, color: '#888' }}>{d.sku}</td>
                    <td className="py-3 px-3" style={{ fontSize: 12, color: G }}>{d.cut}</td>
                    <td className="py-3 px-3" style={{ fontSize: 12 }}>{d.carat.toFixed(2)}</td>
                    <td className="py-3 px-3" style={{ fontSize: 12, color: '#666' }}>{d.colour ?? d.colour_family ?? '—'}</td>
                    <td className="py-3 px-3" style={{ fontSize: 12, color: '#666' }}>{d.clarity ?? '—'}</td>
                    <td className="py-3 px-3">
                      <StatusDot status={d.status} />
                    </td>
                    <td className="py-3 px-3">
                      {warn && (
                        <span className="font-sans" style={{ fontSize: 10, color: '#c9a84c', letterSpacing: '0.06em' }}>⚠ {warn}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center font-sans" style={{ fontSize: 12, color: '#ccc' }}>
                    No diamonds match the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="font-sans mt-2" style={{ fontSize: 10, color: '#bbb' }}>
          Click to select. First click = Diamond A, second = Diamond B. Click again to deselect.
        </p>
      </div>

      {/* Pair Metadata */}
      <div>
        <SectionHeader>Pair Details</SectionHeader>
        <div className="grid grid-cols-2 gap-5">
          <Field label="Shape *">
            <select
              value={shape}
              onChange={e => setShape(e.target.value)}
              className="w-full font-sans"
              style={{ fontSize: 12, border: `1px solid ${BORDER}`, padding: '8px 10px', color: G }}
            >
              {SHAPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>

          <Field label="Total Carat *">
            <TextInput value={totalCarat} onChange={setTotalCarat} placeholder="e.g. 2.40" type="number" step="0.01" />
          </Field>

          <Field label="Carat Per Stone">
            <TextInput value={caratPerStone} onChange={setCaratPerStone} placeholder="e.g. 1.20" type="number" step="0.01" />
          </Field>

          <Field label="Pair Price GBP *">
            <TextInput value={pairPrice} onChange={setPairPrice} placeholder="e.g. 12000" type="number" step="1" />
          </Field>

          <Field label="Colour">
            <TextInput value={colour} onChange={setColour} placeholder="e.g. D, Fancy Yellow" />
          </Field>

          <Field label="Clarity">
            <TextInput value={clarity} onChange={setClarity} placeholder="e.g. VVS1" />
          </Field>

          <Field label="Pair SKU (auto-generated if blank)">
            <TextInput value={pairSku} onChange={setPairSku} placeholder="Leave blank for auto-SKU" />
          </Field>
        </div>

        <Field label="Internal Matching Notes" className="mt-5">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className="w-full font-sans resize-none"
            style={{ fontSize: 12, border: `1px solid ${BORDER}`, padding: '8px 10px', color: G }}
            placeholder="Internal notes — not shown to customers"
          />
        </Field>
      </div>

      {globalError && (
        <p className="font-sans" style={{ fontSize: 12, color: '#d44', padding: '10px 14px', background: '#fff5f5', border: '1px solid #fcc' }}>
          {globalError}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
        <button
          type="submit"
          disabled={pending}
          className="font-sans uppercase transition-opacity disabled:opacity-40"
          style={{ fontSize: 10, letterSpacing: '0.2em', color: 'white', background: G, padding: '11px 24px', border: 'none' }}
        >
          {pending ? 'Saving…' : 'Save as Draft'}
        </button>
        <a
          href="/admin/diamond-pairs"
          className="font-sans uppercase"
          style={{ fontSize: 10, letterSpacing: '0.18em', color: '#aaa' }}
        >
          Cancel
        </a>
      </div>
    </form>
  );
}

// ── Shared micro-components ───────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="font-sans uppercase mb-4"
      style={{ fontSize: 9, letterSpacing: '0.3em', color: '#bbb', borderBottom: `1px solid ${BORDER}`, paddingBottom: 8 }}
    >
      {children}
    </h2>
  );
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="font-sans uppercase block mb-1" style={{ fontSize: 9, letterSpacing: '0.22em', color: '#aaa' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({
  value, onChange, placeholder = '', type = 'text', step,
}: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; step?: string }) {
  return (
    <input
      type={type}
      step={step}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full font-sans"
      style={{ fontSize: 12, border: `1px solid ${BORDER}`, padding: '8px 10px', color: G, outline: 'none' }}
    />
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = { available: '#4a9e6b', reserved: '#c9a84c', sold: '#bbb' };
  return (
    <span className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.2em', color: colors[status] ?? '#999' }}>
      {status}
    </span>
  );
}
