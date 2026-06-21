import type { Diamond, Setting, Metal, Money } from '@/types';
import { BUYABLE_THRESHOLD } from '@/config/site';

/** Metals carry a small craftsmanship premium over the setting base price. */
const METAL_PREMIUM: Record<Metal, number> = {
  platinum: 45000,
  'white-gold': 0,
  'yellow-gold': 0,
  'rose-gold': 5000,
};

/** Is this diamond shape compatible with this setting? */
export function isCompatible(setting: Setting, diamond: Diamond): boolean {
  return setting.shapes.includes(diamond.shape);
}

export interface BuildPrice {
  setting: Money;
  diamond: Money;
  total: Money;
  /** Whether the finished ring can be purchased online or needs an enquiry. */
  buyableOnline: boolean;
}

export function priceBuild(
  setting: Setting,
  diamond: Diamond,
  metal: Metal
): BuildPrice {
  const currency = setting.basePrice.currency;
  const settingTotal = setting.basePrice.amount + (METAL_PREMIUM[metal] ?? 0);
  const total = settingTotal + diamond.price.amount;
  return {
    setting: { amount: settingTotal, currency },
    diamond: diamond.price,
    total: { amount: total, currency },
    buyableOnline: total <= BUYABLE_THRESHOLD,
  };
}
