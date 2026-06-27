'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { EarringOfferAdmin, OfferAvailability } from '@/lib/earrings/offer-types';
import type { EarringType } from '@/lib/jewellery/types';

const EARRING_TYPES: { value: EarringType; label: string }[] = [
  { value: 'classic_studs', label: 'Classic Studs' }, { value: 'halo_studs', label: 'Halo Studs' },
  { value: 'drop_earrings', label: 'Drop Earrings' }, { value: 'pave_hoops', label: 'Pavé Hoops' },
  { value: 'fixed_composition', label: 'Fixed Composition' }, { value: 'other', label: 'Other' },
];
const METALS = [
  { value: 'platinum', label: 'Platinum' }, { value: 'white-gold-18k', label: '18k White Gold' },
  { value: 'yellow-gold-18k', label: '18k Yellow Gold' }, { value: 'rose-gold-14k', label: '14k Rose Gold' },
];
const CUTS = ['round', 'oval', 'princess', 'emerald', 'cushion', 'pear', 'marquise', 'asscher', 'radiant', 'heart'];
const COLOURS = ['D', 'E', 'F'];
const CLARITIES = ['VS2', 'VS1', 'VVS2', 'VVS1', 'IF', 'FL'];
const GRADES = ['', 'excellent', 'very good', 'good'];
const FLUOR = ['', 'none', 'faint', 'medium', 'strong'];
const AVAIL: OfferAvailability[] = ['available', 'made_to_order', 'unavailable'];

type CreateInput = {
  jewellery_product_id: string; supported_metals: string[]; cut: string; total_carat: number;
  carat_per_stone: number | null; colour: string; clarity: string;
  cut_grade: string | null; polish: string | null; symmetry: string | null; fluorescence: string | null;
  price_gbp: number; availability: OfferAvailability; is_published: boolean; display_order: number; admin_note: string | null;
};
type UpdateInput = Partial<Omit<CreateInput, 'jewellery_product_id'>>;

interface Props {
  productId: string;
  earringType: EarringType | null;
  offers: EarringOfferAdmin[];
  hasLiveOffer: boolean;
  saveTypeAction:        (productId: string, type: EarringType | null) => Promise<void>;
  createOfferAction:     (input: CreateInput) => Promise<{ error?: string }>;
  updateOfferAction:     (offerId: string, patch: UpdateInput) => Promise<{ error?: string }>;
  deleteOfferAction:     (offerId: string) => Promise<void>;
  duplicateOfferAction:  (offerId: string) => Promise<{ error?: string }>;
}

