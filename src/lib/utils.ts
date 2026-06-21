import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Currency, Money } from '@/types/common';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CURRENCY_LOCALE: Record<Currency, string> = {
  GBP: 'en-GB',
  USD: 'en-US',
  EUR: 'en-IE',
};

/** Format Money (stored in minor units) into a localised currency string. */
export function formatMoney(money: Money, opts?: { withDecimals?: boolean }): string {
  const withDecimals = opts?.withDecimals ?? false;
  return new Intl.NumberFormat(CURRENCY_LOCALE[money.currency], {
    style: 'currency',
    currency: money.currency,
    minimumFractionDigits: withDecimals ? 2 : 0,
    maximumFractionDigits: withDecimals ? 2 : 0,
  }).format(money.amount / 100);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Brand-palette placeholder image so layouts read as intentional before real assets. */
export function placeholder(
  width: number,
  height: number,
  label?: string
): string {
  const text = label ? `?text=${encodeURIComponent(label)}` : '';
  return `https://placehold.co/${width}x${height}/16130f/c4a35a${text}`;
}

/** A single shimmer blurDataURL used across Next/Image until real assets land. */
export const SHIMMER_BLUR =
  'data:image/svg+xml;base64,' +
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="10"><rect width="8" height="10" fill="#efe8db"/></svg>`
  ).toString('base64');
