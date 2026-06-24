import { cn } from '@/lib/utils';

/** A thin gold rule with a small diamond lozenge at its centre. */
export function Divider({ className, tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' }) {
  const line = tone === 'light' ? 'via-champagne-soft/50' : 'via-champagne/45';
  return (
    <div className={cn('flex items-center justify-center gap-3', className)} aria-hidden>
      <span className={cn('h-px w-16 bg-gradient-to-r from-transparent to-champagne/40', tone === 'light' && 'to-champagne-soft/50')} />
      <span className={cn('block h-1.5 w-1.5 rotate-45 bg-gradient-to-br', line, 'from-champagne to-champagne-deep')} />
      <span className={cn('h-px w-16 bg-gradient-to-l from-transparent to-champagne/40', tone === 'light' && 'to-champagne-soft/50')} />
    </div>
  );
}
