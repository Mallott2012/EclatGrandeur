import { cn } from '@/lib/utils';

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  tone?: 'dark' | 'light';
  className?: string;
  as?: 'h1' | 'h2';
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  tone = 'dark',
  className,
  as = 'h2',
}: Props) {
  const Tag = as;
  const titleColor = tone === 'light' ? 'text-ivory' : 'text-ink';
  const descColor = tone === 'light' ? 'text-ivory/70' : 'text-ink/65';
  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        align === 'center' ? 'items-center text-center' : 'items-start text-left',
        className
      )}
    >
      {eyebrow && (
        <span className={tone === 'light' ? 'eyebrow-light' : 'eyebrow'}>{eyebrow}</span>
      )}
      <Tag className={cn('text-3xl font-light leading-[1.1] md:text-5xl', titleColor)}>
        {title}
      </Tag>
      {description && (
        <p
          className={cn(
            'max-w-2xl text-base font-light leading-relaxed',
            descColor,
            align === 'center' && 'mx-auto'
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
