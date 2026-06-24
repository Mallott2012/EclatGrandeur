'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Check,
  ChevronLeft,
  RotateCcw,
  Diamond as DiamondIcon,
  Settings2,
} from 'lucide-react';
import { JewelArt } from '@/components/art/JewelArt';
import { DiamondShapeSvg } from '@/components/art/Diamond';
import { DiamondSearch } from '@/components/diamond/DiamondSearch';
import { Button } from '@/components/ui/Button';
import { EnquiryModal } from '@/components/enquiry/EnquiryModal';
import { useBuilder } from '@/lib/store/builder';
import { useCart } from '@/lib/store/cart';
import { isCompatible, priceBuild } from '@/lib/builder';
import { formatMoney, cn } from '@/lib/utils';
import {
  DIAMOND_SHAPE_LABELS,
  METAL_LABELS,
  METAL_SWATCH,
  type Setting,
  type Diamond,
  type DiamondShape,
  type Metal,
} from '@/types';

type Stage = 'setting' | 'diamond' | 'review';

function caratToVisual(carat: number) {
  return Math.max(0.7, Math.min(1.4, 0.6 + carat * 0.35));
}

export function BuildYourRing({
  settings,
  diamonds,
}: {
  settings: Setting[];
  diamonds: Diamond[];
}) {
  const params = useSearchParams();
  const startParam = params.get('start'); // 'setting' | 'diamond' | null

  const { settingId, diamondId, metal, setSetting, setDiamond, setMetal, reset } = useBuilder();
  const setting = settings.find((s) => s.id === settingId) ?? null;
  const diamond = diamonds.find((d) => d.id === diamondId) ?? null;

  // Stage order depends on where the customer started.
  const order: Stage[] = startParam === 'diamond' ? ['diamond', 'setting', 'review'] : ['setting', 'diamond', 'review'];

  // Pick a sensible initial stage: first incomplete stage in the chosen order.
  const initialStage: Stage | null = startParam
    ? (() => {
        if (startParam === 'diamond') return diamond ? (setting ? 'review' : 'setting') : 'diamond';
        return setting ? (diamond ? 'review' : 'diamond') : 'setting';
      })()
    : null;

  const [stage, setStage] = useState<Stage | null>(initialStage);

  const [enquire, setEnquire] = useState(false);
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);

  const price = setting && diamond ? priceBuild(setting, diamond, metal) : null;
  const previewArt = setting
    ? {
        kind: setting.kind,
        shape: diamond?.shape ?? (setting.shapes[0] as DiamondShape),
        metal,
        caratVisual: diamond ? caratToVisual(diamond.carat) : 1,
      }
    : null;

  const compatibleSettings = useMemo(() => {
    if (!diamond) return settings;
    return settings.filter((s) => isCompatible(s, diamond));
  }, [settings, diamond]);

  const onAddToBag = () => {
    if (!setting || !diamond || !price || !previewArt) return;
    add({
      id: `build-${setting.id}-${diamond.id}-${metal}`,
      name: `${setting.name} · ${diamond.carat.toFixed(2)}ct ${DIAMOND_SHAPE_LABELS[diamond.shape]}`,
      href: '/build-a-ring',
      price: price.total,
      meta: `${METAL_LABELS[metal]} · ${diamond.colour} ${diamond.clarity} ${diamond.cut}`,
      art: previewArt,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // ── Entry chooser ──────────────────────────────────────────────────────────
  if (!stage) {
    return <EntryChooser onChoose={(s) => setStage(s)} />;
  }

  return (
    <div className="container-luxe py-8 md:py-12">
      <StepBar order={order} stage={stage} setStage={setStage} setting={setting} diamond={diamond} />

      {/* Selection summary chips */}
      <SummaryBar
        setting={setting}
        diamond={diamond}
        metal={metal}
        onEditSetting={() => setStage('setting')}
        onEditDiamond={() => setStage('diamond')}
      />

      {/* SETTING STAGE */}
      {stage === 'setting' && (
        <section className="mt-8">
          <h2 className="mb-1 font-display text-2xl font-semibold text-noir">Choose a Setting</h2>
          <p className="mb-6 text-sm text-ink/60">
            {diamond
              ? `Showing settings that fit your ${DIAMOND_SHAPE_LABELS[diamond.shape]} diamond.`
              : 'Select the style that frames your diamond.'}
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {compatibleSettings.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSetting(s.id);
                  if (diamond && !isCompatible(s, diamond)) setDiamond('');
                  setStage(diamond ? 'review' : 'diamond');
                }}
                className={cn(
                  'group flex flex-col rounded-lg border p-4 text-left transition',
                  settingId === s.id ? 'border-champagne shadow-card' : 'border-ink/15 hover:border-champagne'
                )}
              >
                <div className="aspect-square overflow-hidden rounded bg-ivory-warm">
                  <JewelArt
                    art={{ kind: s.kind, shape: diamond?.shape ?? 'round', metal, caratVisual: 1 }}
                    gid={`set-${s.id}`}
                    className="h-full w-full transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-noir">{s.name}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-ink/55">{s.description}</p>
                <span className="mt-3 text-[12px] font-semibold uppercase tracking-luxe text-champagne-deep">
                  From {formatMoney(s.basePrice)}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* DIAMOND STAGE */}
      {stage === 'diamond' && (
        <section className="mt-6">
          <DiamondSearch
            diamonds={diamonds}
            restrictShapes={setting?.shapes}
            heading="Choose a Diamond"
            onSelect={(d) => {
              setDiamond(d.id);
              setStage(setting ? 'review' : 'setting');
            }}
            selectLabel="Choose"
          />
        </section>
      )}

      {/* REVIEW STAGE */}
      {stage === 'review' && setting && diamond && price && previewArt && (
        <section className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="lg:sticky lg:top-40 lg:self-start">
            <div className="aspect-square overflow-hidden rounded-lg border border-ink/10 bg-ivory-warm">
              <JewelArt art={previewArt} gid="build-review" className="h-full w-full animate-float" />
            </div>
          </div>

          <div className="flex flex-col">
            <span className="eyebrow">Your Ring</span>
            <h2 className="mt-2 font-display text-3xl font-semibold text-noir">{setting.name}</h2>
            <p className="mt-1 text-ink/60">
              {diamond.carat.toFixed(2)}ct {DIAMOND_SHAPE_LABELS[diamond.shape]} · {diamond.colour}{' '}
              {diamond.clarity} · {diamond.cut} cut
            </p>

            {/* Metal */}
            <div className="mt-6">
              <span className="text-[11px] font-semibold uppercase tracking-luxe text-ink/50">
                Metal — {METAL_LABELS[metal]}
              </span>
              <div className="mt-3 flex items-center gap-2.5">
                {setting.metals.map((m) => {
                  const sw = METAL_SWATCH[m];
                  return (
                    <button
                      key={m}
                      aria-label={METAL_LABELS[m]}
                      title={METAL_LABELS[m]}
                      onClick={() => setMetal(m)}
                      className={cn(
                        'h-8 w-8 rounded-full border transition',
                        metal === m
                          ? 'border-champagne ring-1 ring-champagne ring-offset-2 ring-offset-ivory'
                          : 'border-ink/20 hover:border-champagne'
                      )}
                      style={{ background: `linear-gradient(135deg, ${sw.light}, ${sw.base} 55%, ${sw.deep})` }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Price breakdown */}
            <dl className="mt-7 flex flex-col gap-3 border-y border-ink/10 py-6 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink/55">Setting ({METAL_LABELS[metal]})</dt>
                <dd className="font-medium">{formatMoney(price.setting)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink/55">
                  Diamond ({diamond.carat.toFixed(2)}ct {diamond.authority})
                </dt>
                <dd className="font-medium">{formatMoney(price.diamond)}</dd>
              </div>
              <div className="mt-1 flex items-baseline justify-between border-t border-ink/10 pt-4">
                <dt className="font-display text-xl font-semibold">Total</dt>
                <dd className="font-display text-2xl font-semibold text-noir">{formatMoney(price.total)}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-col gap-3">
              {price.buyableOnline ? (
                <Button onClick={onAddToBag} variant="primary" size="lg" className="w-full">
                  {added ? (
                    <span className="inline-flex items-center gap-2">
                      <Check className="h-4 w-4" /> Added to Bag
                    </span>
                  ) : (
                    'Add to Bag'
                  )}
                </Button>
              ) : (
                <Button onClick={() => setEnquire(true)} variant="gold" size="lg" className="w-full">
                  Request a Quote
                </Button>
              )}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setStage('diamond')}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-luxe text-ink/55 hover:text-champagne-deep"
                >
                  <ChevronLeft className="h-4 w-4" /> Change diamond
                </button>
                <button
                  onClick={() => {
                    reset();
                    setStage('setting');
                  }}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-luxe text-ink/55 hover:text-champagne-deep"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Start over
                </button>
              </div>
            </div>

            <p className="mt-6 inline-flex items-center gap-2 text-[12px] text-ink/50">
              <DiamondIcon className="h-4 w-4 text-champagne-deep" /> Hand-set to order with full
              certification, free shipping and 30-day returns.
            </p>
          </div>
        </section>
      )}

      <EnquiryModal
        open={enquire}
        onClose={() => setEnquire(false)}
        title="Request a Quote"
        context={
          setting && diamond
            ? `Build: ${setting.name}, ${diamond.carat}ct ${diamond.shape}, ${metal}`
            : undefined
        }
        intro="Your ring is ready. Share your details and our diamond experts will prepare a formal quote."
      />
    </div>
  );
}

// ── sub-components ─────────────────────────────────────────────────────────────

function EntryChooser({ onChoose }: { onChoose: (s: Stage) => void }) {
  return (
    <div className="container-luxe py-12 md:py-16">
      <div className="mb-10 text-center">
        <span className="eyebrow">Build Your Own Ring</span>
        <h1 className="mt-3 font-display text-3xl font-semibold text-noir md:text-5xl">
          Create a one-of-a-kind ring
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-ink/60">
          In three simple steps, pair a hand-finished setting with a certified diamond and see your
          ring — and its price — update live.
        </p>
      </div>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
        <EntryCard
          icon={<Settings2 className="h-7 w-7" />}
          step="Start with a"
          title="Setting"
          copy="Browse solitaire, halo, three-stone and pavé settings, then choose your diamond."
          onClick={() => onChoose('setting')}
        />
        <EntryCard
          icon={<DiamondIcon className="h-7 w-7" />}
          step="Start with a"
          title="Diamond"
          copy="Search certified loose diamonds by the 4Cs, then drop yours into a setting."
          onClick={() => onChoose('diamond')}
        />
      </div>
    </div>
  );
}

function EntryCard({
  icon,
  step,
  title,
  copy,
  onClick,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  copy: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center rounded-lg border border-ink/15 bg-ivory p-10 text-center transition hover:border-champagne hover:shadow-card"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-glacier-soft text-champagne-deep transition group-hover:bg-champagne group-hover:text-white">
        {icon}
      </span>
      <span className="mt-5 text-[11px] font-semibold uppercase tracking-luxe text-ink/45">{step}</span>
      <span className="font-display text-3xl font-semibold text-noir">{title}</span>
      <p className="mt-3 text-sm text-ink/60">{copy}</p>
      <span className="mt-6 text-[12px] font-semibold uppercase tracking-luxe text-champagne-deep">
        Begin →
      </span>
    </button>
  );
}

function StepBar({
  order,
  stage,
  setStage,
  setting,
  diamond,
}: {
  order: Stage[];
  stage: Stage;
  setStage: (s: Stage) => void;
  setting: Setting | null;
  diamond: Diamond | null;
}) {
  const label: Record<Stage, string> = {
    setting: 'Setting',
    diamond: 'Diamond',
    review: 'Complete Ring',
  };
  const done: Record<Stage, boolean> = {
    setting: !!setting,
    diamond: !!diamond,
    review: !!setting && !!diamond,
  };
  const currentIndex = order.indexOf(stage);

  return (
    <ol className="flex items-center justify-center gap-2 md:gap-4">
      {order.map((s, i) => {
        const isCurrent = s === stage;
        const reachable =
          i <= currentIndex || (s === 'diamond' && setting) || (s === 'setting' && diamond) || (s === 'review' && setting && diamond);
        return (
          <li key={s} className="flex items-center gap-2 md:gap-4">
            <button
              disabled={!reachable}
              onClick={() => reachable && setStage(s)}
              className={cn(
                'flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-luxe transition',
                isCurrent ? 'text-noir' : done[s] ? 'text-champagne-deep' : 'text-ink/35',
                reachable && 'hover:text-noir'
              )}
            >
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full border text-[11px]',
                  isCurrent
                    ? 'border-noir bg-noir text-white'
                    : done[s]
                    ? 'border-champagne bg-champagne text-white'
                    : 'border-ink/25'
                )}
              >
                {done[s] && !isCurrent ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{label[s]}</span>
            </button>
            {i < order.length - 1 && <span className="h-px w-6 bg-ink/15 md:w-12" />}
          </li>
        );
      })}
    </ol>
  );
}

function SummaryBar({
  setting,
  diamond,
  metal,
  onEditSetting,
  onEditDiamond,
}: {
  setting: Setting | null;
  diamond: Diamond | null;
  metal: Metal;
  onEditSetting: () => void;
  onEditDiamond: () => void;
}) {
  if (!setting && !diamond) return null;
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
      {setting && (
        <button
          onClick={onEditSetting}
          className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-ivory-warm px-4 py-2 text-[12px] font-medium text-ink hover:border-champagne"
        >
          <Settings2 className="h-4 w-4 text-champagne-deep" />
          {setting.name} · {METAL_LABELS[metal]}
          <span className="text-champagne-deep">Edit</span>
        </button>
      )}
      {diamond && (
        <button
          onClick={onEditDiamond}
          className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-ivory-warm px-4 py-2 text-[12px] font-medium text-ink hover:border-champagne"
        >
          <DiamondShapeSvg shape={diamond.shape} size={16} className="text-glacier-deep" />
          {diamond.carat.toFixed(2)}ct {DIAMOND_SHAPE_LABELS[diamond.shape].replace(' Brilliant', '')} ·{' '}
          {diamond.colour} {diamond.clarity}
          <span className="text-champagne-deep">Edit</span>
        </button>
      )}
    </div>
  );
}
