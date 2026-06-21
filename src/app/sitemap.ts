import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { getAllProductSlugs, getCollections } from '@/lib/data';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;
  const now = new Date();

  const staticPaths = [
    '',
    '/engagement-rings',
    '/earrings',
    '/necklaces',
    '/bracelets',
    '/wedding-bands',
    '/high-jewellery',
    '/bespoke',
    '/builder',
    '/collections',
    '/diamond-guide',
    '/maison',
    '/appointments',
    '/contact',
  ].map((p) => ({ url: `${base}${p}`, lastModified: now, changeFrequency: 'weekly' as const, priority: p === '' ? 1 : 0.7 }));

  const products = getAllProductSlugs().map((slug) => ({
    url: `${base}/product/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const collections = getCollections().map((c) => ({
    url: `${base}/collections/${c.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticPaths, ...products, ...collections];
}
