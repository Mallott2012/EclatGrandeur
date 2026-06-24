// Shared action result types for bracelet stones admin. Types/constants only.

export type BraceletStoneActionResult =
  | { success: false; message: string; fieldErrors: Record<string, string> }
  | { success: true }

export const BRACELET_STONE_ACTION_INITIAL: BraceletStoneActionResult = {
  success:     false,
  message:     '',
  fieldErrors: {},
}

export type BraceletStoneSimpleResult =
  | { success: false; message: string }
  | { success: true }

export const BRACELET_STONE_SIMPLE_INITIAL: BraceletStoneSimpleResult = {
  success: false,
  message: '',
}
