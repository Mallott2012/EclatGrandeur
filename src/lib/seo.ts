import type { Product } from '@/types/product';
import type { Article } from '@/types/content';
import { siteConfig } from '@/config/site';

export function productJsonLd(product: Product) {
  const image = product.images.find((i) => i.isPrimary) ?? product.images[0];
  const offers = product.purchase.price
    ? {
        '@type': 'Offer',
        priceCurrency: product.purchase.price.currency,
        price: (product.purchase.price.amount / 100).toFixed(2),
        availability:
          product.purchase.mode === 'buyable'
            ? 'https://schema.org/InStock'
            : 'https://schema.org/PreOrder',
      }
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: image?.src,
    brand: { '@type': 'Brand', name: siteConfig.name },
    ...(offers ? { offers } : {}),
  };
}

export function articleJsonLd(article: Article) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: article.heroImage.src,
    datePublished: article.publishedAt,
    author: { '@type': 'Organization', name: siteConfig.name },
  };
}
