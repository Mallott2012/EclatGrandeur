'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useBuilder } from '@/lib/builder/store';
import { getSettings } from '@/lib/data/diamonds';
import { formatMoney, cn, SHIMMER_BLUR } from '@/lib/utils';

export default function SettingStep() {
  const router = useRouter();
  const { settingSlug, setSetting } = useBuilder();
  const settings = getSettings();

  const choose = (slug: string) => {
    setSetting(slug);
    router.push('/engagement-rings/builder/diamond');
  };

  return (
    <div className="container-luxe py-14">
      <div className="mb-12 text-center">
        <span className="eyebrow">Step One</span>
        <h1 className="mt-3 font-display text-4xl font-light text-ink">Choose Your Setting</h1>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {settings.map((setting) => (
          <button
            key={setting.id}
            onClick={() => choose(setting.slug)}
            className={cn(
              'group flex flex-col text-left transition',
              settingSlug === setting.slug && 'ring-2 ring-champagne ring-offset-4'
            )}
          >
            <div className="relative aspect-square w-full overflow-hidden bg-ivory-deep">
              <Image
                src={setting.images[0].src}
                alt={setting.images[0].alt}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                placeholder="blur"
                blurDataURL={SHIMMER_BLUR}
                className="object-cover transition-transform duration-700 ease-luxe group-hover:scale-105"
              />
            </div>
            <h3 className="mt-4 font-display text-xl text-ink">{setting.name}</h3>
            <p className="text-sm font-light text-ink/60">
              From {formatMoney(setting.basePrice)}
            </p>
            <span className="mt-2 text-[10px] uppercase tracking-luxe text-champagne-deep opacity-0 transition group-hover:opacity-100">
              Select →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
