export type JewelleryActionResult =
  | { success: false; message: string; fieldErrors: Record<string, string> }
  | { success: true }

export const JEWELLERY_ACTION_INITIAL: JewelleryActionResult = {
  success:     false,
  message:     '',
  fieldErrors: {},
}
