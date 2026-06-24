// Shared action result types for bracelet settings admin. Types/constants only.

export type BraceletSettingActionResult =
  | { success: false; message: string; fieldErrors: Record<string, string> }
  | { success: true }

export const BRACELET_SETTING_ACTION_INITIAL: BraceletSettingActionResult = {
  success:     false,
  message:     '',
  fieldErrors: {},
}

export type BraceletSettingSimpleResult =
  | { success: false; message: string }
  | { success: true }

export const BRACELET_SETTING_SIMPLE_INITIAL: BraceletSettingSimpleResult = {
  success: false,
  message: '',
}
