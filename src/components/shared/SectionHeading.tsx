import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
  as?: 'h1' | 'h2';
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
  as = 'h2',
}: SectionHeadingProps) {
  const Tag = as;
  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        align === 'center' ? 'items-center text-center' : 'items-start text-left',
        className
      )}
    >
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <Tag className="text-3xl font-light leading-tight text-ink md:text-5xl">
        {title}
      </Tag>
      {description && (
        <p
          className={cn(
            'max-w-2xl text-base font-light leading-relaxed text-ink/70',
            align === 'center' && 'mx-auto'
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
