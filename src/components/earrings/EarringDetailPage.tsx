'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { ChevronRight, ChevronDown, Heart } from 'lucide-react';
import { ProductGallery } from '@/components/shared/ProductGallery';
import { EarringPairSelector } from './EarringPairSelector';
import { useShortlist, type ShortlistItem } from '@/hooks/useShortlist';
import { useCart } from '@/lib/store/cart';
import { validateAndReserveEarringConfiguration } from '@/app/earrings/[slug]/actions';
import { buildEarringCartLineId } from '@/lib/earrings/cart-helpers';
import { trackEvent } from '@/lib/analytics';
import { METAL_DISPLAY, EMPTY_GALLERY, variantToGalleryData } from '@/lib/gallery/types';
import type { GalleryData, MetalVariant, MetalKey } from '@/lib/gallery/types';
import type { JewelleryDetailConfig } from '@/components/jewellery/JewelleryDetailPage';
import type { CompatiblePairCard } from '@/lib/earrings/types';
import type { JewelleryStoneSlot } from '@/lib/pairs/types';

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

const VARIANT_SWATCHES: Record<string, string> = {
  'platinum': '#d0d0d0', 'white-gold-18k': '#c8c8c8', 'yellow-gold-18k': '#c9a84c', 'rose-gold-14k': '#c47d68',
};

// Approved customer-facing grade ranges (internal DB may hold finer grades).
const APPROVED_COLOURS   = ['D', 'E', 'F'];
const APPROVED_CLARITIES = ['VS2', 'VS1', 'VVS2', 'VVS1', 'IF', 'FL'];
const CLARITY_LABEL: Record<string, string> = { VS2: 'VS2', VS1: 'VS1', VVS2: 'VVS2', VVS1: 'VVS1', IF: 'IF', FL: 'Flawless' };
const clarityLabel = (c: string) => CLARITY_LABEL[c] ?? c;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const fetcher = (url: string): Promise<CompatiblePairCard[]> =>
  fetch(url).then(r => r.json()).then(d => Array.isArray(d?.pairs) ? d.pairs : []);

export interface EarringDetailPageProps {
  productId:          string;
  productSlug:        string;
  productName:        string;
  productSubtitle:    string;
  productDescription: string;
  basePrice:          number;
  earringType:        string;
  fixedDesignNote:    string | null;
  slots:              JewelleryStoneSlot[];
  galleryConfig:      GalleryData;
  metalVariants:      MetalVariant[] | null;
  config:             JewelleryDetailConfig;
}

type AddState = 'idle' | 'reserving' | 'success' | 'error';

