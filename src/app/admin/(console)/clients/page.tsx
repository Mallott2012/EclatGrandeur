import { Users } from 'lucide-react';
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder';
import { requireStaffRole } from '@/lib/staff';

export default async function AdminClientsPage() {
  await requireStaffRole([]);
  return (
    <AdminPlaceholder
      icon={Users}
      section="Clients"
      title="Client List"
      description="A unified client record built from enquiries, orders, and appointments. Every person who has contacted or purchased from Éclat Grandeur in one place, with their full history."
      features={[
        {
          label: 'Client profiles',
          description: 'Name, contact details, preferred metal, ring size, anniversary dates, and any notes from previous consultations.',
        },
        {
          label: 'Enquiry history',
          description: 'Every enquiry a client has submitted, with status and the staff member who handled it.',
        },
        {
          label: 'Order history',
          description: 'All orders placed, pieces purchased, total spend, and current order status.',
        },
        {
          label: 'Appointment history',
          description: 'In-store and virtual appointments — date, advisor, outcome, and follow-up actions.',
        },
        {
          label: 'Communication log',
          description: 'Every email sent to and from the client, regardless of which staff member sent it.',
        },
        {
          label: 'VIP flagging',
          description: 'Mark high-value or repeat clients for priority handling and bespoke outreach.',
        },
      ]}
    />
  );
}
