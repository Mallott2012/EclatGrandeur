import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Currency, Money } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CURRENCY_LOCALE: Record<Currency, string> = {
  GBP: 'en-GB',
  USD: 'en-US',
  EUR: 'en-IE',
};

/** Format Money (minor units) into a localised currency string. */
export function formatMoney(money: Money, opts?: { withDecimals?: boolean }): string {
  const withDecimals = opts?.withDecimals ?? false;
  return new Intl.NumberFormat(CURRENCY_LOCALE[money.currency], {
    style: 'currency',
    currency: money.currency,
    minimumFractionDigits: withDecimals ? 2 : 0,
    maximumFractionDigits: withDecimals ? 2 : 0,
  }).format(money.amount / 100);
}

/** Render a product price line ("From £11,000", "£2,950", "Price on request"). */
export function priceLabel(p: {
  price?: Money;
  priceDisplay: 'exact' | 'from' | 'on-request';
}): string {
  if (p.priceDisplay === 'on-request' || !p.price) return 'Price on request';
  const prefix = p.priceDisplay === 'from' ? 'From ' : '';
  return `${prefix}${formatMoney(p.price)}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new Error('Currency mismatch');
  return { amount: a.amount + b.amount, currency: a.currency };
}
