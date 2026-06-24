import Link from 'next/link';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'gold' | 'outline' | 'ghost' | 'light';
type Size = 'sm' | 'md' | 'lg';

const base =
  'group/btn relative inline-flex items-center justify-center gap-2.5 font-sans uppercase tracking-luxe transition-all duration-500 ease-luxe disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-champagne';

const variants: Record<Variant, string> = {
  primary: 'bg-noir text-ivory hover:bg-noir-soft',
  gold: 'bg-champagne text-noir hover:bg-champagne-soft shadow-gold',
  outline: 'border border-ink/30 text-ink hover:border-ink hover:bg-ink hover:text-ivory',
  ghost: 'text-ink hover:text-champagne-deep',
  light: 'border border-ivory/40 text-ivory hover:bg-ivory hover:text-noir',
};

const sizes: Record<Size, string> = {
  sm: 'px-5 py-2.5 text-[10px]',
  md: 'px-8 py-3.5 text-[11px]',
  lg: 'px-11 py-4 text-[11px]',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}
type AsButton = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type AsLink = CommonProps & { href: string };

export function Button(props: AsButton | AsLink) {
  const { variant = 'primary', size = 'md', className, children } = props;
  const classes = cn(base, variants[variant], sizes[size], className);

  if ('href' in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }
  const { variant: _v, size: _s, className: _c, children: _ch, ...rest } = props as AsButton;
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
