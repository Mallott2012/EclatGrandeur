'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { DiamondPairAdmin } from '@/lib/pairs/types';

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

const GBP = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });

interface Props {
  pair:            DiamondPairAdmin;
  canChangeDiamonds: boolean;
  updateAction:    (id: string, patch: Record<string, unknown>) => Promise<{ error?: string }>;
  publishAction:   (id: string) => Promise<{ errors: string[] }>;
  unpublishAction: (id: string) => Promise<{ error?: string }>;
  deleteAction:    (id: string) => Promise<void>;
  canDelete:       boolean;
}

export function EditPairForm({
  pair,
  canChangeDiamonds,
  updateAction,
  publishAction,
  unpublishAction,
  deleteAction,
  canDelete,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [pairSku, setPairSku]       = useState(pair.pair_sku);
  const [pairPrice, setPairPrice]   = useState(pair.pair_price_gbp.toString());
  const [totalCarat, setTotalCarat] = useState(pair.total_carat.toString());
  const [caratPerStone, setCaratPerStone] = useState(pair.carat_per_stone?.toString() ?? '');
  const [colour, setColour]         = useState(pair.colour ?? '');
  const [clarity, setClarity]       = useState(pair.clarity ?? '');
  const [notes, setNotes]           = useState(pair.matching_notes ?? '');
  const [saveMsg, setSaveMsg]       = useState<string | null>(null);
  const [saveErr, setSaveErr]       = useState<string | null>(null);
  const [pubErrors, setPubErrors]   = useState<string[]>([]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveMsg(null);
    setSaveErr(null);

    const price = parseFloat(pairPrice);
    const carat = parseFloat(totalCarat);

    if (isNaN(price) || price <= 0) { setSaveErr('Pair price must be greater than zero.'); return; }
    if (isNaN(carat) || carat <= 0) { setSaveErr('Total carat must be greater than zero.'); return; }

    startTransition(async () => {
      const result = await updateAction(pair.id, {
        pair_sku:       pairSku,
        pair_price_gbp: price,
        total_carat:    carat,
        carat_per_stone: caratPerStone ? parseFloat(caratPerStone) : null,
        colour:          colour || null,
        clarity:         clarity || null,
        matching_notes:  notes || null,
      });
      if (result.error) setSaveErr(result.error);
      else setSaveMsg('Saved');
    });
  }

  function handlePublish() {
    if (!confirm(
      `Publish pair ${pair.pair_sku}?\n\n` +
      `Both constituent diamonds will become unavailable for individual selection.`
    )) return;
    setPubErrors([]);
    startTransition(async () => {
      const result = await publishAction(pair.id);
      if (result.errors.length > 0) setPubErrors(result.errors);
      else router.refresh();
    });
  }

  function handleUnpublish() {
    if (!confirm(
      `Unpublish pair ${pair.pair_sku}?\n\n` +
      `The pair will be removed from the catalogue. Cannot unpublish if a reservation is active.`
    )) return;
    startTransition(async () => {
      const result = await unpublishAction(pair.id);
      if (result.error) setSaveErr(result.error);
      else router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm(
      `Delete pair ${pair.pair_sku}?\n\n` +
      `This is permanent and cannot be undone. Only draft pairs may be deleted.`
    )) return;
    startTransition(async () => {
      await deleteAction(pair.id);
    });
  }

  const isReserved = pair.status === 'reserved';
  const isSold     = pair.status === 'sold';
  const isLive     = pair.is_published;

  return (
    <div className="space-y-8">

      {/* Status bar */}
      <div className="flex items-center gap-4 py-3 px-4 rounded" style={{ background: '#fafafa', border: `1px solid ${BORDER}` }}>
        <StatusBlock label="Status">
          <PairStatusBadge status={pair.status} />
        </StatusBlock>
        <div style={{ width: 1, height: 28, background: BORDER }} />
        <StatusBlock label="Publication">
          <span className="font-sans" style={{ fontSize: 12, color: isLive ? '#4a9e6b' : '#aaa' }}>
            {isLive ? 'Live' : 'Draft'}
          </span>
        </StatusBlock>
        {isReserved && pair.held_until && (
          <>
            <div style={{ width: 1, height: 28, background: BORDER }} />
            <StatusBlock label="Hold expires">
              <span className="font-sans" style={{ fontSize: 12, color: '#c9a84c' }}>
                {new Date(pair.held_until).toLocaleString('en-GB')}
              </span>
            </StatusBlock>
          </>
        )}
        {isSold && (
          <>
            <div style={{ width: 1, height: 28, background: BORDER }} />
            <StatusBlock label="Note">
              <span className="font-sans" style={{ fontSize: 11, color: '#bbb' }}>
                Sold pairs cannot be modified or returned to availability.
              </span>
            </StatusBlock>
          </>
        )}
      </div>

      {/* Constituent Diamonds */}
      <Section title="Constituent Diamonds">
        {!canChangeDiamonds && (
          <p className="font-sans mb-3" style={{ fontSize: 11, color: '#c9a84c', background: '#fef9ec', border: '1px solid #f5dfa0', padding: '8px 12px', borderRadius: 2 }}>
            Constituent diamonds cannot be changed while the pair is {isLive ? 'published' : isSold ? 'sold' : isReserved ? 'reserved' : 'active'}.
            To replace diamonds, unpublish the pair and ensure it has no active reservation.
          </p>
        )}
        <div className="grid grid-cols-2 gap-4">
          {[{ label: 'Diamond A', d: pair.diamond_a }, { label: 'Diamond B', d: pair.diamond_b }].map(({ label, d }) => (
            <div key={label} className="rounded" style={{ border: `1px solid ${BORDER}`, padding: '12px 14px' }}>
              <p className="font-sans uppercase mb-1" style={{ fontSize: 8, letterSpacing: '0.3em', color: '#bbb' }}>{label}</p>
              {d ? (
                <>
                  <p className="font-mono" style={{ fontSize: 12, color: G }}>{d.sku}</p>
                  <p className="font-sans mt-0.5" style={{ fontSize: 11, color: '#888' }}>
                    {d.cut} · {d.carat.toFixed(2)} ct{d.colour ? ` · ${d.colour}` : ''}{d.clarity ? ` · ${d.clarity}` : ''}
                  </p>
                  <p className="font-sans mt-0.5" style={{ fontSize: 10, color: d.status === 'available' ? '#4a9e6b' : '#c9a84c' }}>
                    {d.status} · {d.is_published ? 'Published' : 'Draft'}
                  </p>
                </>
              ) : (
                <p className="font-sans" style={{ fontSize: 11, color: '#ccc' }}>Diamond not found</p>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Metadata form */}
      <Section title="Pair Metadata">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <Field label="Pair SKU">
              <TextInput value={pairSku} onChange={setPairSku} />
            </Field>
            <Field label="Pair Price GBP *">
              <TextInput value={pairPrice} onChange={setPairPrice} type="number" step="1" />
            </Field>
            <Field label="Total Carat *">
              <TextInput value={totalCarat} onChange={setTotalCarat} type="number" step="0.01" />
            </Field>
            <Field label="Carat Per Stone">
              <TextInput value={caratPerStone} onChange={setCaratPerStone} type="number" step="0.01" />
            </Field>
            <Field label="Colour">
              <TextInput value={colour} onChange={setColour} />
            </Field>
            <Field label="Clarity">
              <TextInput value={clarity} onChange={setClarity} />
            </Field>
          </div>

          <Field label="Internal Matching Notes">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="w-full font-sans resize-none"
              style={{ fontSize: 12, border: `1px solid ${BORDER}`, padding: '8px 10px', color: G }}
            />
          </Field>

          {saveErr && <ErrMsg>{saveErr}</ErrMsg>}
          {saveMsg && <p className="font-sans" style={{ fontSize: 11, color: '#4a9e6b' }}>{saveMsg}</p>}

          {!isSold && (
            <button
              type="submit"
              disabled={pending}
              className="font-sans uppercase transition-opacity disabled:opacity-40"
              style={{ fontSize: 10, letterSpacing: '0.2em', color: 'white', background: G, padding: '10px 22px', border: 'none' }}
            >
              {pending ? 'Saving…' : 'Save Changes'}
            </button>
          )}
        </form>
      </Section>

      {/* Publication controls */}
      {!isSold && (
        <Section title="Publication">
          {pubErrors.length > 0 && (
            <div className="mb-4" style={{ background: '#fff5f5', border: '1px solid #fcc', padding: '10px 14px' }}>
              <p className="font-sans mb-1" style={{ fontSize: 11, color: '#c00', fontWeight: 600 }}>Cannot publish — resolve these issues first:</p>
              <ul className="list-disc list-inside">
                {pubErrors.map((e, i) => (
                  <li key={i} className="font-sans" style={{ fontSize: 11, color: '#c00' }}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-4">
            {!isLive ? (
              <button
                type="button"
                onClick={handlePublish}
                disabled={pending || isReserved}
                className="font-sans uppercase transition-opacity disabled:opacity-40"
                style={{ fontSize: 10, letterSpacing: '0.2em', color: 'white', background: '#4a9e6b', padding: '10px 22px', border: 'none' }}
              >
                {pending ? 'Working…' : 'Publish Pair'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleUnpublish}
                disabled={pending || isReserved}
                className="font-sans uppercase transition-opacity disabled:opacity-40"
                style={{ fontSize: 10, letterSpacing: '0.2em', color: '#c66', background: 'transparent', padding: '10px 22px', border: '1px solid #c66' }}
              >
                {pending ? 'Working…' : 'Unpublish Pair'}
              </button>
            )}

            {isReserved && (
              <p className="font-sans" style={{ fontSize: 11, color: '#c9a84c' }}>
                Publication state cannot be changed while the pair is reserved.
              </p>
            )}
          </div>

          {!isLive && (
            <p className="font-sans mt-3" style={{ fontSize: 11, color: '#aaa' }}>
              Publishing will lock both constituent diamonds from individual selection.
              All eligibility checks are run before publication is confirmed.
            </p>
          )}
        </Section>
      )}

      {/* Danger zone */}
      {canDelete && (
        <Section title="Danger Zone">
          <p className="font-sans mb-4" style={{ fontSize: 11, color: '#999' }}>
            Only unreserved draft pairs may be deleted. Available, reserved, and sold pairs cannot be deleted.
          </p>
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="font-sans uppercase transition-opacity disabled:opacity-40"
            style={{ fontSize: 10, letterSpacing: '0.2em', color: '#c66', background: 'transparent', padding: '10px 22px', border: '1px solid #c66' }}
          >
            Delete Draft Pair
          </button>
        </Section>
      )}
    </div>
  );
}

// ── Small shared components ───────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded" style={{ border: `1px solid ${BORDER}` }}>
      <p className="font-sans border-b px-4 py-2" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb', textTransform: 'uppercase', borderColor: BORDER }}>
        {title}
      </p>
      <div className="p-5">{children}</div>
    </div>
  );
}

function StatusBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-sans uppercase mb-0.5" style={{ fontSize: 8, letterSpacing: '0.28em', color: '#ccc' }}>{label}</p>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-sans uppercase block mb-1" style={{ fontSize: 9, letterSpacing: '0.22em', color: '#aaa' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({
  value, onChange, type = 'text', step,
}: { value: string; onChange: (v: string) => void; type?: string; step?: string }) {
  return (
    <input
      type={type}
      step={step}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full font-sans"
      style={{ fontSize: 12, border: `1px solid ${BORDER}`, padding: '8px 10px', color: G, outline: 'none' }}
    />
  );
}

function ErrMsg({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-sans" style={{ fontSize: 11, color: '#c00', padding: '8px 12px', background: '#fff5f5', border: '1px solid #fcc' }}>
      {children}
    </p>
  );
}

function PairStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = { available: '#4a9e6b', reserved: '#c9a84c', sold: '#bbb' };
  return (
    <span className="font-sans uppercase" style={{ fontSize: 11, letterSpacing: '0.1em', color: colors[status] ?? '#999' }}>
      {status}
    </span>
  );
}
