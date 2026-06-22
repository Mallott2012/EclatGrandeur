'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit';

export async function logoutAction(): Promise<void> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await writeAuditLog({
      actorUserId: user.id,
      action: 'admin.logout',
    });
  }

  await supabase.auth.signOut();
  redirect('/admin/login');
}
