'use server';

import { redirect } from 'next/navigation'; // used by logoutAction
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { writeAuditLog } from '@/lib/audit';

export type LoginState = { error: string; redirectTo?: never } | { redirectTo: string; error?: never } | null;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email    = (formData.get('email')    as string | null)?.trim() ?? '';
  const password = (formData.get('password') as string | null) ?? '';

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: 'Invalid email or password.' };
  }

  // Verify staff role
  const adminClient = createAdminClient();
  const { data: roleRows, error: rolesError } = await adminClient
    .from('staff_roles')
    .select('role')
    .eq('user_id', data.user.id);

  if (rolesError || !roleRows?.length) {
    await supabase.auth.signOut();
    return { error: 'Your account does not have staff access.' };
  }

  await writeAuditLog({
    actorUserId: data.user.id,
    action: 'admin.login',
    metadata: { roles: roleRows.map((r: { role: string }) => r.role) },
  });

  // Return redirect signal — the client does window.location.href for a hard
  // reload so the newly-set session cookies are included in the next request.
  return { redirectTo: '/admin' };
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
