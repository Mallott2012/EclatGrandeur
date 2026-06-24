import { NextResponse } from 'next/server';
import { enquirySchema } from '@/lib/validation';
import { notifyConcierge } from '@/lib/notify';
import { createEnquiry } from '@/lib/enquiries/service';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = enquirySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, email, phone, subject, message, context } = parsed.data;

  // Persist to DB (fire and forget on failure — don't block the user response)
  try {
    await createEnquiry({
      customer_name:  name,
      customer_email: email,
      customer_phone: phone ?? null,
      subject:        subject ?? context ?? null,
      message,
    });
  } catch (err) {
    // Log but don't surface to the customer
    console.error('[enquiry] Failed to persist to DB:', err);
  }

  await notifyConcierge(`New enquiry from ${name}`, parsed.data);
  return NextResponse.json({ ok: true });
}
