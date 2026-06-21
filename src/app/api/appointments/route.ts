import { NextResponse } from 'next/server';
import { appointmentSchema } from '@/lib/validation';
import { notifyConcierge } from '@/lib/notify';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = appointmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  await notifyConcierge('New appointment request', parsed.data);
  return NextResponse.json({ ok: true });
}
