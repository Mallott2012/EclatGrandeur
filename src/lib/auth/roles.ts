/**
 * Staff role definitions for the Éclat Grandeur admin platform (Phase 0).
 *
 * `staff_roles` is a separate table (one row per assignment) so that a single
 * user can hold multiple roles in future phases. The UI may surface a single
 * "primary" role for now, but the data model and helpers treat roles as a set.
 *
 * Future admin modules attach their authorisation here by calling
 * `requireStaffRole([...])` (see ./session.ts) with the narrower set of roles
 * permitted for that module, e.g.:
 *   - Diamonds      -> ['super_admin', 'diamond_buyer']
 *   - Ring Settings -> ['super_admin', 'content_editor']
 *   - Enquiries     -> ['super_admin', 'sales_adviser']
 */

export const STAFF_ROLES = [
  'super_admin',
  'sales_adviser',
  'diamond_buyer',
  'content_editor',
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

/** Human-readable labels for display in the admin shell. */
export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  super_admin: 'Super Admin',
  sales_adviser: 'Sales Adviser',
  diamond_buyer: 'Diamond Buyer',
  content_editor: 'Content Editor',
};

/** Type guard: narrow an untrusted string to a StaffRole. */
export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === 'string' && (STAFF_ROLES as readonly string[]).includes(value);
}

/** Every role currently permitted into the base admin shell. */
export const ALL_STAFF_ROLES: StaffRole[] = [...STAFF_ROLES];
