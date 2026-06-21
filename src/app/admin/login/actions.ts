'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getStaffRoles } from '@/lib/auth/session';

const credentialsSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

export interface LoginState {
  error?: string;
}

/**
 * Sign in with email + password, then verify the user actually holds a staff
 * role before allowing them into /admin. An authenticated account with no staff
 * role is signed straight back out — authorisation is never UI-only.
 */
export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid credentials.' };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: 'Incorrect email or password.' };
  }

  const roles = await getStaffRoles();
  if (roles.length === 0) {
    await supabase.auth.signOut();
    return { error: 'This account does not have staff access.' };
  }

  redirect('/admin');
}

/** Sign the current user out and return to the login page. */
export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
