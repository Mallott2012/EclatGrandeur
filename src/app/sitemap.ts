import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { getAllProductSlugs } from '@/lib/data/products';
import { getCollections } from '@/lib/data/collections';
import { getArticles } from '@/lib/data/education';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;

  const staticRoutes = [
    '',
    '/engagement-rings',
    '/engagement-rings/builder',
    '/jewellery/necklaces',
    '/jewellery/bracelets',
    '/jewellery/earrings',
    '/jewellery/wedding-bands',
    '/jewellery/high-jewellery',
    '/collections',
    '/education',
    '/appointments',
    '/enquiry',
    '/about',
    '/ethical-sourcing',
    '/contact',
  ].map((path) => ({ url: `${base}${path}`, lastModified: new Date() }));

  const products = getAllProductSlugs().map(({ category, slug }) => ({
    url: `${base}/jewellery/${category}/${slug}`,
    lastModified: new Date(),
  }));

  const collections = getCollections().map((c) => ({
    url: `${base}/collections/${c.slug}`,
    lastModified: new Date(),
  }));

  const articles = getArticles().map((a) => ({
    url: `${base}/education/${a.slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...products, ...collections, ...articles];
}
