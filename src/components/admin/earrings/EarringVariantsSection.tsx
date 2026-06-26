'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { EarringVariantAdmin, EarringColour, EarringClarity, EarringAvailability } from '@/lib/earrings/types';
import type { EarringType } from '@/lib/jewellery/types';

const EARRING_TYPES: { value: EarringType; label: string }[] = [
  { value: 'classic_studs',    label: 'Classic Studs' },
  { value: 'halo_studs',       label: 'Halo Studs' },
  { value: 'drop_earrings',    label: 'Drop Earrings' },
  { value: 'pave_hoops',       label: 'Pavé Hoops' },
  { value: 'fixed_composition',label: 'Fixed Composition' },
  { value: 'other',            label: 'Other' },
];
const METALS = [
  { value: 'platinum',        label: 'Platinum' },
  { value: 'white-gold-18k',  label: '18k White Gold' },
  { value: 'yellow-gold-18k', label: '18k Yellow Gold' },
  { value: 'rose-gold-14k',   label: '14k Rose Gold' },
];
const COLOURS: EarringColour[]   = ['D', 'E', 'F'];
const CLARITIES: EarringClarity[] = ['VS2', 'VS1', 'VVS2', 'VVS1', 'IF', 'FL'];
const AVAILABILITIES: EarringAvailability[] = ['available', 'made_to_order', 'reserved', 'sold', 'unavailable'];

type CreateInput = {
  jewellery_product_id: string; metal: string; total_carat: number;
  colour: EarringColour; clarity: EarringClarity; price_gbp: number;
  currency?: string; availability?: EarringAvailability; display_order?: number;
  is_published?: boolean; admin_note?: string | null;
};
type UpdateInput = Partial<Omit<CreateInput, 'jewellery_product_id'>>;

interface Props {
  productId:    string;
  earringType:  EarringType | null;
  variants:     EarringVariantAdmin[];
  hasLiveVariant: boolean;
  saveTypeAction:       (productId: string, type: EarringType | null) => Promise<void>;
  createVariantAction:  (input: CreateInput) => Promise<{ error?: string }>;
  updateVariantAction:  (variantId: string, patch: UpdateInput) => Promise<{ error?: string }>;
  deleteVariantAction:  (variantId: string) => Promise<void>;
  duplicateVariantAction:(variantId: string) => Promise<{ error?: string }>;
}

