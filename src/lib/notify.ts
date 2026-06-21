/**
 * Lightweight notification seam. Logs to the server console by default; if a
 * RESEND_API_KEY is present the payload is emailed to the concierge inbox.
 * Swap for your CRM/ESP of choice without touching the API routes.
 */
import { siteConfig } from '@/config/site';

export async function notifyConcierge(subject: string, payload: Record<string, unknown>) {
  const key = process.env.RESEND_API_KEY;

  if (!key) {
    // eslint-disable-next-line no-console
    console.info(`[concierge] ${subject}`, payload);
    return { delivered: false as const, channel: 'console' as const };
  }

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Éclat Grandeur <concierge@eclatgrandeur.com>',
        to: siteConfig.contact.email,
        subject,
        text: Object.entries(payload)
          .map(([k, v]) => `${k}: ${String(v)}`)
          .join('\n'),
      }),
    });
    return { delivered: true as const, channel: 'email' as const };
  } catch {
    // eslint-disable-next-line no-console
    console.error(`[concierge] failed to deliver "${subject}"`, payload);
    return { delivered: false as const, channel: 'error' as const };
  }
}
