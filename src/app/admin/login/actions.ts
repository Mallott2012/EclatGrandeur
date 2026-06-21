'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCurrentStaffRoles } from '@/lib/staff';
import { writeAuditLog } from '@/lib/audit';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export interface LoginState {
  error?: string;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return { error: 'Invalid email or password.' };
  }

  // Verify the user actually holds a staff role before granting access.
  const roles = await getCurrentStaffRoles();
  if (roles.length === 0) {
    // Sign them back out — authenticated but not staff.
    await supabase.auth.signOut();
    return { error: 'Your account does not have staff access. Contact a super admin.' };
  }

  await writeAuditLog({
    actorUserId: data.user.id,
    action: 'admin.login',
    metadata: { roles },
  });

  redirect('/admin');
}

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
