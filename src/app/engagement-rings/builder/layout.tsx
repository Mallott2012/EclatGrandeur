import type { Metadata } from 'next';
import { StepProgress } from '@/components/builder/StepProgress';

export const metadata: Metadata = {
  title: 'Create Your Own Ring',
  description:
    'Design your engagement ring — choose a setting, select your diamond by the 4Cs, and see it rendered in three dimensions.',
};

export default function BuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ivory">
      <StepProgress />
      {children}
    </div>
  );
}
