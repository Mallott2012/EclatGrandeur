import { Mail } from 'lucide-react';
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder';
import { requireStaffRole } from '@/lib/staff';

export default async function AdminCommunicationsPage() {
  await requireStaffRole([]);
  return (
    <AdminPlaceholder
      icon={Mail}
      section="Communications"
      title="Communications"
      description="A complete log of every email and message sent between Éclat Grandeur and its clients. Reply to enquiries, send order updates, and track all correspondence in one inbox — requires Resend to be configured."
      features={[
        {
          label: 'Shared inbox',
          description: 'All inbound client emails in one place, regardless of which address they were sent to.',
        },
        {
          label: 'Reply from admin',
          description: 'Reply to any client email directly from this interface without leaving the admin.',
        },
        {
          label: 'Thread view',
          description: 'Full conversation history per client, showing every message in chronological order.',
        },
        {
          label: 'Order update emails',
          description: 'Trigger status update emails to clients when their order moves to a new stage.',
        },
        {
          label: 'Appointment confirmations',
          description: 'Automatically send and manage appointment confirmation and reminder emails.',
        },
        {
          label: 'Delivery tracking',
          description: 'Log of all sent emails with open and click tracking via Resend webhooks.',
        },
      ]}
    />
  );
}
