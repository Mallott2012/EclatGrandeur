import type { Metadata } from 'next';
import { getSettings, getDiamonds } from '@/lib/data';
import { RingBuilder } from '@/components/builder/RingBuilder';

export const metadata: Metadata = {
  title: 'Design Your Own Ring',
  description:
    'Create a one-of-a-kind engagement ring in three steps: choose a setting, select a GIA-certified diamond by the 4Cs, and see it come to life with live pricing.',
};

export default function BuilderPage() {
  return <RingBuilder settings={getSettings()} diamonds={getDiamonds()} />;
}
