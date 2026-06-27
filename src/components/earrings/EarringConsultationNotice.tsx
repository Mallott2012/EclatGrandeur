import Link from 'next/link';
import { ProductGallery } from '@/components/shared/ProductGallery';
import type { GalleryData } from '@/lib/gallery/types';

/**
 * Premium "available following a private consultation" state for an earring
 * setting that has no live, purchasable matched-pair inventory configured yet.
 *
 * Pure server component. Never mounts DiamondSelector or EarringPairSelector,
 * never calls /api/diamonds, shows no Choose-Your-Diamonds button and no empty
 * configuration controls. Exposes no internal data.
 */

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

export function EarringConsultationNotice({
  productName,
  productSubtitle,
  productDescription,
  gallery,
  categoryLabel = 'Earrings',
  categoryPath = '/earrings',
}: {
  productName:         string;
  productSubtitle?:    string;
  productDescription?: string;
  gallery?:            GalleryData | null;
  categoryLabel?:      string;
  categoryPath?:       string;
}) {
  return (
    <div className="min-h-screen bg-white pb-10 lg:pb-20" style={{ color: G }}>
      <nav className="flex items-center gap-2 px-8 lg:px-14 pt-24 pb-5" style={{ borderBottom: `1px solid ${BORDER}` }} aria-label="Breadcrumb">
        <Link href="/" className="font-sans" style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Home</Link>
        <span style={{ color: '#ddd' }}>·</span>
        <Link href={categoryPath} className="font-sans" style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{categoryLabel}</Link>
        <span style={{ color: '#ddd' }}>·</span>
        <span className="font-sans" style={{ fontSize: 11, color: G, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{productName}</span>
      </nav>

      <div className="flex flex-col lg:flex-row">
        <div className="lg:w-[58%] lg:sticky lg:top-[80px]" style={{ maxHeight: 'calc(100vh - 80px)', overflowY: 'auto', padding: 8, background: '#fff' }}>
          {gallery ? <ProductGallery data={gallery} /> : <div className="aspect-square bg-ivory-deep" />}
        </div>

        <div className="lg:w-[42%] px-8 lg:px-12 pt-12 pb-20 flex flex-col">
          <h1 className="font-display" style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 300, letterSpacing: '0.04em', color: G, lineHeight: 1.15 }}>{productName}</h1>
          {productSubtitle && <p className="font-sans mt-2" style={{ fontSize: 13, color: '#999', fontWeight: 300, letterSpacing: '0.03em' }}>{productSubtitle}</p>}

          <div className="mt-8" style={{ height: 1, backgroundColor: BORDER }} />

          <div className="mt-8">
            <p className="font-sans uppercase" style={{ fontSize: 10, letterSpacing: '0.28em', color: '#b08d57' }}>By Private Appointment</p>
            <p className="font-display mt-3" style={{ fontSize: 20, fontWeight: 300, letterSpacing: '0.02em', color: G, lineHeight: 1.4 }}>
              Available following a private consultation
            </p>
            <p className="font-sans mt-4" style={{ fontSize: 13, color: '#666', lineHeight: 1.85, fontWeight: 300 }}>
              This design is composed from a matched set of diamonds selected to your preference. Our
              diamond specialists will guide you through the curated pairs currently available and
              reserve the perfect match on your behalf.
            </p>
          </div>

          <Link href="/contact" className="font-sans uppercase mt-8 py-4 text-center" style={{ fontSize: 11, letterSpacing: '0.28em', backgroundColor: G, color: '#fff' }}>
            Arrange a Consultation
          </Link>
          <Link href={categoryPath} className="font-sans uppercase mt-3 py-3 text-center transition-opacity hover:opacity-70" style={{ fontSize: 10, letterSpacing: '0.22em', color: G, border: `1px solid ${BORDER}` }}>
            Explore {categoryLabel}
          </Link>

          {productDescription && (
            <>
              <div className="mt-10 mb-8" style={{ height: 1, backgroundColor: BORDER }} />
              <p className="font-sans" style={{ fontSize: 13, color: '#666', lineHeight: 1.85, fontWeight: 300, letterSpacing: '0.02em' }}>{productDescription}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
