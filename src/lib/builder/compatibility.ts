import type { Diamond, RingSetting } from '@/types/diamond';

/** Whether a diamond can be mounted in a given setting (shape + carat range). */
export function isDiamondCompatible(
  setting: RingSetting,
  diamond: Diamond
): boolean {
  if (!setting.compatibleShapes.includes(diamond.shape)) return false;
  if (diamond.carat < setting.caratRange.min) return false;
  if (diamond.carat > setting.caratRange.max) return false;
  return true;
}

/** Filter a list of diamonds to those compatible with the chosen setting. */
export function compatibleDiamonds(
  setting: RingSetting,
  diamonds: Diamond[]
): Diamond[] {
  return diamonds.filter((d) => isDiamondCompatible(setting, d));
}
