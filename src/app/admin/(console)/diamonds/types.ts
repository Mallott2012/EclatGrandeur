// Shared action result types for diamond admin forms and controls.
// No 'use server' — this file contains only types and plain constants.

export type DiamondActionResult =
  | { success: false; message: string; fieldErrors: Record<string, string> }
  | { success: true }

export const DIAMOND_ACTION_INITIAL: DiamondActionResult = {
  success:     false,
  message:     '',
  fieldErrors: {},
}

export type DiamondSimpleResult =
  | { success: false; message: string }
  | { success: true }

export const DIAMOND_SIMPLE_INITIAL: DiamondSimpleResult = {
  success: false,
  message: '',
}

export type CertUrlResult =
  | { status: 'idle' }
  | { status: 'success'; signed_url: string; expires_at: string }
  | { status: 'error'; message: string }

export const CERT_URL_INITIAL: CertUrlResult = { status: 'idle' }
