import { pressQuotes } from '@/config/site';

export function PressMarquee() {
  const row = [...pressQuotes, ...pressQuotes];
  return (
    <section className="border-y border-ink/10 bg-ivory py-10">
      <p className="mb-7 text-center text-[10px] uppercase tracking-wide2 text-ink/40">As seen in</p>
      <div className="relative overflow-hidden">
        <div className="flex w-max animate-marquee items-center gap-16 pr-16">
          {row.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="whitespace-nowrap font-display text-2xl font-light text-ink/35 md:text-3xl"
            >
              {name}
            </span>
          ))}
        </div>
        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-ivory to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-ivory to-transparent" />
      </div>
    </section>
  );
}
