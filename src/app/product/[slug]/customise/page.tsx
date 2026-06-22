import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllProductSlugs, getProductBySlug } from '@/lib/data'
import { CURATED_ROUND_BRILLIANTS } from '@/data/curated-diamonds'
import { DiamondSelector } from '@/components/selector/DiamondSelector'

export function generateStaticParams() {
  return getAllProductSlugs()
    .filter((slug) => {
      const p = getProductBySlug(slug)
      return p?.category === 'engagement-rings'
    })
    .map((slug) => ({ slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const product = getProductBySlug(params.slug)
  if (!product) return { title: 'Not found' }
  return {
    title: `Select Your Diamond — ${product.name}`,
    description: `Choose the perfect diamond for your ${product.name}. Éclat Grandeur presents a hand-curated selection of exceptional stones.`,
  }
}

export default function CustomisePage({ params }: { params: { slug: string } }) {
  const product = getProductBySlug(params.slug)
  if (!product || product.category !== 'engagement-rings') notFound()

  const diamonds = CURATED_ROUND_BRILLIANTS.filter((d) =>
    d.settingSlugs.includes(params.slug),
  )

  return <DiamondSelector product={product} diamonds={diamonds} />
}
