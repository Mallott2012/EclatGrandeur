// Shared action result types for earring stones admin. Types/constants only.

export type EarringStoneActionResult =
  | { success: false; message: string; fieldErrors: Record<string, string> }
  | { success: true }

export const EARRING_STONE_ACTION_INITIAL: EarringStoneActionResult = {
  success:     false,
  message:     '',
  fieldErrors: {},
}

export type EarringStoneSimpleResult =
  | { success: false; message: string }
  | { success: true }

export const EARRING_STONE_SIMPLE_INITIAL: EarringStoneSimpleResult = {
  success: false,
  message: '',
}
