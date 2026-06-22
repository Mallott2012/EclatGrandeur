'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
// Note: redirect is still used by logoutAction below.
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { writeAuditLog } from '@/lib/audit';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export interface LoginState {
  error?: string;
  success?: boolean;
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
  const adminClient = createAdminClient();
  const { data: roleRows, error: rolesError } = await adminClient
    .from('staff_roles')
    .select('role')
    .eq('user_id', data.user.id);

  if (rolesError) {
    await supabase.auth.signOut();
    return { error: 'Failed to verify staff access. Please try again.' };
  }

  const roles = (roleRows ?? []).map((r) => r.role as string);

  if (roles.length === 0) {
    await supabase.auth.signOut();
    return { error: 'Your account does not have staff access. Contact a super admin.' };
  }

  await writeAuditLog({
    actorUserId: data.user.id,
    action: 'admin.login',
    metadata: { roles },
  });

  // Return success — do NOT call redirect() here. redirect() inside a Server
  // Action discards the Set-Cookie headers that Supabase wrote, so the session
  // never reaches the browser. The client component does router.push instead.
  return { success: true };
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
