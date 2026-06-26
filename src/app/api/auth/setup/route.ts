import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/auth/setup
 *
 * One-time route used to create the very first super_admin user.
 *
 * DISABLED BY DEFAULT. To re-enable for a fresh setup, set:
 *   SETUP_ENABLED=true
 * in your local .env.local (server-only, never NEXT_PUBLIC_).
 * Remove or unset SETUP_ENABLED immediately after use.
 *
 * The route also self-blocks once any super_admin row exists in staff_roles,
 * providing a second layer of protection even when SETUP_ENABLED is set.
 */
export async function POST(request: Request) {
  // Hard-disabled unless SETUP_ENABLED=true is explicitly set server-side.
  // Defaults to off — no client can override this.
  if (process.env.SETUP_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Block if a super_admin already exists
  const { data: existing } = await admin
    .from('staff_roles')
    .select('id')
    .eq('role', 'super_admin')
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: 'Setup is disabled — a super admin already exists.' },
      { status: 403 },
    );
  }

  // Create the auth user
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm — no email needed
  });

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message ?? 'Failed to create user.' },
      { status: 500 },
    );
  }

  // Insert the super_admin role
  const { error: roleError } = await admin.from('staff_roles').insert({
    user_id: created.user.id,
    role: 'super_admin',
  });

  if (roleError) {
    // Clean up the orphaned auth user
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json(
      { error: 'Failed to assign super admin role.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, userId: created.user.id });
}
