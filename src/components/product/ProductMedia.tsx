'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Box, ImageIcon } from 'lucide-react';
import { JewelViewer } from './JewelViewer';
import type { Product } from '@/types/product';
import type { Metal } from '@/types/common';
import { cn, SHIMMER_BLUR } from '@/lib/utils';

export function ProductMedia({
  product,
  metal,
}: {
  product: Product;
  metal: Metal;
}) {
  const [mode, setMode] = useState<'3d' | 'photo'>('3d');
  const [activeImage, setActiveImage] = useState(0);
  const primary = product.images.find((i) => i.isPrimary) ?? product.images[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        {mode === '3d' ? (
          <JewelViewer model={product.model3d} fallbackImage={primary} metal={metal} />
        ) : (
          <div className="relative aspect-square w-full overflow-hidden bg-ivory-deep">
            <Image
              src={product.images[activeImage].src}
              alt={product.images[activeImage].alt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              placeholder="blur"
              blurDataURL={SHIMMER_BLUR}
              className="object-cover"
            />
          </div>
        )}

        {/* Mode toggle */}
        <div className="absolute right-4 top-4 flex gap-2">
          <button
            aria-label="3D view"
            onClick={() => setMode('3d')}
            className={cn(
              'flex h-9 w-9 items-center justify-center border transition',
              mode === '3d'
                ? 'border-ink bg-ink text-ivory'
                : 'border-ink/20 bg-ivory/80 text-ink hover:border-ink'
            )}
          >
            <Box className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            aria-label="Photo view"
            onClick={() => setMode('photo')}
            className={cn(
              'flex h-9 w-9 items-center justify-center border transition',
              mode === 'photo'
                ? 'border-ink bg-ink text-ivory'
                : 'border-ink/20 bg-ivory/80 text-ink hover:border-ink'
            )}
          >
            <ImageIcon className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Thumbnails */}
      {product.images.length > 1 && (
        <div className="flex gap-3">
          {product.images.map((img, i) => (
            <button
              key={img.src}
              onClick={() => {
                setMode('photo');
                setActiveImage(i);
              }}
              className={cn(
                'relative aspect-square w-20 overflow-hidden border transition',
                mode === 'photo' && activeImage === i
                  ? 'border-ink'
                  : 'border-transparent hover:border-ink/30'
              )}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
