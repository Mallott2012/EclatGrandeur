import { Layout } from 'lucide-react';
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder';
import { requireStaffRole } from '@/lib/staff';

export default async function AdminHomepagePage() {
  await requireStaffRole([]);
  return (
    <AdminPlaceholder
      icon={Layout}
      section="Homepage"
      title="Homepage Editor"
      description="Edit every hero panel, section heading, and featured collection on the homepage from one place. Currently, hero images can be changed from each individual collection page — this will consolidate all homepage editing here."
      features={[
        {
          label: 'All 5 hero panels',
          description: 'Edit the homepage hero, engagement rings, necklaces, bracelets, and earrings panels — image or video, headline, subheadline — in one view.',
        },
        {
          label: 'Featured collections',
          description: 'Choose which products appear in the homepage featured grid and in what order.',
        },
        {
          label: 'Section headings',
          description: 'Edit the heading and copy for each homepage section without a developer.',
        },
        {
          label: 'Announcement banner',
          description: 'Toggle on/off a site-wide announcement banner — promotions, events, closures.',
        },
        {
          label: 'Live preview',
          description: 'See exactly how the homepage will look before publishing changes.',
        },
        {
          label: 'Scheduled publishing',
          description: 'Set a future date and time for homepage changes to go live automatically.',
        },
      ]}
    />
  );
}
