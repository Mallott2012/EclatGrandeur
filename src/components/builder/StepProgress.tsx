'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Check } from 'lucide-react';
import { useBuilder } from '@/lib/builder/store';
import { cn } from '@/lib/utils';

const STEPS = [
  { key: 'setting', label: 'Setting', href: '/engagement-rings/builder/setting' },
  { key: 'diamond', label: 'Diamond', href: '/engagement-rings/builder/diamond' },
  { key: 'review', label: 'Review', href: '/engagement-rings/builder/review' },
];

export function StepProgress() {
  const pathname = usePathname();
  const { settingSlug, diamondSku } = useBuilder();

  const completed: Record<string, boolean> = {
    setting: Boolean(settingSlug),
    diamond: Boolean(diamondSku),
    review: Boolean(settingSlug && diamondSku),
  };

  return (
    <div className="border-b border-ink/10 bg-ivory">
      <div className="container-luxe flex items-center justify-center gap-4 py-5 md:gap-10">
        {STEPS.map((step, i) => {
          const active = pathname === step.href;
          const isDone = completed[step.key] && !active;
          return (
            <Link
              key={step.key}
              href={step.href}
              className="flex items-center gap-3"
            >
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full border text-xs transition',
                  active
                    ? 'border-ink bg-ink text-ivory'
                    : isDone
                      ? 'border-champagne bg-champagne text-ink'
                      : 'border-ink/30 text-ink/50'
                )}
              >
                {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={2} /> : i + 1}
              </span>
              <span
                className={cn(
                  'text-xs uppercase tracking-luxe',
                  active ? 'text-ink' : 'text-ink/50'
                )}
              >
                {step.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
