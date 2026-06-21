import articlesData from '@/data/articles.json';
import type { Article } from '@/types/content';

const articles = articlesData as unknown as Article[];

export function getArticles(): Article[] {
  return [...articles].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}
