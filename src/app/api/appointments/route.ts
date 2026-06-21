import { NextResponse } from 'next/server';
import { appointmentSchema } from '@/lib/validation/enquiry';
import { notifyEnquiry } from '@/lib/notify';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = appointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  await notifyEnquiry(parsed.data);
  return NextResponse.json({ ok: true });
}
