'use client';

import Link from 'next/link';

const GREEN = '#1a2b1a';
const IVORY = '#e8e2d4';
const GOLD  = '#b8965a';

export function ConsultationCTA() {
  return (
    <section
      className="flex flex-col items-start justify-end p-10"
      style={{ backgroundColor: GREEN, borderRadius: 2, minHeight: 280 }}
    >
      {/* gold rule */}
      <div style={{ width: 32, height: 1, backgroundColor: GOLD, marginBottom: 20 }} />

      <p
        className="font-sans uppercase tracking-[0.3em] mb-4"
        style={{ fontSize: 9, color: `${IVORY}66` }}
      >
        Private consultation
      </p>

      <h2
        className="font-display italic mb-4"
        style={{
          fontSize: 'clamp(24px, 2.5vw, 36px)',
          fontWeight: 300,
          color: IVORY,
          lineHeight: 1.15,
          letterSpacing: '0.01em',
          maxWidth: 320,
        }}
      >
        Not sure where to begin?
      </h2>

      <p
        className="font-sans leading-relaxed mb-8"
        style={{ fontSize: 14, color: `${IVORY}99`, maxWidth: 340 }}
      >
        Our specialists are available in London and by video appointment. We will guide you through every choice, from stone to setting.
      </p>

      <Link
        href="/appointments"
        className="inline-flex items-center gap-3 border px-7 py-3 font-sans uppercase tracking-[0.2em] transition-all duration-300 hover:bg-[#e8e2d4] hover:border-[#e8e2d4] group"
        style={{ fontSize: 10, color: IVORY, borderColor: `${IVORY}44`, borderRadius: 1 }}
      >
        <span className="group-hover:text-[#1a2b1a] transition-colors duration-300">Book a consultation</span>
        <span className="group-hover:text-[#1a2b1a] transition-colors duration-300" aria-hidden>→</span>
      </Link>
    </section>
  );
}
