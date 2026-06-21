import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-luxe flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="eyebrow">Éclat Grandeur</span>
      <h1 className="mt-4 font-display text-6xl font-light text-ink">Page Not Found</h1>
      <p className="mt-4 max-w-sm font-light text-ink/65">
        The page you seek has eluded us, much like the rarest of diamonds.
      </p>
      <Link
        href="/"
        className="mt-8 bg-ink px-7 py-4 text-xs uppercase tracking-luxe text-ivory hover:bg-ink-soft"
      >
        Return Home
      </Link>
    </div>
  );
}