export function EarringDetailPage({
  productId, productSlug, productName, productSubtitle, productDescription,
  basePrice, earringType, fixedDesignNote, slots, galleryConfig, metalVariants, config,
}: EarringDetailPageProps) {
  void earringType;
  const { add: addToCart, cartToken, setOpen: setCartOpen } = useCart();

  // ── Metal ──────────────────────────────────────────────────────────────────
  const enabledVariants = metalVariants?.filter(v => v.enabled) ?? [];
  const [metal, setMetal]       = useState<MetalKey | null>(enabledVariants[0]?.metal ?? null);
  const [metalOpen, setMetalOpen] = useState(false);
  const activeVariant = metal ? metalVariants?.find(v => v.metal === metal) ?? null : null;
  const effectiveGallery = activeVariant ? variantToGalleryData(activeVariant) : (galleryConfig ?? EMPTY_GALLERY);
  const metalLabel  = metal ? (METAL_DISPLAY[metal] ?? metal) : 'Select metal';
  const metalSwatch = metal ? (VARIANT_SWATCHES[metal] ?? '#d0d0d0') : '#d0d0d0';

  // ── Slots ──────────────────────────────────────────────────────────────────
  const matchedPairSlots = slots
    .filter(s => s.selection_mode === 'matched_pair')
    .sort((a, b) => a.display_order - b.display_order);
  const fixedSlots   = slots.filter(s => s.selection_mode === 'fixed');
  const isSingleSlot = matchedPairSlots.length === 1;

  const [selectedPairs, setSelectedPairs] = useState<Map<string, CompatiblePairCard>>(new Map());
  const [addState, setAddState] = useState<AddState>('idle');
  const [addError, setAddError] = useState<string | null>(null);

  const selectedEntries = [...selectedPairs.entries()];
  const allChosen = matchedPairSlots.length > 0 && matchedPairSlots.every(s => selectedPairs.has(s.slot_key));

  function selectPair(slotKey: string, pair: CompatiblePairCard) {
    setSelectedPairs(prev => { const n = new Map(prev); n.set(slotKey, pair); return n; });
    setAddState('idle'); setAddError(null);
  }
  function clearPair(slotKey: string) {
    setSelectedPairs(prev => { const n = new Map(prev); n.delete(slotKey); return n; });
    setAddState('idle'); setAddError(null);
  }

  const otherSlotPairIds = (slotKey: string) =>
    new Set(selectedEntries.filter(([k]) => k !== slotKey).map(([, p]) => p.id));

  // ── Price (client display from public pair prices; server revalidates on add) ─
  const pairTotal = selectedEntries.reduce((s, [, p]) => s + p.pair_price_gbp, 0);
  const displayTotal = allChosen ? basePrice + pairTotal : null;
  const priceLabel = displayTotal !== null
    ? `£${displayTotal.toLocaleString('en-GB')}`
    : `From £${basePrice.toLocaleString('en-GB')}`;

  // ── Add to Bag ───────────────────────────────────────────────────────────────
  async function handleAdd() {
    if (!allChosen || addState === 'reserving') return;
    setAddState('reserving'); setAddError(null);
    trackEvent('earring_add_to_bag_initiated', { productId });
    const pairs = selectedEntries.map(([slotKey, p]) => ({ slotKey, pairId: p.id }));
    const result = await validateAndReserveEarringConfiguration(productId, metal ?? null, pairs, cartToken);
    if (!result.ok) {
      setAddState('error'); setAddError(result.error);
      trackEvent('earring_reservation_failed', { productId });
      return;
    }
    const { earring } = result;
    addToCart({
      id:    buildEarringCartLineId(productId, pairs.map(p => p.pairId)),
      name:  earring.productName,
      href:  `${config.categoryPath}/${productSlug}`,
      price: { amount: earring.totalPrice, currency: 'GBP' },
      meta:  earring.metalLabel,
      art:   { kind: 'stud-earrings', shape: 'round', metal: 'platinum' },
      earringConfig: earring,
    });
    setAddState('success');
    trackEvent('earring_added_to_bag', { productId });
  }

  // ── Shortlist ──────────────────────────────────────────────────────────────
  const { toggle, has } = useShortlist();
  const shortlistId   = `${config.categoryPath.replace('/', '')}-${productName.toLowerCase().replace(/\s+/g, '-')}`;
  const isShortlisted = has(shortlistId);
  function buildShortlistItem(): ShortlistItem {
    return { id: shortlistId, category: config.categoryLabel, name: productName, subtitle: productSubtitle,
      image: effectiveGallery.topLeft?.url ?? '', href: `${config.categoryPath}/${productSlug}`,
      metal: metalLabel, basePrice, totalPrice: displayTotal ?? basePrice, savedAt: Date.now() };
  }

  return (
    <div className="min-h-screen bg-white pb-10 lg:pb-20" style={{ color: G }}>
      <nav className="flex items-center gap-2 px-8 lg:px-14 pt-24 pb-5" style={{ borderBottom: `1px solid ${BORDER}` }} aria-label="Breadcrumb">
        <Link href="/" className="font-sans" style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Home</Link>
        <ChevronRight className="w-2.5 h-2.5" style={{ color: '#ddd' }} strokeWidth={1.5} />
        <Link href={config.categoryPath} className="font-sans" style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{config.categoryLabel}</Link>
        <ChevronRight className="w-2.5 h-2.5" style={{ color: '#ddd' }} strokeWidth={1.5} />
        <span className="font-sans" style={{ fontSize: 11, color: G, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{productName}</span>
      </nav>

      <div className="flex flex-col lg:flex-row">
        <div className="lg:w-[58%] lg:sticky lg:top-[80px]" style={{ maxHeight: 'calc(100vh - 80px)', overflowY: 'auto', padding: 8, background: '#fff' }}>
          <ProductGallery data={effectiveGallery} />
        </div>

        <div className="lg:w-[42%] lg:sticky lg:top-[80px] lg:h-[calc(100vh-80px)] lg:overflow-y-auto px-8 lg:px-12 pt-12 pb-20 flex flex-col">
          <h1 className="font-display" style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 300, letterSpacing: '0.04em', color: G, lineHeight: 1.15 }}>{productName}</h1>
          <div className="flex items-baseline justify-between mt-2 gap-4">
            <p className="font-sans" style={{ fontSize: 13, color: '#999', fontWeight: 300, letterSpacing: '0.03em' }}>{productSubtitle}</p>
            <p className="font-sans flex-shrink-0" style={{ fontSize: 14, color: G, fontWeight: 400 }}>{priceLabel}</p>
          </div>

          <div className="mt-8" style={{ height: 1, backgroundColor: BORDER }} />

          {/* METAL */}
          <button type="button" onClick={() => setMetalOpen(v => !v)} className="flex items-center justify-between w-full py-4 text-left" style={{ borderBottom: metalOpen ? 'none' : `1px solid ${BORDER}` }}>
            <span className="font-sans uppercase" style={{ fontSize: 11, letterSpacing: '0.16em', color: '#999' }}>Metal</span>
            <span className="flex items-center gap-2">
              <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: metalSwatch, border: '1px solid #ddd' }} />
              <span className="font-sans" style={{ fontSize: 13, color: G, fontWeight: 300 }}>{metalLabel}</span>
              <ChevronDown className="w-3.5 h-3.5" style={{ color: '#bbb', transform: metalOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} strokeWidth={1.5} />
            </span>
          </button>
          {metalOpen && (
            <div style={{ borderBottom: `1px solid ${BORDER}` }}>
              {enabledVariants.map(v => {
                const active = v.metal === metal;
                return (
                  <button key={v.metal} type="button" onClick={() => { setMetal(v.metal); setMetalOpen(false); }}
                    className="flex items-center gap-3 w-full px-2 py-3 font-sans transition-colors hover:bg-stone-50"
                    style={{ fontSize: 13, color: active ? G : '#666', fontWeight: active ? 400 : 300, backgroundColor: active ? '#f9f9f9' : 'transparent' }}>
                    <span style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: VARIANT_SWATCHES[v.metal] ?? '#d0d0d0', border: '1px solid #ddd' }} />
                    {METAL_DISPLAY[v.metal]}
                    {active && <span style={{ marginLeft: 'auto', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4a9e6b' }}>Selected</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* Per-slot spec configurators */}
          {matchedPairSlots.map(slot => (
            <SlotConfigurator
              key={slot.slot_key}
              productId={productId}
              slotKey={slot.slot_key}
              slotLabel={isSingleSlot ? 'Your Diamonds' : (slot.label ?? slot.slot_key)}
              isSingleSlot={isSingleSlot}
              selectedPair={selectedPairs.get(slot.slot_key) ?? null}
              disabledPairIds={otherSlotPairIds(slot.slot_key)}
              onSelect={pair => selectPair(slot.slot_key, pair)}
              onClear={() => clearPair(slot.slot_key)}
            />
          ))}

          {/* Fixed slots / halo note */}
          {fixedSlots.length > 0 && (
            <p className="font-sans mt-5" style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.04em', lineHeight: 1.6 }}>
              {fixedDesignNote ?? `${fixedSlots.map(s => s.label ?? s.slot_key).join(' & ')} — fixed diamonds included in the setting.`}
            </p>
          )}
          {fixedSlots.length === 0 && fixedDesignNote && (
            <p className="font-sans mt-5" style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.04em', lineHeight: 1.6 }}>{fixedDesignNote}</p>
          )}

          {/* YOUR EARRINGS */}
          {allChosen && (
            <div className="mt-8 pt-6" style={{ borderTop: `1px solid ${BORDER}` }}>
              <p className="font-sans uppercase mb-4" style={{ fontSize: 10, letterSpacing: '0.22em', color: '#999' }}>Your Earrings</p>
              {metal && (
                <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <span className="font-sans" style={{ fontSize: 12, color: '#888', fontWeight: 300 }}>Setting — {METAL_DISPLAY[metal]}</span>
                  <span className="font-sans" style={{ fontSize: 12, color: G, fontWeight: 300 }}>£{basePrice.toLocaleString('en-GB')}</span>
                </div>
              )}
              {selectedEntries.map(([slotKey, p]) => {
                const slot = matchedPairSlots.find(s => s.slot_key === slotKey);
                const label = isSingleSlot ? 'Diamond Pair' : (slot?.label ?? slotKey);
                return (
                  <div key={slotKey} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <span className="font-sans" style={{ fontSize: 12, color: '#888', fontWeight: 300 }}>
                      {label} — {p.total_carat.toFixed(2)}ct · {cap(p.shape)} · {p.colour} · {clarityLabel(p.clarity ?? '')}
                    </span>
                    <span className="font-sans" style={{ fontSize: 12, color: G, fontWeight: 300 }}>£{p.pair_price_gbp.toLocaleString('en-GB')}</span>
                  </div>
                );
              })}
              <div className="flex justify-between pt-3">
                <span className="font-sans uppercase" style={{ fontSize: 10, letterSpacing: '0.16em', color: '#999' }}>Total</span>
                <span className="font-sans" style={{ fontSize: 14, color: G, fontWeight: 400 }}>£{(displayTotal ?? basePrice).toLocaleString('en-GB')}</span>
              </div>

              {addError && <p className="font-sans mt-4 text-center" style={{ fontSize: 11, color: '#c0392b', lineHeight: 1.5 }}>{addError}</p>}
              <button type="button" onClick={addState === 'success' ? () => setCartOpen(true) : handleAdd} disabled={addState === 'reserving'}
                className="w-full font-sans uppercase mt-6 py-4"
                style={{ fontSize: 11, letterSpacing: '0.28em', color: '#fff', cursor: addState === 'reserving' ? 'not-allowed' : 'pointer',
                  backgroundColor: addState === 'success' ? '#4a9e6b' : addState === 'reserving' ? '#888' : G }}>
                {addState === 'idle'      && 'Add to Bag'}
                {addState === 'reserving' && 'Reserving your selection…'}
                {addState === 'success'   && 'Added to Bag'}
                {addState === 'error'     && 'Try Again'}
              </button>
            </div>
          )}

          {!allChosen && matchedPairSlots.length > 0 && (
            <div className="mt-8 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
              <button type="button" disabled className="w-full font-sans uppercase py-4" style={{ fontSize: 11, letterSpacing: '0.28em', backgroundColor: '#f2f2f0', color: '#bbb', cursor: 'not-allowed' }}>
                Complete your selection to continue
              </button>
            </div>
          )}

          <button type="button" onClick={() => toggle(buildShortlistItem())}
            className="flex items-center justify-center gap-2 w-full font-sans uppercase mt-6 py-3 transition-opacity hover:opacity-70"
            style={{ fontSize: 10, letterSpacing: '0.22em', color: isShortlisted ? G : '#aaa', border: `1px solid ${isShortlisted ? G : '#ddd'}` }}>
            <Heart className="w-3.5 h-3.5" strokeWidth={1.5} style={{ fill: isShortlisted ? G : 'none', color: isShortlisted ? G : '#aaa' }} />
            {isShortlisted ? 'Saved to Shortlist' : 'Save to Shortlist'}
          </button>

          <div className="mt-10 mb-8" style={{ height: 1, backgroundColor: BORDER }} />
          <p className="font-sans" style={{ fontSize: 13, color: '#666', lineHeight: 1.85, fontWeight: 300, letterSpacing: '0.02em' }}>{productDescription}</p>
        </div>
      </div>
    </div>
  );
}

// ── Per-slot spec selectors → CHOOSE YOUR DIAMONDS → pair selector ──────────────

function SlotConfigurator({
  productId, slotKey, slotLabel, isSingleSlot, selectedPair, disabledPairIds, onSelect, onClear,
}: {
  productId: string; slotKey: string; slotLabel: string; isSingleSlot: boolean;
  selectedPair: CompatiblePairCard | null; disabledPairIds: Set<string>;
  onSelect: (pair: CompatiblePairCard) => void; onClear: () => void;
}) {
  const { data: pairs = [] } = useSWR<CompatiblePairCard[]>(
    `/api/earrings/${productId}/slots/${slotKey}/pairs`, fetcher, { revalidateOnFocus: false },
  );

  const [cut, setCut]         = useState<string | null>(null);
  const [colour, setColour]   = useState<string | null>(null);
  const [clarity, setClarity] = useState<string | null>(null);
  const [carat, setCarat]     = useState<number | null>(null);
  const [open, setOpen]       = useState(false);

  // Progressive facets derived from real, compatible, available pairs only.
  const cuts = useMemo(() => [...new Set(pairs.map(p => p.shape))].sort(), [pairs]);
  const colours = useMemo(() => [...new Set(pairs.filter(p => p.shape === cut).map(p => p.colour).filter((c): c is string => !!c && APPROVED_COLOURS.includes(c)))]
    .sort((a, b) => APPROVED_COLOURS.indexOf(a) - APPROVED_COLOURS.indexOf(b)), [pairs, cut]);
  const clarities = useMemo(() => [...new Set(pairs.filter(p => p.shape === cut && p.colour === colour).map(p => p.clarity).filter((c): c is string => !!c && APPROVED_CLARITIES.includes(c)))]
    .sort((a, b) => APPROVED_CLARITIES.indexOf(a) - APPROVED_CLARITIES.indexOf(b)), [pairs, cut, colour]);
  const carats = useMemo(() => [...new Set(pairs.filter(p => p.shape === cut && p.colour === colour && p.clarity === clarity).map(p => p.total_carat))]
    .sort((a, b) => a - b), [pairs, cut, colour, clarity]);

  const matchingPairs = useMemo(
    () => pairs.filter(p => p.shape === cut && p.colour === colour && p.clarity === clarity && p.total_carat === carat),
    [pairs, cut, colour, clarity, carat],
  );
  const specComplete = !!cut && !!colour && !!clarity && carat !== null;
  const canChoose = specComplete && matchingPairs.length > 0;

  // Clear downstream when an upstream choice changes / becomes invalid.
  function pickCut(v: string)     { setCut(v); setColour(null); setClarity(null); setCarat(null); if (selectedPair) onClear(); }
  function pickColour(v: string)  { setColour(v); setClarity(null); setCarat(null); if (selectedPair) onClear(); }
  function pickClarity(v: string) { setClarity(v); setCarat(null); if (selectedPair) onClear(); }
  function pickCarat(v: number)   { setCarat(v); if (selectedPair) onClear(); }

  const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" onClick={onClick} className="font-sans" style={{ fontSize: 12, padding: '8px 14px', border: `1px solid ${active ? G : BORDER}`, color: active ? '#fff' : G, backgroundColor: active ? G : '#fff' }}>{children}</button>
  );
  const Row = ({ n, label, children }: { n: number; label: string; children: React.ReactNode }) => (
    <div className="py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
      <span className="font-sans uppercase" style={{ fontSize: 11, letterSpacing: '0.16em', color: '#999' }}>
        <span style={{ color: '#cbb78a' }}>{n}.</span> {label}
      </span>
      <div className="flex flex-wrap gap-2 mt-3">{children}</div>
    </div>
  );

  const heading = isSingleSlot ? 'CHOOSE YOUR DIAMONDS' : `CHOOSE ${slotLabel.toUpperCase()}`;
  const baseN = isSingleSlot ? 1 : 0; // step numbers continue after METAL in single-slot

  return (
    <div>
      {!isSingleSlot && (
        <p className="font-sans uppercase mt-6 mb-1" style={{ fontSize: 11, letterSpacing: '0.2em', color: G }}>{slotLabel}</p>
      )}
      <Row n={baseN + 1} label="Diamond Cut">
        {cuts.length === 0 && <span className="font-sans" style={{ fontSize: 12, color: '#bbb' }}>No diamonds available</span>}
        {cuts.map(c => <Chip key={c} active={c === cut} onClick={() => pickCut(c)}>{cap(c)}</Chip>)}
      </Row>
      <Row n={baseN + 2} label="Colour">
        {colours.length === 0 && <span className="font-sans" style={{ fontSize: 12, color: '#bbb' }}>Select a cut</span>}
        {colours.map(c => <Chip key={c} active={c === colour} onClick={() => pickColour(c)}>{c}</Chip>)}
      </Row>
      <Row n={baseN + 3} label="Clarity">
        {clarities.length === 0 && <span className="font-sans" style={{ fontSize: 12, color: '#bbb' }}>Select a colour</span>}
        {clarities.map(c => <Chip key={c} active={c === clarity} onClick={() => pickClarity(c)}>{clarityLabel(c)}</Chip>)}
      </Row>
      <Row n={baseN + 4} label="Total Carat Weight">
        {carats.length === 0 && <span className="font-sans" style={{ fontSize: 12, color: '#bbb' }}>Select a clarity</span>}
        {carats.map(c => <Chip key={c} active={c === carat} onClick={() => pickCarat(c)}>{c.toFixed(2)}ct</Chip>)}
      </Row>

      {/* Selected pair summary / CHOOSE button */}
      {selectedPair ? (
        <div className="flex items-center justify-between py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <span className="font-sans" style={{ fontSize: 13, color: G, fontWeight: 300 }}>
            Selected · {selectedPair.total_carat.toFixed(2)}ct · {cap(selectedPair.shape)} · {selectedPair.colour} · {clarityLabel(selectedPair.clarity ?? '')}
          </span>
          <button type="button" onClick={() => setOpen(true)} className="font-sans" style={{ fontSize: 12, color: G, textDecoration: 'underline', textUnderlineOffset: 3 }}>Change</button>
        </div>
      ) : (
        <button type="button" onClick={() => canChoose && setOpen(true)} disabled={!canChoose}
          className="w-full font-sans uppercase mt-4 py-4"
          style={{ fontSize: 11, letterSpacing: '0.28em', color: canChoose ? '#fff' : '#bbb', cursor: canChoose ? 'pointer' : 'not-allowed', backgroundColor: canChoose ? G : '#f2f2f0' }}>
          {heading}
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[80]" onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="absolute inset-0 bg-black/5" />
          <div className="absolute right-0 top-0 bottom-0 flex flex-col bg-white" style={{ width: 'min(480px, 96vw)', boxShadow: '-4px 0 40px rgba(0,0,0,0.10)' }}>
            <EarringPairSelector
              productId={productId}
              slotKey={slotKey}
              slotLabel={slotLabel}
              providedPairs={matchingPairs}
              specSummary={`${cap(cut!)} · ${colour} · ${clarityLabel(clarity!)} · ${carat!.toFixed(2)}ct`}
              selectedPairId={selectedPair?.id ?? null}
              disabledPairIds={disabledPairIds}
              onSelect={pair => { onSelect(pair); setOpen(false); }}
              onClose={() => setOpen(false)}
              isSingleSlot={isSingleSlot}
            />
          </div>
        </div>
      )}
    </div>
  );
}
