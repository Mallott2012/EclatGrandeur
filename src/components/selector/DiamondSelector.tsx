'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { JewelArt } from '@/components/art/JewelArt'
import { formatMoney } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Product, Metal } from '@/types'
import type { CuratedDiamond, CuratedLabel } from '@/data/curated-diamonds'

// ── filter option sets ────────────────────────────────────────────────────────

const CARAT_OPTIONS = [
  { key: 'all',    label: 'Any carat' },
  { key: '<1',     label: 'Under 1 ct' },
  { key: '1-1.5',  label: '1 – 1.5 ct' },
  { key: '1.5-2',  label: '1.5 – 2 ct' },
  { key: '2-3',    label: '2 – 3 ct' },
  { key: '>3',     label: 'Over 3 ct' },
]

const COLOUR_OPTIONS = [
  { key: 'all', label: 'Any colour' },
  { key: 'D-F', label: 'D – F  Colourless' },
  { key: 'G-H', label: 'G – H  Near-colourless' },
]

const CLARITY_OPTIONS = [
  { key: 'all',  label: 'Any clarity' },
  { key: 'FL-IF', label: 'FL / IF  Flawless' },
  { key: 'VVS',   label: 'VVS1 / VVS2' },
  { key: 'VS',    label: 'VS1 / VS2' },
]

// ── label badge ───────────────────────────────────────────────────────────────

const LABEL_STYLE: Record<CuratedLabel, string> = {
  'Éclat Selection':   'border border-gold/60 text-gold-deep',
  'Best Balance':      'border border-ink/20 text-ink/50',
  'Exceptional Value': 'border border-ink/20 text-ink/50',
  'Rare Find':         'border border-gold/40 text-gold/80',
}

function LabelBadge({ label }: { label: CuratedLabel }) {
  return (
    <span className={cn('inline-block rounded-sm px-1.5 py-0.5 text-[10px] uppercase tracking-widest', LABEL_STYLE[label])}>
      {label}
    </span>
  )
}

