'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const G      = '#1a2b1a';
const STONE  = '#f5f3ef';
const BORDER = '#e8e8e8';
const MUTED  = '#999';

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
 * Horizontal, scrollable row of style cards with chevron controls — the
 * "shop by style" strip that sits at the top of every category page (public
 * and admin). Selecting a card filters the grid below.
 */
export function StyleScroller({ cards, activeId, onSelect }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  if (cards.length === 0) return null;

  function scroll(direction: number) {
    trackRef.current?.scrollBy({ left: direction * 360, behavior: 'smooth' });
  }

  return (
    <div className="relative" style={{ borderBottom: `1px solid ${BORDER}`, padding: '32px 0 28px' }}>
      {/* Left chevron */}
      <button
        type="button"
        onClick={() => scroll(-1)}
        aria-label="Scroll styles left"
        className="absolute left-3 top-1/2 z-10 flex items-center justify-center -translate-y-1/2"
        style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#fff', border: `1px solid ${BORDER}` }}
      >
        <ChevronLeft className="w-4 h-4" strokeWidth={1.5} style={{ color: G }} />
      </button>

      {/* Track */}
      <div
        ref={trackRef}
        className="flex gap-3 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', padding: '0 60px' }}
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
            >
              <div
                className="relative flex items-center justify-center overflow-hidden"
                style={{
                  width: 124,
                  height: 124,
                  backgroundColor: STONE,
                  border: active ? `1px solid ${G}` : '1px solid transparent',
                  transition: 'border-color 0.25s ease',
                }}
              >
                {card.image ? (
                  <Image
                    src={card.image}
                    alt={card.label}
                    fill
                    sizes="124px"
                    className="object-contain p-4 transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                ) : (
                  <span className="font-display" style={{ fontSize: 13, color: '#cfcabe' }}>
                    {card.label.charAt(0)}
                  </span>
                )}
              </div>
              <span
                className="font-sans"
                style={{
                  marginTop: 12,
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  color: active ? G : MUTED,
                  fontWeight: active ? 400 : 300,
                  whiteSpace: 'nowrap',
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
        className="absolute right-3 top-1/2 z-10 flex items-center justify-center -translate-y-1/2"
        style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#fff', border: `1px solid ${BORDER}` }}
      >
        <ChevronRight className="w-4 h-4" strokeWidth={1.5} style={{ color: G }} />
      </button>
    </div>
  );
}
