import diamondsData from '@/data/diamonds.json';
import settingsData from '@/data/settings.json';
import type { Diamond, RingSetting } from '@/types/diamond';

const diamonds = diamondsData as unknown as Diamond[];
const settings = settingsData as unknown as RingSetting[];

export function getDiamonds(): Diamond[] {
  return diamonds.filter((d) => d.available);
}

export function getDiamondBySku(sku: string): Diamond | undefined {
  return diamonds.find((d) => d.sku === sku);
}

export function getSettings(): RingSetting[] {
  return settings;
}

export function getSettingBySlug(slug: string): RingSetting | undefined {
  return settings.find((s) => s.slug === slug);
}
