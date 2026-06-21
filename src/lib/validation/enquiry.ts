import { z } from 'zod';

export const contactSchema = z.object({
  firstName: z.string().min(1, 'Please enter your first name'),
  lastName: z.string().min(1, 'Please enter your last name'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  preferredContact: z.enum(['email', 'phone']).optional(),
});

export const enquirySchema = z.object({
  type: z.enum(['quote', 'appointment', 'general', 'bespoke']),
  contact: contactSchema,
  message: z.string().max(2000).optional(),
  productSlug: z.string().optional(),
  builtRing: z
    .object({
      settingSlug: z.string(),
      diamondSku: z.string(),
      metal: z.enum(['platinum', 'yellow-gold', 'white-gold', 'rose-gold']),
    })
    .optional(),
  source: z.enum(['pdp', 'builder', 'appointments', 'contact', 'high-jewellery']),
});

export const appointmentSchema = enquirySchema.extend({
  type: z.literal('appointment'),
  mode: z.enum(['in-store', 'virtual']),
  preferredDates: z.array(z.string()).min(1, 'Please choose at least one date'),
  location: z.string().optional(),
  interests: z
    .array(
      z.enum([
        'engagement-rings',
        'necklaces',
        'bracelets',
        'earrings',
        'wedding-bands',
        'high-jewellery',
      ])
    )
    .optional(),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;
export type AppointmentInput = z.infer<typeof appointmentSchema>;
