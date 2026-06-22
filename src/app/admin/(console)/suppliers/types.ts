// Shared action result type used by SupplierForm and DeactivateButton.
// No 'use server' — this file only contains types and a plain constant.

export type SupplierActionResult =
  | { success: false; message: string; fieldErrors: Record<string, string> }
  | { success: true; id: string }

export const SUPPLIER_ACTION_INITIAL: SupplierActionResult = {
  success:     false,
  message:     '',
  fieldErrors: {},
}
