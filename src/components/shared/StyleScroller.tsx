'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const G      = '#1a2b1a';
const MUTED  = '#555';

const CARD_W = 360;   // landscape style card width
const CARD_H = 220;   // landscape style card height
const PAD_T  = 36;    // top padding of the strip

export interface StyleCard {
  id:     string;
  label:  string;
  image?: string;
}

interface Props {
  cards:    StyleCard[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

/**
 * Horizontal, scrollable row of wide landscape style cards with chevron
 * controls — the "shop by style" strip that sits at the top of every category
 * page (public and admin). Selecting a card filters the grid below.
 */
export function StyleScroller({ cards, activeId, onSelect }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  if (cards.length === 0) return null;

  function scroll(direction: number) {
    trackRef.current?.scrollBy({ left: direction * (CARD_W + 24), behavior: 'smooth' });
  }

  // Vertical centre of the card image (chevrons align to this, not the label).
  const chevronTop = PAD_T + CARD_H / 2;

  return (
    <div className="relative" style={{ padding: `${PAD_T}px 0 28px` }}>
      {/* Left chevron */}
      <button
        type="button"
        onClick={() => scroll(-1)}
        aria-label="Scroll styles left"
        className="absolute left-4 z-10 flex items-center justify-center"
        style={{ top: chevronTop, transform: 'translateY(-50%)', width: 40, height: 40 }}
      >
        <ChevronLeft className="w-6 h-6" strokeWidth={1.25} style={{ color: G }} />
      </button>

      {/* Track */}
      <div
        ref={trackRef}
        className="flex overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', gap: 24, padding: '0 72px' }}
      >
        {cards.map(card => {
          const active = activeId === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelect(card.id)}
              className="group flex flex-shrink-0 flex-col items-center"
              aria-pressed={active}
              style={{ width: CARD_W }}
            >
              <div
                className="relative flex w-full items-center justify-center overflow-hidden bg-white"
                style={{ height: CARD_H }}
              >
                {card.image ? (
                  <Image
                    src={card.image}
                    alt={card.label}
                    fill
                    sizes={`${CARD_W}px`}
                    className="object-contain p-8 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                ) : (
                  <span className="font-display" style={{ fontSize: 18, color: '#cfcabe' }}>
                    {card.label.charAt(0)}
                  </span>
                )}
              </div>
              <span
                className="font-sans text-center"
                style={{
                  marginTop: 18,
                  fontSize: 15,
                  letterSpacing: '0.02em',
                  color: active ? G : MUTED,
                  fontWeight: active ? 400 : 300,
                  whiteSpace: 'nowrap',
                  borderBottom: active ? `1px solid ${G}` : '1px solid transparent',
                  paddingBottom: 4,
                }}
              >
                {card.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right chevron */}
      <button
        type="button"
        onClick={() => scroll(1)}
        aria-label="Scroll styles right"
        className="absolute right-4 z-10 flex items-center justify-center"
        style={{ top: chevronTop, transform: 'translateY(-50%)', width: 40, height: 40 }}
      >
        <ChevronRight className="w-6 h-6" strokeWidth={1.25} style={{ color: G }} />
      </button>
    </div>
  );
}
