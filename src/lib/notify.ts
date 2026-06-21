import { siteConfig } from '@/config/site';

/**
 * Deliver an enquiry/appointment notification.
 * v1: logs to the server console; sends via Resend when RESEND_API_KEY is set.
 * Phase 2: route to CRM / Sanity.
 */
export async function notifyEnquiry(payload: unknown): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ENQUIRY_NOTIFY_EMAIL ?? siteConfig.contact.email;

  if (!apiKey) {
    // eslint-disable-next-line no-console
    console.info('[enquiry] (no RESEND_API_KEY — logging only)', JSON.stringify(payload));
    return;
  }

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${siteConfig.name} <concierge@eclatgrandeur.com>`,
        to,
        subject: 'New client enquiry',
        text: JSON.stringify(payload, null, 2),
      }),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[enquiry] failed to send notification', err);
  }
}
