import { z } from 'zod';

export const enquirySchema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10, 'Please tell us a little more'),
  /** Hidden context, e.g. the piece being enquired about. */
  context: z.string().optional(),
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
