// Shared action result types for ring settings admin.
// No 'use server' — types and plain constants only.

export type RingSettingActionResult =
  | { success: false; message: string; fieldErrors: Record<string, string> }
  | { success: true }

export const RING_SETTING_ACTION_INITIAL: RingSettingActionResult = {
  success:     false,
  message:     '',
  fieldErrors: {},
}

export type RingSettingSimpleResult =
  | { success: false; message: string }
  | { success: true }

export const RING_SETTING_SIMPLE_INITIAL: RingSettingSimpleResult = {
  success: false,
  message: '',
}
