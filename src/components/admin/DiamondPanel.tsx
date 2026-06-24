'use client';

import { useState, useTransition } from 'react';
import { Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import type {
  DiamondCut, DiamondColour, DiamondClarity,
  DiamondGrade, DiamondFluorescence, DiamondStatus,
} from '@/lib/diamonds/types';

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DiamondRow {
  id:           string;
  sku:          string;
  cut:          DiamondCut;
  carat:        number;
  colour:       DiamondColour;
  clarity:      DiamondClarity;
  price_gbp:    number;
  status:       DiamondStatus;
  is_published: boolean;
  fluorescence: DiamondFluorescence;
  cut_grade:    DiamondGrade | null;
  polish:       DiamondGrade | null;
  symmetry:     DiamondGrade | null;
  gia_report_number: string | null;
  gia_report_url:    string | null;
  notes:        string | null;
}

export interface DiamondPanelProps {
  diamonds:    DiamondRow[];
  assignedIds: string[];
  onAssign:    (id: string) => Promise<void>;
  onUnassign:  (id: string) => Promise<void>;
  onCreate:    (data: Omit<DiamondRow, 'id' | 'sku'>) => Promise<DiamondRow>;
  onUpdate:    (id: string, data: Partial<Omit<DiamondRow, 'id' | 'sku'>>) => Promise<void>;
  onDelete:    (id: string) => Promise<void>;
}

// ── Enum option lists ─────────────────────────────────────────────────────────

const CUTS: DiamondCut[]     = ['round','princess','cushion','oval','emerald','pear','marquise','radiant','asscher','heart'];
const COLOURS: DiamondColour[] = ['D','E','F','G','H','I','J'];
const CLARITIES: DiamondClarity[] = ['FL','IF','VVS1','VVS2','VS1','VS2','SI1','SI2'];
const GRADES: (DiamondGrade | '')[] = ['','excellent','very_good','good','fair','poor'];
const FLUORESCENCES: DiamondFluorescence[] = ['none','faint','medium','strong','very_strong'];

const CUT_LABELS: Record<DiamondCut, string> = {
  round:'Round Brilliant', princess:'Princess', cushion:'Cushion', oval:'Oval',
  emerald:'Emerald', pear:'Pear', marquise:'Marquise', radiant:'Radiant', asscher:'Asscher', heart:'Heart',
};

const GRADE_LABELS: Record<string, string> = {
  '':'—', excellent:'Excellent', very_good:'Very Good', good:'Good', fair:'Fair', poor:'Poor',
};

const FLUORESCENCE_LABELS: Record<DiamondFluorescence, string> = {
  none:'None', faint:'Faint', medium:'Medium', strong:'Strong', very_strong:'Very Strong',
};

// ── Blank diamond for "add new" ───────────────────────────────────────────────

function blankDiamond(): Omit<DiamondRow, 'id' | 'sku'> {
  return {
    cut: 'round', carat: 1.00, colour: 'G', clarity: 'VS1',
    price_gbp: 0, status: 'available', is_published: false,
    fluorescence: 'none', cut_grade: null, polish: null, symmetry: null,
    gia_report_number: null, gia_report_url: null, notes: null,
  };
}

// ── Small select helper ───────────────────────────────────────────────────────

function Sel<T extends string>({
  label, value, options, labels, onChange,
}: {
  label: string;
  value: T | '';
  options: (T | '')[];
  labels?: Record<string, string>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.2em', color: '#aaa' }}>{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value as T)}
        className="font-sans border focus:outline-none"
        style={{ fontSize: 12, padding: '5px 8px', color: G, borderColor: BORDER, background: '#fff' }}
      >
        {options.map(o => (
          <option key={o} value={o}>{labels ? labels[o] ?? o : o || '—'}</option>
        ))}
      </select>
    </div>
  );
}

function NumInput({ label, value, onChange, step = '0.01', min = '0' }: {
  label: string; value: number; onChange: (v: number) => void; step?: string; min?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.2em', color: '#aaa' }}>{label}</span>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="font-sans border focus:outline-none"
        style={{ fontSize: 12, padding: '5px 8px', color: G, borderColor: BORDER, background: '#fff', width: '100%' }}
      />
    </div>
  );
}

// ── Diamond edit modal ────────────────────────────────────────────────────────

function DiamondModal({
  initial,
  onSave,
  onClose,
  title,
}: {
  initial: Omit<DiamondRow, 'id' | 'sku'>;
  onSave:  (data: Omit<DiamondRow, 'id' | 'sku'>) => Promise<void>;
  onClose: () => void;
  title:   string;
}) {
  const [data,    setData]    = useState({ ...initial });
  const [pending, startT]     = useTransition();
  const [error,   setError]   = useState('');

  function set<K extends keyof typeof data>(k: K, v: typeof data[K]) {
    setData(d => ({ ...d, [k]: v }));
  }

  function submit() {
    startT(async () => {
      try {
        await onSave(data);
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong');
      }
    });
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ border: `1px solid ${BORDER}` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <h2 className="font-display" style={{ fontSize: 18, fontWeight: 300, letterSpacing: '0.06em', color: G }}>
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="w-4 h-4" style={{ color: '#aaa' }} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-6">

          {/* Row 1: Cut, Carat */}
          <div className="grid grid-cols-2 gap-4">
            <Sel
              label="Cut" value={data.cut} options={CUTS}
              labels={CUT_LABELS as Record<string, string>}
              onChange={v => set('cut', v)}
            />
            <NumInput label="Carat" value={data.carat} step="0.01" min="0.01" onChange={v => set('carat', v)} />
          </div>

          {/* Row 2: Colour, Clarity */}
          <div className="grid grid-cols-2 gap-4">
            <Sel label="Colour" value={data.colour} options={COLOURS} onChange={v => set('colour', v)} />
            <Sel label="Clarity" value={data.clarity} options={CLARITIES} onChange={v => set('clarity', v)} />
          </div>

          {/* Row 3: Price, Status */}
          <div className="grid grid-cols-2 gap-4">
            <NumInput label="Price (£)" value={data.price_gbp} step="1" min="0" onChange={v => set('price_gbp', v)} />
            <Sel
              label="Status" value={data.status}
              options={['available','sold'] as DiamondStatus[]}
              onChange={v => set('status', v)}
            />
          </div>

          {/* Row 4: Cut grade, Polish, Symmetry */}
          <div className="grid grid-cols-3 gap-4">
            <Sel
              label="Cut Grade" value={data.cut_grade ?? ''} options={GRADES}
              labels={GRADE_LABELS} onChange={v => set('cut_grade', v as DiamondGrade | null)}
            />
            <Sel
              label="Polish" value={data.polish ?? ''} options={GRADES}
              labels={GRADE_LABELS} onChange={v => set('polish', v as DiamondGrade | null)}
            />
            <Sel
              label="Symmetry" value={data.symmetry ?? ''} options={GRADES}
              labels={GRADE_LABELS} onChange={v => set('symmetry', v as DiamondGrade | null)}
            />
          </div>

          {/* Row 5: Fluorescence */}
          <div className="grid grid-cols-2 gap-4">
            <Sel
              label="Fluorescence" value={data.fluorescence} options={FLUORESCENCES}
              labels={FLUORESCENCE_LABELS as Record<string, string>}
              onChange={v => set('fluorescence', v)}
            />
          </div>

          {/* GIA */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.2em', color: '#aaa' }}>GIA Report No.</span>
              <input
                type="text"
                value={data.gia_report_number ?? ''}
                onChange={e => set('gia_report_number', e.target.value || null)}
                className="font-sans border focus:outline-none"
                style={{ fontSize: 12, padding: '5px 8px', color: G, borderColor: BORDER }}
                placeholder="Optional"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.2em', color: '#aaa' }}>GIA Report URL</span>
              <input
                type="url"
                value={data.gia_report_url ?? ''}
                onChange={e => set('gia_report_url', e.target.value || null)}
                className="font-sans border focus:outline-none"
                style={{ fontSize: 12, padding: '5px 8px', color: G, borderColor: BORDER }}
                placeholder="https://…"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-0.5">
            <span className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.2em', color: '#aaa' }}>Notes</span>
            <textarea
              value={data.notes ?? ''}
              onChange={e => set('notes', e.target.value || null)}
              rows={3}
              className="font-sans border focus:outline-none resize-y"
              style={{ fontSize: 12, padding: '6px 8px', color: G, borderColor: BORDER }}
              placeholder="Optional internal notes"
            />
          </div>

          {/* Published */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.is_published}
              onChange={e => set('is_published', e.target.checked)}
              className="h-4 w-4"
              style={{ accentColor: G }}
            />
            <span className="font-sans uppercase" style={{ fontSize: 10, letterSpacing: '0.16em', color: '#888' }}>
              Published (visible on storefront)
            </span>
          </label>

          {error && (
            <p className="font-sans text-xs" style={{ color: '#e05050' }}>{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 px-8 py-5" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button
            type="button"
            onClick={onClose}
            className="font-sans uppercase transition-opacity hover:opacity-60"
            style={{ fontSize: 10, letterSpacing: '0.18em', color: '#aaa' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="font-sans uppercase flex items-center gap-2 transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ fontSize: 10, letterSpacing: '0.18em', color: '#fff', background: G, padding: '10px 24px' }}
          >
            <Check className="w-3 h-3" strokeWidth={2.5} />
            {pending ? 'Saving…' : 'Save Diamond'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function DiamondPanel({
  diamonds: initialDiamonds,
  assignedIds: initialAssigned,
  onAssign,
  onUnassign,
  onCreate,
  onUpdate,
  onDelete,
}: DiamondPanelProps) {
  const [diamonds,    setDiamonds]    = useState<DiamondRow[]>(initialDiamonds);
  const [assignedIds, setAssignedIds] = useState<string[]>(initialAssigned);
  const [modal,       setModal]       = useState<{ mode: 'create' } | { mode: 'edit'; diamond: DiamondRow } | null>(null);
  const [expanded,    setExpanded]    = useState<string | null>(null);
  const [pending,     startT]         = useTransition();

  const assignedSet = new Set(assignedIds);

  function toggleAssign(d: DiamondRow) {
    const isAssigned = assignedSet.has(d.id);
    startT(async () => {
      if (isAssigned) {
        await onUnassign(d.id);
        setAssignedIds(ids => ids.filter(i => i !== d.id));
      } else {
        await onAssign(d.id);
        setAssignedIds(ids => [...ids, d.id]);
      }
    });
  }

  async function handleCreate(data: Omit<DiamondRow, 'id' | 'sku'>) {
    const created = await onCreate(data);
    setDiamonds(ds => [created, ...ds]);
    setAssignedIds(ids => [...ids, created.id]);
  }

  async function handleUpdate(id: string, data: Partial<Omit<DiamondRow, 'id' | 'sku'>>) {
    await onUpdate(id, data);
    setDiamonds(ds => ds.map(d => d.id === id ? { ...d, ...data } : d));
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this diamond permanently?')) return;
    startT(async () => {
      await onDelete(id);
      setDiamonds(ds => ds.filter(d => d.id !== id));
      setAssignedIds(ids => ids.filter(i => i !== id));
    });
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-sans uppercase" style={{ fontSize: 10, letterSpacing: '0.24em', color: '#bbb' }}>
          Diamonds — {assignedIds.length} assigned
        </span>
        <button
          type="button"
          onClick={() => setModal({ mode: 'create' })}
          className="flex items-center gap-1.5 font-sans uppercase transition-opacity hover:opacity-70"
          style={{ fontSize: 9, letterSpacing: '0.2em', color: G, border: `1px solid ${G}`, padding: '6px 12px' }}
        >
          <Plus className="w-3 h-3" strokeWidth={2.5} />
          Add Diamond
        </button>
      </div>

      {/* Diamond rows */}
      <div className={`space-y-px ${pending ? 'opacity-60 pointer-events-none' : ''}`}>
        {diamonds.length === 0 && (
          <p className="font-sans py-8 text-center" style={{ fontSize: 13, color: '#ccc' }}>
            No diamonds yet. Add one above.
          </p>
        )}

        {diamonds.map(d => {
          const isAssigned = assignedSet.has(d.id);
          const isExpanded = expanded === d.id;

          return (
            <div
              key={d.id}
              style={{
                border: `1px solid ${isAssigned ? '#c6e4d0' : BORDER}`,
                background: isAssigned ? '#f5fbf7' : '#fff',
              }}
            >
              {/* Main row */}
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Assign toggle */}
                <button
                  type="button"
                  onClick={() => toggleAssign(d)}
                  title={isAssigned ? 'Remove from product' : 'Assign to product'}
                  className="flex-shrink-0 w-5 h-5 flex items-center justify-center border transition-colors"
                  style={{
                    borderColor: isAssigned ? '#4a9e6b' : '#ddd',
                    background:  isAssigned ? '#4a9e6b' : '#fff',
                  }}
                >
                  {isAssigned && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </button>

                {/* Diamond summary */}
                <div className="flex-1 grid grid-cols-4 gap-3 min-w-0">
                  <div>
                    <span className="font-sans block" style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.08em' }}>
                      {d.cut.charAt(0).toUpperCase() + d.cut.slice(1)} · {d.carat}ct
                    </span>
                    <span className="font-mono block" style={{ fontSize: 10, color: '#ccc' }}>{d.sku}</span>
                  </div>
                  <div className="self-center">
                    <span className="font-sans" style={{ fontSize: 12, color: G }}>
                      {d.colour} · {d.clarity}
                    </span>
                  </div>
                  <div className="self-center">
                    <span className="font-sans" style={{ fontSize: 12, color: G }}>
                      £{d.price_gbp.toLocaleString('en-GB')}
                    </span>
                  </div>
                  <div className="self-center">
                    <span
                      className="font-sans"
                      style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
                        color: d.status === 'sold' ? '#e05050' : d.is_published ? '#4a9e6b' : '#bbb' }}
                    >
                      {d.status === 'sold' ? 'Sold' : d.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Expand for details */}
                  <button
                    type="button"
                    onClick={() => setExpanded(e => e === d.id ? null : d.id)}
                    aria-label="Details"
                    style={{ color: '#ccc' }}
                  >
                    {isExpanded
                      ? <ChevronUp className="w-3.5 h-3.5" strokeWidth={2} />
                      : <ChevronDown className="w-3.5 h-3.5" strokeWidth={2} />}
                  </button>

                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => setModal({ mode: 'edit', diamond: d })}
                    aria-label="Edit diamond"
                    className="transition-opacity hover:opacity-60"
                    style={{ color: G }}
                  >
                    <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDelete(d.id)}
                    aria-label="Delete diamond"
                    className="transition-opacity hover:opacity-60"
                    style={{ color: '#e05050' }}
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* Expanded detail row */}
              {isExpanded && (
                <div
                  className="px-4 pb-4 grid grid-cols-3 gap-3"
                  style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12 }}
                >
                  {d.cut_grade  && <div><span style={{ fontSize: 9, color: '#aaa', letterSpacing: '0.16em' }}>CUT</span><p style={{ fontSize: 12, color: G }}>{d.cut_grade}</p></div>}
                  {d.polish     && <div><span style={{ fontSize: 9, color: '#aaa', letterSpacing: '0.16em' }}>POLISH</span><p style={{ fontSize: 12, color: G }}>{d.polish}</p></div>}
                  {d.symmetry   && <div><span style={{ fontSize: 9, color: '#aaa', letterSpacing: '0.16em' }}>SYMMETRY</span><p style={{ fontSize: 12, color: G }}>{d.symmetry}</p></div>}
                  <div><span style={{ fontSize: 9, color: '#aaa', letterSpacing: '0.16em' }}>FLUORESCENCE</span><p style={{ fontSize: 12, color: G }}>{d.fluorescence}</p></div>
                  {d.gia_report_number && (
                    <div className="col-span-2">
                      <span style={{ fontSize: 9, color: '#aaa', letterSpacing: '0.16em' }}>GIA</span>
                      <p style={{ fontSize: 12, color: G }}>
                        {d.gia_report_url
                          ? <a href={d.gia_report_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>{d.gia_report_number}</a>
                          : d.gia_report_number}
                      </p>
                    </div>
                  )}
                  {d.notes && (
                    <div className="col-span-3">
                      <span style={{ fontSize: 9, color: '#aaa', letterSpacing: '0.16em' }}>NOTES</span>
                      <p style={{ fontSize: 12, color: '#666' }}>{d.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modal?.mode === 'create' && (
        <DiamondModal
          title="Add Diamond"
          initial={blankDiamond()}
          onSave={handleCreate}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.mode === 'edit' && (
        <DiamondModal
          title={`Edit Diamond — ${modal.diamond.sku}`}
          initial={modal.diamond}
          onSave={data => handleUpdate(modal.diamond.id, data)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
