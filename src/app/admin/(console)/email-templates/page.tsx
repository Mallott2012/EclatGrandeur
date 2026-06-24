import { FileText } from 'lucide-react';
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder';
import { requireStaffRole } from '@/lib/staff';

export default async function AdminEmailTemplatesPage() {
  await requireStaffRole([]);
  return (
    <AdminPlaceholder
      icon={FileText}
      section="Email Templates"
      title="Email Templates"
      description="Branded HTML email templates for every stage of the client journey — enquiry confirmations, order updates, appointment reminders, and marketing. Edit content and preview in real time before sending."
      features={[
        {
          label: 'Enquiry confirmation',
          description: 'Sent automatically to the client when they submit an enquiry. Acknowledges receipt and sets expectations for response time.',
        },
        {
          label: 'Order confirmation',
          description: 'Sent when a client places an order. Summarises the piece, diamond, metal, price, and estimated timeline.',
        },
        {
          label: 'Order status updates',
          description: 'Templates for each production stage — In Production, Quality Check, Dispatched. Auto-populated with order details.',
        },
        {
          label: 'Appointment confirmation',
          description: 'Booking confirmation with date, time, location or video call link, and advisor name.',
        },
        {
          label: 'Appointment reminder',
          description: 'Automated reminder sent 24 hours before a scheduled appointment.',
        },
        {
          label: 'Bespoke follow-up',
          description: 'Post-consultation follow-up template summarising the brief discussed and next steps.',
        },
      ]}
    />
  );
}