const card: React.CSSProperties = { border: '1px solid #e8e8e8', background: '#fff', padding: 24, marginTop: 24 };
const inp:  React.CSSProperties = { border: '1px solid #ddd', padding: '6px 8px', fontSize: 13, width: '100%' };
const th:   React.CSSProperties = { textAlign: 'left', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#999', padding: '6px 8px', borderBottom: '1px solid #eee' };
const td:   React.CSSProperties = { fontSize: 13, padding: '6px 8px', borderBottom: '1px solid #f3f3f3' };

export function EarringOffersSection({
  productId, earringType, offers, hasLiveOffer,
  saveTypeAction, createOfferAction, updateOfferAction, deleteOfferAction, duplicateOfferAction,
}: Props) {
  const router = useRouter();
  const [type, setType] = useState<EarringType | ''>(earringType ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFixed = type === 'fixed_composition';

  const [f, setF] = useState({
    metals: [] as string[], cut: 'round', total_carat: '1.00', carat_per_stone: '0.50',
    colour: 'E', clarity: 'VS1', cut_grade: 'excellent', polish: 'excellent', symmetry: 'excellent',
    fluorescence: 'none', price_gbp: '', availability: 'made_to_order' as OfferAvailability, is_published: true,
  });

  async function run(fn: () => Promise<{ error?: string } | void>) {
    setBusy(true); setError(null);
    const res = await fn(); setBusy(false);
    if (res && 'error' in res && res.error) { setError(res.error); return false; }
    router.refresh(); return true;
  }
  async function saveType(next: string) { setType(next as EarringType); await run(() => saveTypeAction(productId, (next || null) as EarringType | null)); }

  async function add() {
    const price = parseFloat(f.price_gbp); const tc = parseFloat(f.total_carat);
    if (!price || price <= 0) { setError('Enter a price.'); return; }
    if (!tc || tc <= 0) { setError('Enter a total carat weight.'); return; }
    const okDone = await run(() => createOfferAction({
      jewellery_product_id: productId, supported_metals: f.metals, cut: f.cut, total_carat: tc,
      carat_per_stone: f.carat_per_stone ? parseFloat(f.carat_per_stone) : null, colour: f.colour, clarity: f.clarity,
      cut_grade: f.cut_grade || null, polish: f.polish || null, symmetry: f.symmetry || null, fluorescence: f.fluorescence || null,
      price_gbp: price, availability: f.availability, is_published: f.is_published, display_order: offers.length, admin_note: null,
    }));
    if (okDone) setF(s => ({ ...s, price_gbp: '' }));
  }

  return (
    <div style={card}>
      <h2 style={{ fontFamily: 'serif', fontSize: 22, fontWeight: 300 }}>Earring Diamond Offers</h2>

      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 12, color: '#666' }}>Product type</label>
        <select value={type} onChange={e => saveType(e.target.value)} style={{ ...inp, width: 220 }} disabled={busy}>
          <option value="">— not set —</option>
          {EARRING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 99, background: hasLiveOffer ? '#e8f5ee' : '#fdf0e8', color: hasLiveOffer ? '#2e7d52' : '#b06a30' }}>
          {hasLiveOffer ? '● Live offers — customers can configure' : '○ No published offer — shown as consultation-only'}
        </span>
      </div>

      {isFixed && <p style={{ fontSize: 12, color: '#999', marginTop: 12 }}>Fixed-composition earrings need no offers — they sell as a finished design.</p>}
      {error && <p style={{ color: '#c0392b', fontSize: 12, marginTop: 12 }}>{error}</p>}

      {!isFixed && (
        <>
          <h3 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', marginTop: 24 }}>Offers ({offers.length})</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
            <thead><tr>{['SKU', 'Metals', 'Cut', 'Carat', 'Col', 'Clar', 'Price £', 'Availability', 'Pub.', ''].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {offers.length === 0 && <tr><td style={{ ...td, color: '#bbb' }} colSpan={10}>No offers yet — add one below to make this earring configurable.</td></tr>}
              {offers.map(o => (
                <tr key={o.id}>
                  <td style={{ ...td, color: '#999', fontFamily: 'monospace', fontSize: 11 }}>{o.sku}</td>
                  <td style={td}>{o.supported_metals.length ? o.supported_metals.join(', ') : 'all'}</td>
                  <td style={td}>{o.cut}</td>
                  <td style={td}>{o.total_carat.toFixed(2)}</td>
                  <td style={td}>{o.colour}</td>
                  <td style={td}>{o.clarity}</td>
                  <td style={td}><input defaultValue={o.price_gbp} type="number" step="1" style={{ ...inp, width: 90 }} onBlur={e => { const n = parseFloat(e.target.value); if (n && n !== o.price_gbp) run(() => updateOfferAction(o.id, { price_gbp: n })); }} /></td>
                  <td style={td}><select defaultValue={o.availability} style={{ ...inp, width: 130 }} disabled={busy} onChange={e => run(() => updateOfferAction(o.id, { availability: e.target.value as OfferAvailability }))}>{AVAIL.map(a => <option key={a} value={a}>{a.replace('_', ' ')}</option>)}</select></td>
                  <td style={td}><input type="checkbox" defaultChecked={o.is_published} disabled={busy} onChange={e => run(() => updateOfferAction(o.id, { is_published: e.target.checked }))} /></td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>
                    <button type="button" onClick={() => run(() => duplicateOfferAction(o.id))} disabled={busy} style={{ fontSize: 11, color: '#666', marginRight: 8 }}>Duplicate</button>
                    <button type="button" onClick={() => run(() => deleteOfferAction(o.id))} disabled={busy} style={{ fontSize: 11, color: '#c0392b' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', marginTop: 28 }}>Add offer</h3>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa' }}>Metals (none = all):</span>
            {METALS.map(m => (
              <label key={m.value} style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>
                <input type="checkbox" checked={f.metals.includes(m.value)} onChange={e => setF(s => ({ ...s, metals: e.target.checked ? [...s.metals, m.value] : s.metals.filter(x => x !== m.value) }))} /> {m.label}
              </label>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginTop: 10, alignItems: 'end' }}>
            <Field label="Cut"><select value={f.cut} onChange={e => setF(s => ({ ...s, cut: e.target.value }))} style={inp}>{CUTS.map(c => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Total ct"><input type="number" step="0.01" value={f.total_carat} onChange={e => setF(s => ({ ...s, total_carat: e.target.value }))} style={inp} /></Field>
            <Field label="Ct each"><input type="number" step="0.01" value={f.carat_per_stone} onChange={e => setF(s => ({ ...s, carat_per_stone: e.target.value }))} style={inp} /></Field>
            <Field label="Colour"><select value={f.colour} onChange={e => setF(s => ({ ...s, colour: e.target.value }))} style={inp}>{COLOURS.map(c => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Clarity"><select value={f.clarity} onChange={e => setF(s => ({ ...s, clarity: e.target.value }))} style={inp}>{CLARITIES.map(c => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Price £"><input type="number" step="1" value={f.price_gbp} onChange={e => setF(s => ({ ...s, price_gbp: e.target.value }))} style={inp} /></Field>
            <Field label="Cut grade"><select value={f.cut_grade} onChange={e => setF(s => ({ ...s, cut_grade: e.target.value }))} style={inp}>{GRADES.map(g => <option key={g} value={g}>{g || '—'}</option>)}</select></Field>
            <Field label="Polish"><select value={f.polish} onChange={e => setF(s => ({ ...s, polish: e.target.value }))} style={inp}>{GRADES.map(g => <option key={g} value={g}>{g || '—'}</option>)}</select></Field>
            <Field label="Symmetry"><select value={f.symmetry} onChange={e => setF(s => ({ ...s, symmetry: e.target.value }))} style={inp}>{GRADES.map(g => <option key={g} value={g}>{g || '—'}</option>)}</select></Field>
            <Field label="Fluor."><select value={f.fluorescence} onChange={e => setF(s => ({ ...s, fluorescence: e.target.value }))} style={inp}>{FLUOR.map(g => <option key={g} value={g}>{g || '—'}</option>)}</select></Field>
            <Field label="Availability"><select value={f.availability} onChange={e => setF(s => ({ ...s, availability: e.target.value as OfferAvailability }))} style={inp}>{AVAIL.map(a => <option key={a} value={a}>{a.replace('_', ' ')}</option>)}</select></Field>
            <button type="button" onClick={add} disabled={busy} style={{ background: '#1a2b1a', color: '#fff', fontSize: 12, padding: '8px 12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Add offer</button>
          </div>
          <label style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <input type="checkbox" checked={f.is_published} onChange={e => setF(s => ({ ...s, is_published: e.target.checked }))} /> Publish immediately
          </label>
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
