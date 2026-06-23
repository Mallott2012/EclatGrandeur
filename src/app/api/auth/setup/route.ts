import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/auth/setup
 *
 * One-time route to create the very first super_admin user.
 * It is automatically disabled once any super_admin row exists in staff_roles.
 * No auth is required — anyone can call it — but it is a no-op after the first
 * super admin is created, so it is safe to leave in place.
 */
export async function POST(request: Request) {
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
