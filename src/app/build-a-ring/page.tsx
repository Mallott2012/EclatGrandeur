import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getSettings, getDiamonds } from '@/lib/data';
import { BuildYourRing } from '@/components/builder/BuildYourRing';

export const metadata: Metadata = {
  title: 'Build Your Own Ring',
  description:
    'Design a one-of-a-kind engagement ring in three steps: choose a setting, select a certified diamond, and complete your ring with live pricing.',
};

export default function BuildARingPage() {
  const settings = getSettings();
  const diamonds = getDiamonds();

  return (
    <div className="bg-ivory">
      <Suspense fallback={<div className="container-luxe py-24 text-center text-ink/50">Loading the ring builder…</div>}>
        <BuildYourRing settings={settings} diamonds={diamonds} />
      </Suspense>
    </div>
  );
}