const card: React.CSSProperties = { border: '1px solid #e8e8e8', background: '#fff', padding: 24, marginTop: 24 };
const inp:  React.CSSProperties = { border: '1px solid #ddd', padding: '6px 8px', fontSize: 13, width: '100%' };
const th:   React.CSSProperties = { textAlign: 'left', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#999', padding: '6px 8px', borderBottom: '1px solid #eee' };
const td:   React.CSSProperties = { fontSize: 13, padding: '6px 8px', borderBottom: '1px solid #f3f3f3' };

export function EarringVariantsSection({
  productId, earringType, variants, hasLiveVariant,
  saveTypeAction, createVariantAction, updateVariantAction, deleteVariantAction, duplicateVariantAction,
}: Props) {
  const router = useRouter();
  const [type, setType]   = useState<EarringType | ''>(earringType ?? '');
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFixed = type === 'fixed_composition';

  // New-variant form state
  const [form, setForm] = useState({
    metal: 'yellow-gold-18k', total_carat: '1.00', colour: 'D' as EarringColour,
    clarity: 'VS1' as EarringClarity, price_gbp: '', availability: 'available' as EarringAvailability,
    display_order: '0', is_published: true, admin_note: '',
  });

  async function run(fn: () => Promise<{ error?: string } | void>) {
    setBusy(true); setError(null);
    const res = await fn();
    setBusy(false);
    if (res && 'error' in res && res.error) { setError(res.error); return false; }
    router.refresh();
    return true;
  }

  async function saveType(next: string) {
    setType(next as EarringType);
    await run(() => saveTypeAction(productId, (next || null) as EarringType | null));
  }

  async function addVariant() {
    const price = parseFloat(form.price_gbp);
    const carat = parseFloat(form.total_carat);
    if (!price || price <= 0) { setError('Enter a price.'); return; }
    if (!carat || carat <= 0) { setError('Enter a total carat weight.'); return; }
    const okDone = await run(() => createVariantAction({
      jewellery_product_id: productId, metal: form.metal, total_carat: carat,
      colour: form.colour, clarity: form.clarity, price_gbp: price,
      availability: form.availability, display_order: parseInt(form.display_order || '0', 10),
      is_published: form.is_published, admin_note: form.admin_note || null,
    }));
    if (okDone) setForm(f => ({ ...f, price_gbp: '', admin_note: '' }));
  }

  return (
    <div style={card}>
      <h2 style={{ fontFamily: 'serif', fontSize: 22, fontWeight: 300 }}>Earring Configuration</h2>

      {/* Product type */}
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 12, color: '#666' }}>Product type</label>
        <select value={type} onChange={e => saveType(e.target.value)} style={{ ...inp, width: 220 }} disabled={busy}>
          <option value="">— not set —</option>
          {EARRING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 99,
          background: hasLiveVariant ? '#e8f5ee' : '#fdf0e8', color: hasLiveVariant ? '#2e7d52' : '#b06a30' }}>
          {hasLiveVariant ? '● Live purchasable configuration' : '○ No live purchasable variant — shown as consultation-only'}
        </span>
      </div>

      {isFixed && (
        <p style={{ fontSize: 12, color: '#999', marginTop: 12, lineHeight: 1.6 }}>
          Fixed-composition earrings are sold as a finished design with no diamond selection. Variants are not required.
        </p>
      )}

      {error && <p style={{ color: '#c0392b', fontSize: 12, marginTop: 12 }}>{error}</p>}

      {/* Variants table */}
      {!isFixed && (
        <>
          <h3 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', marginTop: 24 }}>
            Variants ({variants.length})
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
            <thead>
              <tr>
                {['SKU', 'Metal', 'Carat', 'Colour', 'Clarity', 'Price £', 'Availability', 'Pub.', ''].map(h =>
                  <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {variants.length === 0 && (
                <tr><td style={{ ...td, color: '#bbb' }} colSpan={9}>No variants yet — add one below to make this earring purchasable.</td></tr>
              )}
              {variants.map(v => (
                <VariantRow key={v.id} v={v} busy={busy}
                  onUpdate={(patch) => run(() => updateVariantAction(v.id, patch))}
                  onDelete={() => run(() => deleteVariantAction(v.id))}
                  onDuplicate={() => run(() => duplicateVariantAction(v.id))} />
              ))}
            </tbody>
          </table>

          {/* Add variant */}
          <h3 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', marginTop: 28 }}>Add variant</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginTop: 8, alignItems: 'end' }}>
            <Field label="Metal"><select value={form.metal} onChange={e => setForm(f => ({ ...f, metal: e.target.value }))} style={inp}>{METALS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select></Field>
            <Field label="Carat"><input type="number" step="0.01" value={form.total_carat} onChange={e => setForm(f => ({ ...f, total_carat: e.target.value }))} style={inp} /></Field>
            <Field label="Colour"><select value={form.colour} onChange={e => setForm(f => ({ ...f, colour: e.target.value as EarringColour }))} style={inp}>{COLOURS.map(c => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Clarity"><select value={form.clarity} onChange={e => setForm(f => ({ ...f, clarity: e.target.value as EarringClarity }))} style={inp}>{CLARITIES.map(c => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Price £"><input type="number" step="1" value={form.price_gbp} onChange={e => setForm(f => ({ ...f, price_gbp: e.target.value }))} style={inp} /></Field>
            <Field label="Availability"><select value={form.availability} onChange={e => setForm(f => ({ ...f, availability: e.target.value as EarringAvailability }))} style={inp}>{AVAILABILITIES.map(a => <option key={a} value={a}>{a.replace('_', ' ')}</option>)}</select></Field>
            <button type="button" onClick={addVariant} disabled={busy} style={{ background: '#1a2b1a', color: '#fff', fontSize: 12, padding: '8px 12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Add</button>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} /> Publish immediately
            </label>
            <input placeholder="Internal note (optional, never shown to customers)" value={form.admin_note}
              onChange={e => setForm(f => ({ ...f, admin_note: e.target.value }))} style={{ ...inp, flex: 1 }} />
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa' }}>{label}</span>
      {children}
    </label>
  );
}

function VariantRow({ v, busy, onUpdate, onDelete, onDuplicate }: {
  v: EarringVariantAdmin; busy: boolean;
  onUpdate: (patch: UpdateInput) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
  onDuplicate: () => Promise<boolean>;
}) {
  return (
    <tr>
      <td style={{ ...td, color: '#999', fontFamily: 'monospace', fontSize: 11 }}>{v.sku}</td>
      <td style={td}>{v.metal}</td>
      <td style={td}>{v.total_carat.toFixed(2)}</td>
      <td style={td}>{v.colour}</td>
      <td style={td}>{v.clarity}</td>
      <td style={td}>
        <input defaultValue={v.price_gbp} type="number" step="1" style={{ ...inp, width: 90 }}
          onBlur={e => { const n = parseFloat(e.target.value); if (n && n !== v.price_gbp) onUpdate({ price_gbp: n }); }} />
      </td>
      <td style={td}>
        <select defaultValue={v.availability} style={{ ...inp, width: 130 }}
          onChange={e => onUpdate({ availability: e.target.value as EarringAvailability })} disabled={busy}>
          {AVAILABILITIES.map(a => <option key={a} value={a}>{a.replace('_', ' ')}</option>)}
        </select>
      </td>
      <td style={td}>
        <input type="checkbox" defaultChecked={v.is_published} disabled={busy}
          onChange={e => onUpdate({ is_published: e.target.checked })} />
      </td>
      <td style={{ ...td, whiteSpace: 'nowrap' }}>
        <button type="button" onClick={onDuplicate} disabled={busy} style={{ fontSize: 11, color: '#666', marginRight: 8 }}>Duplicate</button>
        <button type="button" onClick={onDelete} disabled={busy} style={{ fontSize: 11, color: '#c0392b' }}>Delete</button>
      </td>
    </tr>
  );
}
