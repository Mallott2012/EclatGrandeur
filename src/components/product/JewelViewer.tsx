'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import type { Metal, Model3D, ImageAsset } from '@/types/common';
import { SHIMMER_BLUR } from '@/lib/utils';

const Scene = dynamic(() => import('./jewel-viewer/Scene'), {
  ssr: false,
  loading: () => <ViewerLoading />,
});

function ViewerLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-ivory-deep">
      <Loader2 className="h-6 w-6 animate-spin text-champagne" strokeWidth={1.5} />
    </div>
  );
}

interface JewelViewerProps {
  model?: Model3D;
  /** Fallback gallery image when 3D is unavailable. */
  fallbackImage: ImageAsset;
  metal?: Metal;
  className?: string;
}

/**
 * The single real-time 3D engine used across the site (PDP + configurator).
 * - Lazy-mounts when scrolled into view (keeps it off the LCP path).
 * - Renders a procedural diamond when no .glb asset exists yet.
 * - Falls back to the static image when WebGL is unavailable.
 */
export function JewelViewer({
  model,
  fallbackImage,
  metal = 'platinum',
  className = '',
}: JewelViewerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      setWebgl(
        !!(
          window.WebGLRenderingContext &&
          (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
        )
      );
    } catch {
      setWebgl(false);
    }
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const modelSrc = model?.src && model.src.length > 0 ? model.src : undefined;

  return (
    <div
      ref={ref}
      className={`relative aspect-square w-full overflow-hidden bg-ivory-deep ${className}`}
    >
      {webgl && inView ? (
        <>
          <Scene modelSrc={modelSrc} metal={metal} />
          <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-luxe text-ink/40">
            Drag to rotate · scroll to zoom
          </span>
        </>
      ) : (
        <Image
          src={fallbackImage.src}
          alt={fallbackImage.alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          placeholder="blur"
          blurDataURL={SHIMMER_BLUR}
          className="object-cover"
        />
      )}
    </div>
  );
}
