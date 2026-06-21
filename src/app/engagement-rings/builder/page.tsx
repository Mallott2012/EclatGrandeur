'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { useBuilder } from '@/lib/builder/store';
import { getSettings, getDiamonds, getSettingBySlug, getDiamondBySku } from '@/lib/data/diamonds';
import { compatibleDiamonds } from '@/lib/builder/compatibility';
import { computeRingPrice } from '@/lib/builder/pricing';
import { JewelViewer } from '@/components/product/JewelViewer';
import { DiamondShapeSvg } from '@/components/product/DiamondShapeSvg';
import { EnquiryModal } from '@/components/enquiry/EnquiryModal';
import { useCart } from '@/lib/commerce/cart';
import { BUYABLE_THRESHOLD } from '@/config/site';
import {
  DIAMOND_SHAPE_LABELS,
  METAL_LABELS,
  type DiamondShape,
  type Metal,
  type Money,
} from '@/types/common';
import type { Diamond, RingSetting } from '@/types/diamond';
import { formatMoney, cn, SHIMMER_BLUR } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = 'setting' | 'diamond' | 'finish';

// ─── Constants ────────────────────────────────────────────────────────────────

const RING_SIZES = ['F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];

const METAL_COLORS: Record<Metal, string> = {
  platinum: '#D5D3CF',
  'white-gold': '#C6C4BE',
  'yellow-gold': '#C8A02A',
  'rose-gold': '#BC887A',
};

const SETTING_DESCRIPTIONS: Record<RingSetting['style'], string> = {
  solitaire:
    'The most iconic engagement ring. A single diamond, raised to catch light from every angle, unencumbered by ornament.',
  halo: 'A constellation of smaller diamonds encircles the centre stone, amplifying its brilliance and creating an ethereal glow.',
  pave: 'Tiny diamonds set flush along the band lend a continuous shimmer — as though the metal itself is made of light.',
  'three-stone':
    'Three diamonds, one for each act of a shared life. The trilogy setting is a declaration as much as an adornment.',
  vintage:
    'Intricate milgrain and filigree detail evoking the golden age of jewellery. Each angle reveals something new.',
  bezel: 'A sleek frame of precious metal cradles the stone in a continuous embrace — modern, architectural, enduring.',
  'hidden-halo':
    'A secret constellation of diamonds concealed beneath the centre stone. Beauty held in reserve.',
};

// ─── Animation variants ───────────────────────────────────────────────────────

const stageFade = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BuilderPage() {
  const {
    settingSlug,
    diamondSku,
    metal,
    ringSize,
    setSetting,
    setDiamond,
    setMetal,
    setRingSize,
  } = useBuilder();
  const addToCart = useCart((s) => s.add);

  const allSettings = getSettings();
  const allDiamonds = getDiamonds();
  const selectedSetting = settingSlug ? getSettingBySlug(settingSlug) : undefined;
  const selectedDiamond = diamondSku ? getDiamondBySku(diamondSku) : undefined;
  const activeMetal: Metal =
    selectedSetting?.metals.includes(metal) ? metal : selectedSetting?.metals[0] ?? metal;

  // Stage navigation
  const [stage, setStage] = useState<Stage>('setting');

  // Which setting is being previewed (browsed) on stage 1
  const [settingIndex, setSettingIndex] = useState(() => {
    if (!settingSlug) return 0;
    const idx = allSettings.findIndex((s) => s.slug === settingSlug);
    return idx >= 0 ? idx : 0;
  });

  // Diamond filters
  const [shapeFilter, setShapeFilter] = useState<DiamondShape | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'natural' | 'lab-grown'>('all');

  // Guard against reaching diamond/finish stage without required selections
  useEffect(() => {
    if (stage === 'finish' && (!selectedSetting || !selectedDiamond)) {
      setStage(selectedSetting ? 'diamond' : 'setting');
    }
    if (stage === 'diamond' && !selectedSetting) {
      setStage('setting');
    }
  }, [stage, selectedSetting, selectedDiamond]);

  // The setting shown in the left panel
  const previewSetting = stage === 'setting' ? allSettings[settingIndex] : selectedSetting;

  // Diamonds compatible with selected setting
  const basePool = useMemo(
    () => (selectedSetting ? compatibleDiamonds(selectedSetting, allDiamonds) : allDiamonds),
    [selectedSetting, allDiamonds]
  );

  const availableShapes = useMemo(
    () => Array.from(new Set(basePool.map((d) => d.shape))),
    [basePool]
  );

  const filteredDiamonds = useMemo(() => {
    let list = [...basePool];
    if (shapeFilter) list = list.filter((d) => d.shape === shapeFilter);
    if (typeFilter !== 'all') list = list.filter((d) => d.type === typeFilter);
    return list.sort((a, b) => a.price.amount - b.price.amount);
  }, [basePool, shapeFilter, typeFilter]);

  const total =
    selectedSetting && selectedDiamond
      ? computeRingPrice(selectedSetting, selectedDiamond, activeMetal)
      : undefined;
  const canBuyOnline = total && total.amount <= BUYABLE_THRESHOLD;

  const handleAddToBag = () => {
    if (!selectedSetting || !selectedDiamond || !total) return;
    addToCart({
      id: `${selectedSetting.slug}-${selectedDiamond.sku}-${activeMetal}`,
      slug: 'engagement-rings/builder',
      name: `${selectedSetting.name} · ${selectedDiamond.carat.toFixed(2)}ct ${DIAMOND_SHAPE_LABELS[selectedDiamond.shape]}`,
      category: 'engagement-rings',
      image: selectedSetting.images[0].src,
      price: total,
      meta: `${METAL_LABELS[activeMetal]}${ringSize ? `, size ${ringSize}` : ''}`,
    });
  };

  const handleChooseSetting = () => {
    const s = allSettings[settingIndex];
    setSetting(s.slug);
    setShapeFilter(null);
    setStage('diamond');
  };

  return (
    <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 4rem)' }}>

      {/* ── LEFT: Ring preview ───────────────────────────────────────────────── */}
      <div className="relative hidden w-[58%] flex-shrink-0 bg-ink lg:block">
        {/* Image / viewer — cross-fades on setting change */}
        <AnimatePresence mode="wait">
          <motion.div
            key={previewSetting?.slug ?? 'empty'}
            className="absolute inset-0 flex items-center justify-center p-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            {previewSetting ? (
              stage !== 'setting' ? (
                <JewelViewer
                  model={previewSetting.model3d}
                  fallbackImage={previewSetting.images[0]}
                  metal={activeMetal}
                  className="h-full w-full"
                />
              ) : (
                <div className="relative h-full w-full">
                  <Image
                    src={previewSetting.images[0].src}
                    alt={previewSetting.images[0].alt}
                    fill
                    priority
                    placeholder="blur"
                    blurDataURL={SHIMMER_BLUR}
                    className="object-contain"
                    sizes="58vw"
                  />
                </div>
              )
            ) : (
              <div className="flex flex-col items-center gap-8 text-ivory/10">
                <DiamondShapeSvg shape="round" size={100} />
                <p className="text-[9px] uppercase tracking-luxe">Your ring will appear here</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Prev / next arrows — setting stage only */}
        {stage === 'setting' && (
          <>
            <button
              onClick={() => setSettingIndex((i) => Math.max(0, i - 1))}
              disabled={settingIndex === 0}
              aria-label="Previous setting"
              className="absolute left-5 top-1/2 -translate-y-1/2 flex h-14 w-14 items-center justify-center text-ivory/20 transition hover:text-ivory/60 disabled:opacity-0"
            >
              <ChevronLeft className="h-6 w-6" strokeWidth={1} />
            </button>
            <button
              onClick={() => setSettingIndex((i) => Math.min(allSettings.length - 1, i + 1))}
              disabled={settingIndex === allSettings.length - 1}
              aria-label="Next setting"
              className="absolute right-5 top-1/2 -translate-y-1/2 flex h-14 w-14 items-center justify-center text-ivory/20 transition hover:text-ivory/60 disabled:opacity-0"
            >
              <ChevronRight className="h-6 w-6" strokeWidth={1} />
            </button>

            {/* Progress dots */}
            <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-2.5">
              {allSettings.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSettingIndex(i)}
                  className={cn(
                    'h-px transition-all duration-400',
                    i === settingIndex
                      ? 'w-10 bg-ivory/50'
                      : 'w-5 bg-ivory/[0.15] hover:bg-ivory/30'
                  )}
                />
              ))}
            </div>
          </>
        )}

        {/* Stage indicator — subtle bottom-left for stages 2 + 3 */}
        {stage !== 'setting' && previewSetting && (
          <div className="absolute bottom-10 left-10">
            <p className="text-[9px] uppercase tracking-luxe text-ivory/20">{previewSetting.name}</p>
          </div>
        )}
      </div>

      {/* ── RIGHT: Stage content ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-ivory">
        <AnimatePresence mode="wait">
          {stage === 'setting' && (
            <SettingStage
              key="setting"
              setting={allSettings[settingIndex]}
              index={settingIndex}
              total={allSettings.length}
              onChoose={handleChooseSetting}
              onNavigate={setSettingIndex}
            />
          )}
          {stage === 'diamond' && selectedSetting && (
            <DiamondStage
              key="diamond"
              setting={selectedSetting}
              diamonds={filteredDiamonds}
              selectedSku={diamondSku}
              shapes={availableShapes}
              shapeFilter={shapeFilter}
              typeFilter={typeFilter}
              onShapeFilter={setShapeFilter}
              onTypeFilter={setTypeFilter}
              onChoose={(sku) => {
                setDiamond(sku);
                setStage('finish');
              }}
              onBack={() => setStage('setting')}
            />
          )}
          {stage === 'finish' && selectedSetting && selectedDiamond && (
            <FinishStage
              key="finish"
              setting={selectedSetting}
              diamond={selectedDiamond}
              metal={activeMetal}
              ringSize={ringSize}
              total={total}
              canBuyOnline={!!canBuyOnline}
              onBack={() => setStage('diamond')}
              onMetal={setMetal}
              onSize={setRingSize}
              onAddToBag={handleAddToBag}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Stage: Setting ───────────────────────────────────────────────────────────

function SettingStage({
  setting,
  index,
  total,
  onChoose,
  onNavigate,
}: {
  setting: RingSetting;
  index: number;
  total: number;
  onChoose: () => void;
  onNavigate: (i: number) => void;
}) {
  return (
    <motion.div
      {...stageFade}
      className="flex min-h-full flex-col px-10 pb-12 pt-14 lg:px-14"
    >
      {/* Stage label */}
      <span className="eyebrow">01 · The Setting</span>

      {/* Mobile: setting image */}
      <div className="relative mt-8 aspect-square w-full overflow-hidden bg-ink lg:hidden">
        <Image
          src={setting.images[0].src}
          alt={setting.images[0].alt}
          fill
          placeholder="blur"
          blurDataURL={SHIMMER_BLUR}
          className="object-contain p-10"
          sizes="100vw"
        />
        {/* Mobile nav arrows */}
        <button
          onClick={() => onNavigate(Math.max(0, index - 1))}
          disabled={index === 0}
          className="absolute left-3 top-1/2 -translate-y-1/2 p-3 text-ivory/30 disabled:opacity-0 hover:text-ivory/70 transition"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={1} />
        </button>
        <button
          onClick={() => onNavigate(Math.min(total - 1, index + 1))}
          disabled={index === total - 1}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-3 text-ivory/30 disabled:opacity-0 hover:text-ivory/70 transition"
        >
          <ChevronRight className="h-5 w-5" strokeWidth={1} />
        </button>
      </div>

      {/* Setting details */}
      <div className="mt-10 flex-1">
        <p className="text-[9px] uppercase tracking-luxe text-ink/25">
          {index + 1} of {total}
        </p>
        <h1 className="mt-4 font-display text-5xl font-light leading-tight text-ink lg:text-6xl">
          {setting.name}
        </h1>
        <p className="mt-2 text-sm capitalize text-ink/35">
          {setting.style.replace('-', ' ')}
        </p>

        <p className="mt-10 max-w-[28rem] text-sm font-light leading-loose text-ink/50">
          {SETTING_DESCRIPTIONS[setting.style]}
        </p>

        <p className="mt-10 text-[10px] uppercase tracking-luxe text-ink/30">
          From{' '}
          <span className="font-normal text-ink/60">{formatMoney(setting.basePrice)}</span>
        </p>
      </div>

      {/* CTA */}
      <div className="mt-14">
        <button
          onClick={onChoose}
          className="w-full bg-ink py-5 text-[10px] uppercase tracking-luxe text-ivory transition hover:bg-ink-soft"
        >
          Choose the {setting.name}
        </button>

        {/* Desktop only: subtle "or browse" hint */}
        <p className="mt-4 text-center text-[9px] uppercase tracking-luxe text-ink/20 lg:block hidden">
          ← → or use the arrows to browse
        </p>
      </div>
    </motion.div>
  );
}

