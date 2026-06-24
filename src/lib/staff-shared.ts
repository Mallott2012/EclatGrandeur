/**
 * Shared staff role types and constants — safe to import in both server and
 * client components. Contains no server-only code or Supabase imports.
 */

export type StaffRole = 'super_admin' | 'sales_adviser' | 'diamond_buyer' | 'content_editor';

export const STAFF_ROLES: readonly StaffRole[] = [
  'super_admin',
  'sales_adviser',
  'diamond_buyer',
  'content_editor',
] as const;

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  super_admin: 'Super Admin',
  sales_adviser: 'Sales Adviser',
  diamond_buyer: 'Diamond Buyer',
  content_editor: 'Content Editor',
};

export interface StaffUser {
  id: string;
  email: string;
  fullName: string | null;
  roles: StaffRole[];
}
