import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import { writeAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  // Build a response object first so we can write cookies onto it.
  const response = NextResponse.json({ ok: true });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  // Verify staff role.
  const adminClient = createAdminClient();
  const { data: roleRows, error: rolesError } = await adminClient
    .from('staff_roles')
    .select('role')
    .eq('user_id', data.user.id);

  if (rolesError || !roleRows?.length) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: 'Your account does not have staff access.' },
      { status: 403 },
    );
  }

  await writeAuditLog({
    actorUserId: data.user.id,
    action: 'admin.login',
    metadata: { roles: roleRows.map((r) => r.role) },
  });

  return response;
}
