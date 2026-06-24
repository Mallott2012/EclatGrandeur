'use client';

import Image from 'next/image';
import Link from 'next/link';
import { X, Trash2 } from 'lucide-react';
import { useShortlist } from '@/hooks/useShortlist';

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ShortlistDrawer({ open, onClose }: Props) {
  const { items, remove } = useShortlist();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[85] transition-opacity duration-500"
        style={{ backgroundColor: 'rgba(10,18,10,0.35)', opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-[86] flex flex-col bg-white transition-transform duration-500 ease-in-out"
        style={{
          width: 'min(420px, 96vw)',
          boxShadow: '-4px 0 40px rgba(0,0,0,0.08)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-6" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div>
            <h2 className="font-display" style={{ fontSize: 20, fontWeight: 300, color: G, letterSpacing: '0.04em' }}>
              My Shortlist
            </h2>
            <p className="font-sans mt-0.5" style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.06em' }}>
              {items.length === 0 ? 'No items saved' : `${items.length} item${items.length !== 1 ? 's' : ''} saved`}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close shortlist">
            <X className="w-4 h-4" strokeWidth={1.5} style={{ color: '#aaa' }} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-10 text-center gap-4">
              <div style={{ width: 40, height: 1, backgroundColor: BORDER }} />
              <p className="font-sans" style={{ fontSize: 13, color: '#bbb', lineHeight: 1.7, fontWeight: 300 }}>
                Save pieces you love to your shortlist and return to them at any time.
              </p>
              <div style={{ width: 40, height: 1, backgroundColor: BORDER }} />
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex gap-4 px-7 py-5" style={{ borderBottom: `1px solid ${BORDER}` }}>
                {/* Thumbnail */}
                <div className="relative flex-shrink-0" style={{ width: 72, height: 72, backgroundColor: '#fafafa' }}>
                  <Image src={item.image} alt={item.name} fill className="object-contain p-2" sizes="72px" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="font-display block"
                    style={{ fontSize: 14, fontWeight: 300, color: G, letterSpacing: '0.03em' }}
                  >
                    {item.name}
                  </Link>
                  <p className="font-sans mt-0.5" style={{ fontSize: 10, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {item.subtitle}
                  </p>
                  <p className="font-sans mt-1" style={{ fontSize: 11, color: '#888' }}>
                    {item.metal}
                    {item.diamondCarat && (
                      <> · {item.diamondCarat}ct
                        {item.diamondColor && ` ${item.diamondColor}`}
                        {item.diamondClarity && ` ${item.diamondClarity}`}
                      </>
                    )}
                  </p>
                  <p className="font-sans mt-2" style={{ fontSize: 13, color: G, fontWeight: 400 }}>
                    £{item.totalPrice.toLocaleString('en-GB')}
                  </p>
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  aria-label={`Remove ${item.name} from shortlist`}
                  className="flex-shrink-0 self-start mt-1 transition-opacity hover:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} style={{ color: '#ccc' }} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer — book appointment CTA */}
        {items.length > 0 && (
          <div className="px-7 py-6" style={{ borderTop: `1px solid ${BORDER}` }}>
            <p className="font-sans text-center mb-4" style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.02em' }}>
              Ready to discuss your shortlist with an expert?
            </p>
            <Link
              href="/contact"
              onClick={onClose}
              className="block w-full font-sans uppercase text-center py-4"
              style={{ fontSize: 10, letterSpacing: '0.28em', backgroundColor: G, color: '#fff' }}
            >
              Book an Appointment
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
