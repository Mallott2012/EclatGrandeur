import type { Money, Metal } from '@/types/common';
import type { Diamond, RingSetting } from '@/types/diamond';

/**
 * Compute the total price of a built ring.
 * total = setting base price + metal delta + diamond price.
 * Pure and unit-tested — the heart of the configurator.
 */
export function computeRingPrice(
  setting: RingSetting,
  diamond: Diamond,
  metal: Metal
): Money {
  if (setting.basePrice.currency !== diamond.price.currency) {
    throw new Error(
      `Currency mismatch: setting ${setting.basePrice.currency} vs diamond ${diamond.price.currency}`
    );
  }
  const metalDelta = setting.metalPriceDelta?.[metal] ?? 0;
  return {
    amount: setting.basePrice.amount + metalDelta + diamond.price.amount,
    currency: setting.basePrice.currency,
  };
}
