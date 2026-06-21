import { describe, it, expect } from 'vitest';
import { enquirySchema, appointmentSchema } from '@/lib/validation';

describe('enquirySchema', () => {
  it('accepts a well-formed enquiry', () => {
    const r = enquirySchema.safeParse({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      message: 'I would like to discuss a bespoke ring please.',
    });
    expect(r.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const r = enquirySchema.safeParse({ name: 'Ada', email: 'nope', message: 'Hello there friend' });
    expect(r.success).toBe(false);
  });

  it('rejects a too-short message', () => {
    const r = enquirySchema.safeParse({ name: 'Ada', email: 'ada@example.com', message: 'hi' });
    expect(r.success).toBe(false);
  });
});

describe('appointmentSchema', () => {
  it('accepts a valid appointment request', () => {
    const r = appointmentSchema.safeParse({
      name: 'Grace Hopper',
      email: 'grace@example.com',
      phone: '+44 20 7000 0000',
      type: 'atelier',
      date: '2026-07-01',
    });
    expect(r.success).toBe(true);
  });

  it('rejects an unknown appointment type', () => {
    const r = appointmentSchema.safeParse({
      name: 'Grace',
      email: 'grace@example.com',
      phone: '123456',
      type: 'carrier-pigeon',
      date: '2026-07-01',
    });
    expect(r.success).toBe(false);
  });
});
