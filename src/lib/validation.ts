import { z } from 'zod';

const configuredRingSchema = z.object({
  settingId:            z.string(),
  settingName:          z.string(),
  settingSlug:          z.string(),
  metalVariantId:       z.string(),
  metal:                z.string(),
  metalLabel:           z.string(),
  diamondId:            z.string(),
  diamondSku:           z.string(),
  diamondDescription:   z.string(),
  diamondCategory:      z.enum(['white', 'coloured']),
  diamondShape:         z.string(),
  diamondCarat:         z.number(),
  colourFamily:         z.enum(['yellow', 'pink']).optional(),
  colourIntensity:      z.string().optional(),
  ringSize:             z.string().nullable(),
  settingPrice:         z.number().int().nonnegative(),
  diamondPrice:         z.number().int().nonnegative(),
  totalPrice:           z.number().int().nonnegative(),
  reservationExpiresAt: z.string(),
});

export const enquirySchema = z.object({
  name:    z.string().min(2, 'Please enter your name'),
  email:   z.string().email('Please enter a valid email'),
  phone:   z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10, 'Please tell us a little more'),
  /** Hidden context, e.g. the piece being enquired about. */
  context:    z.string().optional(),
  /** Structured configured ring snapshot (Phase 6). */
  ringConfig: configuredRingSchema.optional(),
  /** Cart token for reservation ownership verification (Phase 6). */
  cartToken:  z.string().optional(),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

export const appointmentSchema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(6, 'Please enter a contact number'),
  type: z.enum(['atelier', 'virtual', 'phone']),
  date: z.string().min(1, 'Please choose a date'),
  interest: z.string().optional(),
  message: z.string().optional(),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;