// ── filter chip ───────────────────────────────────────────────────────────────

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-sm border px-3 py-1.5 text-[11px] uppercase tracking-luxe transition-colors duration-200',
        active
          ? 'border-gold/70 bg-gold/5 text-gold-deep'
          : 'border-ink/15 text-ink/50 hover:border-ink/30 hover:text-ink/70',
      )}
    >
      {children}
    </button>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export function DiamondSelector({
  product,
  diamonds,
}: {
  product: Product
  diamonds: CuratedDiamond[]
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [metal, setMetal] = useState<Metal>(product.art.metal)
  const [caratFilter, setCaratFilter] = useState('all')
  const [colourFilter, setColourFilter] = useState('all')
  const [clarityFilter, setClarityFilter] = useState('all')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const filtered = useMemo(() => {
    return diamonds.filter((d) => {
      if (caratFilter === '<1'    && d.carat >= 1)    return false
      if (caratFilter === '1-1.5' && (d.carat < 1 || d.carat >= 1.5)) return false
      if (caratFilter === '1.5-2' && (d.carat < 1.5 || d.carat >= 2)) return false
      if (caratFilter === '2-3'   && (d.carat < 2 || d.carat >= 3))   return false
      if (caratFilter === '>3'    && d.carat < 3)    return false

      if (colourFilter === 'D-F' && !['D', 'E', 'F'].includes(d.colour)) return false
      if (colourFilter === 'G-H' && !['G', 'H'].includes(d.colour))       return false

      if (clarityFilter === 'FL-IF' && !['FL', 'IF'].includes(d.clarity))           return false
      if (clarityFilter === 'VVS'   && !['VVS1', 'VVS2'].includes(d.clarity))       return false
      if (clarityFilter === 'VS'    && !['VS1', 'VS2'].includes(d.clarity))          return false

      return true
    })
  }, [diamonds, caratFilter, colourFilter, clarityFilter])

  const selected = diamonds.find((d) => d.id === selectedId) ?? null

  const visualCarat = selected ? selected.carat : product.art.caratVisual ?? 1.0
  const artWithCarat = { ...product.art, metal, caratVisual: Math.min(1.5, 0.6 + visualCarat * 0.28) }

  const settingPrice = product.purchase.price?.amount ?? 0
  const totalPrice = selected
    ? formatMoney({ amount: settingPrice + selected.price, currency: 'GBP' })
    : null

  return (
    <div className="min-h-screen bg-[#fdfcf9]">
      {/* breadcrumb */}
      <div className="border-b border-ink/8 bg-[#fdfcf9]">
        <nav className="container-luxe flex items-center gap-1.5 py-4 text-[11px] uppercase tracking-luxe text-ink/35">
          <Link href="/" className="hover:text-ink/60 transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/engagement-rings" className="hover:text-ink/60 transition-colors">Engagement Rings</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/product/${product.slug}`} className="hover:text-ink/60 transition-colors">{product.name}</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-ink/55">Select Diamond</span>
        </nav>
      </div>

      {/* two-panel layout */}
      <div className="container-luxe grid grid-cols-1 gap-0 lg:grid-cols-[52%_1fr] lg:gap-16">

        {/* ── LEFT: setting visual ─────────────────────────────────────────── */}
        <div className="flex flex-col items-center justify-center py-12 lg:sticky lg:top-0 lg:h-screen lg:py-0">
          <div className="relative w-full max-w-sm">
            {/* carat caption */}
            <p className="mb-4 text-center text-[11px] uppercase tracking-luxe text-ink/40">
              {visualCarat.toFixed(2)} ct pictured
            </p>

            {/* ring SVG */}
            <div className="overflow-hidden rounded-sm">
              <JewelArt art={artWithCarat} gid="selector-ring" tone="ivory" className="w-full" />
            </div>

            {/* house statement */}
            <p className="mt-6 text-center text-[13px] font-light leading-relaxed text-ink/50">
              Every stone is hand-selected by our&nbsp;gemologists in Antwerp and London,
              graded to the highest standards of the&nbsp;craft.
            </p>

            {/* thin rule */}
            <div className="mx-auto mt-8 h-px w-16 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

            {/* metal selector */}
            <div className="mt-6 flex items-center justify-center gap-3">
              {product.metals.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-label={m}
                  onClick={() => setMetal(m)}
                  className={cn(
                    'h-6 w-6 rounded-full border-2 transition-all duration-300',
                    metal === m ? 'scale-110 border-ink/40' : 'border-transparent hover:border-ink/20',
                    m === 'platinum'    && 'bg-[#d9d8d4]',
                    m === 'white-gold'  && 'bg-[#e4ded2]',
                    m === 'yellow-gold' && 'bg-[#e3bf63]',
                    m === 'rose-gold'   && 'bg-[#e0a78f]',
                  )}
                />
              ))}
            </div>
            <p className="mt-2 text-center text-[11px] capitalize tracking-wide text-ink/35">
              {metal.replace('-', ' ')}
            </p>
          </div>
        </div>

        {/* ── RIGHT: selector ──────────────────────────────────────────────── */}
        <div className="border-l border-ink/8 py-12 lg:pl-16">
          {/* heading */}
          <span className="text-[11px] uppercase tracking-luxe text-gold/80">
            {product.name}
          </span>
          <h1 className="mt-2 font-display text-3xl font-light text-ink">
            Select Your Diamond
          </h1>
          <p className="mt-2 text-[13px] font-light leading-relaxed text-ink/50">
            A curated selection chosen for this setting.
          </p>

          {/* thin divider */}
          <div className="my-7 h-px w-full bg-ink/8" />

          {/* carat chips */}
          <div>
            <p className="mb-2.5 text-[10px] uppercase tracking-luxe text-ink/40">Carat</p>
            <div className="flex flex-wrap gap-2">
              {CARAT_OPTIONS.map((o) => (
                <Chip key={o.key} active={caratFilter === o.key} onClick={() => setCaratFilter(o.key)}>
                  {o.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* advanced filters */}
          <div className="mt-5">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-luxe text-ink/40 hover:text-ink/60 transition-colors"
            >
              <ChevronDown
                className={cn('h-3.5 w-3.5 transition-transform duration-300', showAdvanced && 'rotate-180')}
              />
              Advanced filters
            </button>

            {showAdvanced && (
              <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <p className="mb-2.5 text-[10px] uppercase tracking-luxe text-ink/40">Colour</p>
                  <div className="flex flex-col gap-2">
                    {COLOUR_OPTIONS.map((o) => (
                      <Chip key={o.key} active={colourFilter === o.key} onClick={() => setColourFilter(o.key)}>
                        {o.label}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2.5 text-[10px] uppercase tracking-luxe text-ink/40">Clarity</p>
                  <div className="flex flex-col gap-2">
                    {CLARITY_OPTIONS.map((o) => (
                      <Chip key={o.key} active={clarityFilter === o.key} onClick={() => setClarityFilter(o.key)}>
                        {o.label}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="my-7 h-px w-full bg-ink/8" />

          {/* results table */}
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-[13px] font-light text-ink/40">
              No stones match these filters. Try widening your selection.
            </p>
          ) : (
            <div className="w-full">
              {/* table header */}
              <div className="mb-1 grid grid-cols-[2.5rem_auto_4rem_4rem_5.5rem_2.5rem] gap-2 px-3 text-[10px] uppercase tracking-luxe text-ink/35">
                <span />
                <span>Carat</span>
                <span>Colour</span>
                <span>Clarity</span>
                <span className="text-right">Price</span>
                <span />
              </div>

              <div className="divide-y divide-ink/6">
                {filtered.map((d) => {
                  const isSelected = d.id === selectedId
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedId(isSelected ? null : d.id)}
                      className={cn(
                        'grid w-full grid-cols-[2.5rem_auto_4rem_4rem_5.5rem_2.5rem] items-center gap-2 px-3 py-4 text-left transition-colors duration-200',
                        isSelected
                          ? 'bg-gold/[0.04] text-ink'
                          : 'hover:bg-ink/[0.02] text-ink',
                      )}
                    >
                      {/* select indicator */}
                      <span className="flex items-center justify-center">
                        <span
                          className={cn(
                            'flex h-4 w-4 items-center justify-center rounded-full border transition-all duration-200',
                            isSelected
                              ? 'border-gold bg-gold/10'
                              : 'border-ink/25',
                          )}
                        >
                          {isSelected && (
                            <span className="h-2 w-2 rounded-full bg-gold" />
                          )}
                        </span>
                      </span>

                      {/* carat + label */}
                      <span className="flex flex-col gap-1">
                        <span className="font-display text-base font-light">
                          {d.carat.toFixed(2)} ct
                        </span>
                        {d.label && <LabelBadge label={d.label} />}
                      </span>

                      {/* colour */}
                      <span className="text-[13px] font-light text-ink/70">{d.colour}</span>

                      {/* clarity */}
                      <span className="text-[13px] font-light text-ink/70">{d.clarity}</span>

                      {/* price */}
                      <span className="text-right font-display text-[15px] font-light">
                        {formatMoney({ amount: d.price, currency: 'GBP' })}
                      </span>

                      {/* selected chevron */}
                      <span className="flex items-center justify-end">
                        {isSelected && (
                          <ChevronRight className="h-3.5 w-3.5 text-gold/60" />
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>

              <p className="mt-4 text-[11px] text-ink/30">
                {filtered.length} stone{filtered.length !== 1 ? 's' : ''} curated for this setting
              </p>
            </div>
          )}

          <div className="my-8 h-px w-full bg-ink/8" />

          {/* total + CTA */}
          {selected && (
            <div className="mb-6 flex items-baseline justify-between">
              <span className="text-[11px] uppercase tracking-luxe text-ink/40">
                Ring + diamond total
              </span>
              <span className="font-display text-2xl font-light text-ink">
                {totalPrice}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={selected ? `/enquiry?ring=${product.slug}&diamond=${selected.id}` : '#'}
              className={cn(
                'flex-1 rounded-sm py-4 text-center text-[11px] uppercase tracking-luxe transition-all duration-300',
                selected
                  ? 'bg-ink text-ivory hover:bg-ink-soft'
                  : 'cursor-default bg-ink/10 text-ink/30',
              )}
            >
              {selected ? 'Request a consultation' : 'Select a diamond above'}
            </Link>
            <Link
              href="/appointments"
              className="flex-1 rounded-sm border border-ink/20 py-4 text-center text-[11px] uppercase tracking-luxe text-ink/60 transition-colors hover:border-ink/40 hover:text-ink"
            >
              Book a private viewing
            </Link>
          </div>

          <p className="mt-5 text-center text-[12px] font-light leading-relaxed text-ink/35">
            All prices in GBP, inclusive of the setting.
            VAT applicable on UK orders.
          </p>
        </div>
      </div>
    </div>
  )
}
