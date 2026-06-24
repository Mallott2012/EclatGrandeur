// Shared action result types for necklace stones admin. Types/constants only.

export type NecklaceStoneActionResult =
  | { success: false; message: string; fieldErrors: Record<string, string> }
  | { success: true }

export const NECKLACE_STONE_ACTION_INITIAL: NecklaceStoneActionResult = {
  success:     false,
  message:     '',
  fieldErrors: {},
}

export type NecklaceStoneSimpleResult =
  | { success: false; message: string }
  | { success: true }

export const NECKLACE_STONE_SIMPLE_INITIAL: NecklaceStoneSimpleResult = {
  success: false,
  message: '',
}
