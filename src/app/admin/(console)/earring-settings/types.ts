// Shared action result types for earring settings admin. Types/constants only.

export type EarringSettingActionResult =
  | { success: false; message: string; fieldErrors: Record<string, string> }
  | { success: true }

export const EARRING_SETTING_ACTION_INITIAL: EarringSettingActionResult = {
  success:     false,
  message:     '',
  fieldErrors: {},
}

export type EarringSettingSimpleResult =
  | { success: false; message: string }
  | { success: true }

export const EARRING_SETTING_SIMPLE_INITIAL: EarringSettingSimpleResult = {
  success: false,
  message: '',
}
