import { ShoppingBag } from 'lucide-react';
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder';
import { requireStaffRole } from '@/lib/staff';

export default async function AdminOrdersPage() {
  await requireStaffRole([]);
  return (
    <AdminPlaceholder
      icon={ShoppingBag}
      section="Orders"
      title="Order Management"
      description="This section will manage the full client order journey — from initial reservation through production, quality check, dispatch, and delivery. It will be built once the client-side checkout and payment flow is live."
      features={[
        {
          label: 'Order pipeline',
          description: 'Kanban-style board showing every order by stage: Reserved, In Production, Quality Check, Dispatched, Delivered.',
        },
        {
          label: 'Order detail',
          description: 'Full order record showing the product, diamond, metal choice, client details, payment status, and timeline.',
        },
        {
          label: 'Status updates',
          description: 'Move an order between stages with one click. Automated email sent to client at each stage transition.',
        },
        {
          label: 'Payment tracking',
          description: 'Stripe payment status, deposit vs balance due, refunds, and payment history per order.',
        },
        {
          label: 'Production notes',
          description: 'Internal notes per order — sizing, engraving instructions, special requests, workshop communication.',
        },
        {
          label: 'Dispatch & tracking',
          description: 'Courier tracking number entry, estimated delivery date, and automatic dispatch notification to client.',
        },
      ]}
    />
  );
}
