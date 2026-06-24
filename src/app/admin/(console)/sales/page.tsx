import { TrendingUp } from 'lucide-react';
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder';
import { requireStaffRole } from '@/lib/staff';

export default async function AdminSalesPage() {
  await requireStaffRole([]);
  return (
    <AdminPlaceholder
      icon={TrendingUp}
      section="Sales"
      title="Sales & Revenue"
      description="Revenue reporting, sales performance, and business analytics. This section requires the order and payment infrastructure to be live before it can populate with real data."
      features={[
        {
          label: 'Revenue overview',
          description: 'Total revenue by day, week, month, and year. Comparison to previous periods.',
        },
        {
          label: 'Sales by category',
          description: 'Revenue breakdown by rings, necklaces, bracelets, and earrings. Average order value per category.',
        },
        {
          label: 'Top products',
          description: 'Best-selling pieces by revenue and volume. Which diamonds are most requested.',
        },
        {
          label: 'Conversion tracking',
          description: 'Enquiry-to-order conversion rate. Average time from first enquiry to purchase.',
        },
        {
          label: 'Outstanding balances',
          description: 'Clients with deposits paid but balance outstanding. Automated reminders.',
        },
        {
          label: 'Export & reporting',
          description: 'Download monthly sales reports as CSV or PDF for accountancy purposes.',
        },
      ]}
    />
  );
}
