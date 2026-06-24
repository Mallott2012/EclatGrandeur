'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

const ALL_METALS = [
  { id: 'platinum',        label: 'Platinum' },
  { id: 'white_gold_18k',  label: '18k White Gold' },
  { id: 'yellow_gold_18k', label: '18k Yellow Gold' },
  { id: 'rose_gold_18k',   label: '18k Rose Gold' },
  { id: 'white_gold_9k',   label: '9k White Gold' },
  { id: 'yellow_gold_9k',  label: '9k Yellow Gold' },
];

interface Props {
  categoryLabel: string;
  backHref:      string;
  onCreate:      (data: { name: string; slug: string; metals: string[]; basePrice: number; description: string }) => Promise<string>;
}

export function AdminNewProductForm({ categoryLabel, backHref, onCreate }: Props) {
  const router   = useRouter();
  const [name,   setName]   = useState('');
  const [price,  setPrice]  = useState('');
  const [desc,   setDesc]   = useState('');
  const [metals, setMetals] = useState<string[]>(['platinum']);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  function slugify(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function toggleMetal(id: string) {
    setMetals(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim())       return setError('Name is required');
    if (!price.trim())      return setError('Base price is required');
    if (metals.length === 0) return setError('Select at least one metal');
    setSaving(true);
    setError('');
    try {
      const newId = await onCreate({
        name:      name.trim(),
        slug:      slugify(name),
        metals,
        basePrice: parseFloat(price),
        description: desc.trim(),
      });
      router.push(`${backHref}/${newId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-white" style={{ color: G }}>
      <div className="max-w-xl mx-auto px-6 py-20">

        <a href={backHref} className="font-sans uppercase" style={{ fontSize: 11, letterSpacing: '0.14em', color: '#aaa' }}>
          ← Back
        </a>

        <h1
          className="font-display mt-6 mb-10"
          style={{ fontSize: 28, fontWeight: 300, letterSpacing: '0.06em', color: G }}
        >
          Add New {categoryLabel}
        </h1>

        <form onSubmit={submit} className="space-y-8">

          {/* Name */}
          <div>
            <label className="font-sans uppercase block mb-2" style={{ fontSize: 10, letterSpacing: '0.24em', color: '#aaa' }}>
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. The Éclat Solitaire"
              className="w-full border-b focus:outline-none font-sans py-2"
              style={{ fontSize: 15, color: G, borderColor: BORDER }}
            />
          </div>

          {/* Base price */}
          <div>
            <label className="font-sans uppercase block mb-2" style={{ fontSize: 10, letterSpacing: '0.24em', color: '#aaa' }}>
              Base Price (£) *
            </label>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="4800"
              min="0"
              step="50"
              className="w-full border-b focus:outline-none font-sans py-2"
              style={{ fontSize: 15, color: G, borderColor: BORDER }}
            />
          </div>

          {/* Metals */}
          <div>
            <label className="font-sans uppercase block mb-3" style={{ fontSize: 10, letterSpacing: '0.24em', color: '#aaa' }}>
              Metals Available *
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_METALS.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMetal(m.id)}
                  className="font-sans transition-all"
                  style={{
                    fontSize: 11, letterSpacing: '0.06em',
                    padding: '6px 14px',
                    border: `1px solid ${metals.includes(m.id) ? G : '#ddd'}`,
                    color: metals.includes(m.id) ? G : '#aaa',
                    fontWeight: metals.includes(m.id) ? 500 : 300,
                    backgroundColor: metals.includes(m.id) ? '#f9f9f9' : 'transparent',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="font-sans uppercase block mb-2" style={{ fontSize: 10, letterSpacing: '0.24em', color: '#aaa' }}>
              Description
            </label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={4}
              placeholder="Describe this piece..."
              className="w-full border focus:outline-none font-sans p-3 resize-y"
              style={{ fontSize: 13, color: '#666', lineHeight: 1.7, borderColor: BORDER }}
            />
          </div>

          {error && (
            <p className="font-sans" style={{ fontSize: 12, color: '#d44' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full font-sans uppercase py-4 transition-opacity disabled:opacity-40"
            style={{ fontSize: 11, letterSpacing: '0.28em', backgroundColor: G, color: '#fff' }}
          >
            {saving ? 'Creating...' : `Create ${categoryLabel}`}
          </button>
        </form>
      </div>
    </div>
  );
}
