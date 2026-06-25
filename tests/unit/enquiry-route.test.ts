import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/enquiries/service', () => ({
  createEnquiry: vi.fn(),
}));

vi.mock('@/lib/notify', () => ({
  notifyConcierge: vi.fn().mockResolvedValue({ delivered: false, channel: 'console' }),
}));

import { POST } from '@/app/api/enquiry/route';
import { createEnquiry } from '@/lib/enquiries/service';
import { notifyConcierge } from '@/lib/notify';

const VALID_BODY = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'I would like to discuss a bespoke engagement ring.',
};

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/enquiry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/enquiry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 and ok:true when DB insert succeeds', async () => {
    vi.mocked(createEnquiry).mockResolvedValue({
      id: 'abc',
      enquiry_number: 'EQ-00001',
      customer_name: 'Ada Lovelace',
      customer_email: 'ada@example.com',
      customer_phone: null,
      subject: null,
      message: 'I would like to discuss a bespoke engagement ring.',
      ring_setting_id: null,
      diamond_id: null,
      jewellery_product_id: null,
      metal: null,
      status: 'new',
      assigned_to: null,
      notes: null,
      configuration: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it('returns 503 and ok:false when DB insert throws — enquiry not silently accepted', async () => {
    vi.mocked(createEnquiry).mockRejectedValue(
      new Error('relation "enquiries" does not exist')
    );

    const res = await POST(makeRequest(VALID_BODY));

    // Must be non-2xx — customer must not be told their enquiry was saved
    expect(res.status).toBeGreaterThanOrEqual(400);

    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(typeof json.error).toBe('string');
  });

  it('does not call notifyConcierge when DB insert fails', async () => {
    vi.mocked(createEnquiry).mockRejectedValue(new Error('DB unavailable'));

    await POST(makeRequest(VALID_BODY));

    expect(vi.mocked(notifyConcierge)).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid request body', async () => {
    const res = await POST(makeRequest({ name: 'X', email: 'not-an-email', message: 'hi' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  it('returns 400 for malformed JSON', async () => {
    const req = new Request('http://localhost/api/enquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json {{{',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
