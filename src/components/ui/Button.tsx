import Link from 'next/link';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'outline' | 'ghost' | 'gold';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 font-sans uppercase tracking-luxe transition-all duration-500 ease-luxe disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-champagne';

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-ivory hover:bg-ink-soft',
  outline: 'border border-ink/30 text-ink hover:border-ink hover:bg-ink hover:text-ivory',
  ghost: 'text-ink hover:text-champagne-deep',
  gold: 'bg-champagne text-ink hover:bg-champagne-deep hover:text-ivory',
};

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-[10px]',
  md: 'px-7 py-3.5 text-xs',
  lg: 'px-10 py-4 text-xs',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

type ButtonAsButton = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type ButtonAsLink = CommonProps & { href: string };

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = 'primary', size = 'md', className, children } = props;
  const classes = cn(base, variants[variant], sizes[size], className);

  if ('href' in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  const { variant: _v, size: _s, className: _c, children: _ch, ...rest } =
    props as ButtonAsButton;
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