// ─── Stage: Diamond ───────────────────────────────────────────────────────────

function DiamondStage({
  setting,
  diamonds,
  selectedSku,
  shapes,
  shapeFilter,
  typeFilter,
  onShapeFilter,
  onTypeFilter,
  onChoose,
  onBack,
}: {
  setting: RingSetting;
  diamonds: Diamond[];
  selectedSku?: string;
  shapes: DiamondShape[];
  shapeFilter: DiamondShape | null;
  typeFilter: 'all' | 'natural' | 'lab-grown';
  onShapeFilter: (s: DiamondShape | null) => void;
  onTypeFilter: (t: 'all' | 'natural' | 'lab-grown') => void;
  onChoose: (sku: string) => void;
  onBack: () => void;
}) {
  return (
    <motion.div
      {...stageFade}
      className="flex min-h-full flex-col px-10 pb-12 pt-14 lg:px-14"
    >
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[9px] uppercase tracking-luxe text-ink/30 transition hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
        {setting.name}
      </button>

      <span className="eyebrow mt-8">02 · The Diamond</span>
      <h1 className="mt-5 font-display text-4xl font-light leading-tight text-ink lg:text-5xl">
        Choose Your Stone
      </h1>
      <p className="mt-3 text-sm font-light text-ink/40">
        Stones compatible with the {setting.name}. All GIA or IGI certified.
      </p>

      {/* Shape filter */}
      <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3">
        <ShapeChip
          label="All"
          active={shapeFilter === null}
          onClick={() => onShapeFilter(null)}
        />
        {shapes.map((s) => (
          <ShapeChip
            key={s}
            shape={s}
            label={DIAMOND_SHAPE_LABELS[s].split(' ')[0]}
            active={shapeFilter === s}
            onClick={() => onShapeFilter(shapeFilter === s ? null : s)}
          />
        ))}
      </div>

      {/* Type filter */}
      <div className="mt-5 flex gap-5">
        {(['all', 'natural', 'lab-grown'] as const).map((t) => (
          <button
            key={t}
            onClick={() => onTypeFilter(t)}
            className={cn(
              'text-[9px] uppercase tracking-luxe transition',
              typeFilter === t ? 'text-ink' : 'text-ink/25 hover:text-ink/55'
            )}
          >
            {t === 'all' ? 'All' : t === 'natural' ? 'Natural' : 'Lab-Grown'}
          </button>
        ))}
      </div>

      {/* Diamond typeset list */}
      <div className="mt-8 flex flex-col border-t border-ink/10">
        {diamonds.length === 0 ? (
          <p className="py-14 text-center text-sm font-light text-ink/35">
            No stones match your selection.
          </p>
        ) : (
          diamonds.map((d) => (
            <DiamondRow
              key={d.id}
              diamond={d}
              selected={d.sku === selectedSku}
              onSelect={() => onChoose(d.sku)}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}

// ─── Stage: Finish ────────────────────────────────────────────────────────────

function FinishStage({
  setting,
  diamond,
  metal,
  ringSize,
  total,
  canBuyOnline,
  onBack,
  onMetal,
  onSize,
  onAddToBag,
}: {
  setting: RingSetting;
  diamond: Diamond;
  metal: Metal;
  ringSize?: string;
  total?: Money;
  canBuyOnline: boolean;
  onBack: () => void;
  onMetal: (m: Metal) => void;
  onSize: (s: string) => void;
  onAddToBag: () => void;
}) {
  return (
    <motion.div
      {...stageFade}
      className="flex min-h-full flex-col px-10 pb-12 pt-14 lg:px-14"
    >
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[9px] uppercase tracking-luxe text-ink/30 transition hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
        Change Diamond
      </button>

      <span className="eyebrow mt-8">03 · Your Creation</span>

      {/* Summary */}
      <div className="mt-6">
        <h1 className="font-display text-4xl font-light leading-tight text-ink lg:text-5xl">
          {setting.name}
        </h1>
        <p className="mt-2 font-display text-xl font-light text-ink/45">
          with a {diamond.carat.toFixed(2)}ct {DIAMOND_SHAPE_LABELS[diamond.shape]}
        </p>
        <p className="mt-2 text-[10px] uppercase tracking-luxe text-ink/28">
          {diamond.cut} Cut · Colour {diamond.color} · {diamond.clarity} · {diamond.certification.authority} Certified
        </p>
      </div>

      {/* Metal */}
      <div className="mt-10 border-t border-ink/10 pt-8">
        <p className="mb-5 text-[9px] uppercase tracking-luxe text-ink/30">
          Metal · {METAL_LABELS[metal]}
        </p>
        <div className="flex gap-5">
          {setting.metals.map((m) => (
            <button
              key={m}
              onClick={() => onMetal(m)}
              title={METAL_LABELS[m]}
              className="flex flex-col items-center gap-2.5"
            >
              <span
                className={cn(
                  'block h-9 w-9 rounded-full border-2 transition-all duration-200',
                  metal === m
                    ? 'border-ink scale-110'
                    : 'border-transparent hover:border-ink/20'
                )}
                style={{ backgroundColor: METAL_COLORS[m] }}
              />
              <span className="text-[8px] uppercase tracking-luxe text-ink/30">
                {METAL_LABELS[m].split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Ring size */}
      <div className="mt-8 border-t border-ink/10 pt-8">
        <p className="mb-5 text-[9px] uppercase tracking-luxe text-ink/30">
          Ring Size{ringSize ? ` · ${ringSize}` : ''}
        </p>
        <div className="flex flex-wrap gap-2">
          {RING_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => onSize(s)}
              className={cn(
                'h-10 w-10 border text-xs transition duration-200',
                ringSize === s
                  ? 'border-ink bg-ink text-ivory'
                  : 'border-ink/15 text-ink/40 hover:border-ink/50 hover:text-ink'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="mt-8 border-t border-ink/10 pt-8">
        <div className="flex flex-col gap-2 text-sm font-light">
          <div className="flex justify-between text-ink/35">
            <span>Setting ({METAL_LABELS[metal]})</span>
            <span>
              {formatMoney({
                amount:
                  setting.basePrice.amount + (setting.metalPriceDelta?.[metal] ?? 0),
                currency: setting.basePrice.currency,
              })}
            </span>
          </div>
          <div className="flex justify-between text-ink/35">
            <span>Diamond</span>
            <span>{formatMoney(diamond.price)}</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between border-t border-ink/10 pt-4">
            <span className="text-[9px] uppercase tracking-luxe text-ink/40">Total</span>
            <span className="font-display text-3xl text-ink">
              {total ? formatMoney(total) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-10 flex flex-col gap-3">
        {canBuyOnline ? (
          <>
            <button
              onClick={onAddToBag}
              className="w-full bg-ink py-5 text-[10px] uppercase tracking-luxe text-ivory transition hover:bg-ink-soft"
            >
              Add to Bag
            </button>
            {total && (
              <p className="text-center text-[9px] font-light text-ink/30">
                or 12 interest-free payments of{' '}
                {formatMoney({
                  amount: Math.round(total.amount / 12),
                  currency: total.currency,
                })}
              </p>
            )}
          </>
        ) : (
          <EnquiryModal
            triggerLabel="Request a Quote"
            triggerClassName="w-full border border-ink/30 py-5 text-[10px] uppercase tracking-luxe text-ink transition hover:bg-ink hover:text-ivory hover:border-ink"
            title="Reserve Your Creation"
            subtitle="This bespoke ring is created to order. A specialist will guide you through the final steps."
            type="bespoke"
            source="builder"
            builtRing={{
              settingSlug: setting.slug,
              diamondSku: diamond.sku,
              metal,
            }}
          />
        )}
        <button className="text-center text-[9px] uppercase tracking-luxe text-ink/25 transition hover:text-ink/60">
          Or book a private appointment →
        </button>
      </div>
    </motion.div>
  );
}

// ─── Shape chip ───────────────────────────────────────────────────────────────

function ShapeChip({
  shape,
  label,
  active,
  onClick,
}: {
  shape?: DiamondShape;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 border-b-[1.5px] pb-1.5 text-[9px] uppercase tracking-luxe transition-all duration-200',
        active
          ? 'border-champagne text-ink'
          : 'border-transparent text-ink/25 hover:text-ink/55'
      )}
    >
      {shape && <DiamondShapeSvg shape={shape} size={14} />}
      {label}
    </button>
  );
}

// ─── Diamond row ──────────────────────────────────────────────────────────────

function DiamondRow({
  diamond: d,
  selected,
  onSelect,
}: {
  diamond: Diamond;
  selected: boolean;
  onSelect: () => void;
}) {
  const originStr =
    d.type === 'lab-grown'
      ? 'Lab-grown'
      : d.origin
        ? d.origin
        : '';

  return (
    <button
      onClick={onSelect}
      className={cn(
        'group w-full border-b border-ink/[0.07] border-l-[2px] py-5 pl-5 pr-2 text-left transition-all duration-200',
        selected
          ? 'border-l-champagne bg-champagne/[0.04]'
          : 'border-l-transparent hover:border-l-ink/10 hover:bg-ink/[0.015]'
      )}
    >
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-2.5">
          <span className="font-display text-2xl text-ink leading-none">
            {d.carat.toFixed(2)}
            <span className="ml-1 text-xs font-light text-ink/40">ct</span>
          </span>
          <span className="text-sm font-light text-ink/60">
            {DIAMOND_SHAPE_LABELS[d.shape]}
          </span>
        </div>
        <span className="flex-shrink-0 font-display text-xl text-ink">
          {formatMoney(d.price)}
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[9px] uppercase tracking-wide text-ink/28">
        <span>{d.cut}</span>
        <span>·</span>
        <span>Colour {d.color}</span>
        <span>·</span>
        <span>{d.clarity}</span>
        {originStr && (
          <>
            <span>·</span>
            <span>{originStr}</span>
          </>
        )}
        <span>·</span>
        <span>{d.certification.authority}</span>
        {selected && (
          <span className="ml-2 text-champagne-deep tracking-luxe">Selected</span>
        )}
      </div>
    </button>
  );
}
