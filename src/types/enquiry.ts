import type { Category, Metal, Money } from './common';

export type EnquiryType = 'quote' | 'appointment' | 'general' | 'bespoke';
export type AppointmentMode = 'in-store' | 'virtual';
export type EnquirySource =
  | 'pdp'
  | 'builder'
  | 'appointments'
  | 'contact'
  | 'high-jewellery';

export interface ContactDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  preferredContact?: 'email' | 'phone';
}

export interface Enquiry {
  id?: string;
  type: EnquiryType;
  contact: ContactDetails;
  message?: string;
  productSlug?: string;
  builtRing?: { settingSlug: string; diamondSku: string; metal: Metal };
  budget?: Money;
  createdAt?: string;
  source: EnquirySource;
}

export interface Appointment extends Enquiry {
  type: 'appointment';
  mode: AppointmentMode;
  preferredDates: string[];
  location?: string;
  interests?: Category[];
}
