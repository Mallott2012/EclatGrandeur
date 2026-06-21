import { describe, it, expect } from 'vitest';
import { enquirySchema, appointmentSchema } from '@/lib/validation/enquiry';

const validContact = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
};

describe('enquirySchema', () => {
  it('accepts a valid enquiry', () => {
    const result = enquirySchema.safeParse({
      type: 'quote',
      source: 'pdp',
      contact: validContact,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = enquirySchema.safeParse({
      type: 'quote',
      source: 'pdp',
      contact: { ...validContact, email: 'not-an-email' },
    });
    expect(result.success).toBe(false);
  });
});

describe('appointmentSchema', () => {
  it('requires at least one preferred date', () => {
    const result = appointmentSchema.safeParse({
      type: 'appointment',
      source: 'appointments',
      mode: 'in-store',
      preferredDates: [],
      contact: validContact,
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid appointment', () => {
    const result = appointmentSchema.safeParse({
      type: 'appointment',
      source: 'appointments',
      mode: 'virtual',
      preferredDates: ['2026-07-01'],
      interests: ['engagement-rings'],
      contact: validContact,
    });
    expect(result.success).toBe(true);
  });
});
