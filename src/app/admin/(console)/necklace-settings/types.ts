// Shared action result types for necklace settings admin. Types/constants only.

export type NecklaceSettingActionResult =
  | { success: false; message: string; fieldErrors: Record<string, string> }
  | { success: true }

export const NECKLACE_SETTING_ACTION_INITIAL: NecklaceSettingActionResult = {
  success:     false,
  message:     '',
  fieldErrors: {},
}

export type NecklaceSettingSimpleResult =
  | { success: false; message: string }
  | { success: true }

export const NECKLACE_SETTING_SIMPLE_INITIAL: NecklaceSettingSimpleResult = {
  success: false,
  message: '',
}
