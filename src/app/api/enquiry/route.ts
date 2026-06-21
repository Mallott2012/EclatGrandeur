import { NextResponse } from 'next/server';
import { enquirySchema } from '@/lib/validation';
import { notifyConcierge } from '@/lib/notify';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = enquirySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  await notifyConcierge('New enquiry', parsed.data);
  return NextResponse.json({ ok: true });
}
