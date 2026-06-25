'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const G = '#1a2b1a';

export interface ProductCardMedia {
  url:        string;
  type:       'image' | 'video';
  posterUrl?: string;
  alt?:       string;
}

export interface ProductCardProps {
  name:          string;
  price:         string;
  href:          string;
  mainMedia?:    ProductCardMedia | null;
  hoverMedia?:   ProductCardMedia | null;
  hoverEnabled?: boolean;
  priority?:     boolean;
}

export function ProductCard({
  name, price, href,
  mainMedia, hoverMedia, hoverEnabled = true,
  priority = false,
}: ProductCardProps) {
  const videoRef      = useRef<HTMLVideoElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
  const [hovered,     setHovered]     = useState(false);
  const [videoReady,  setVideoReady]  = useState(false); // near viewport
  const [videoFailed, setVideoFailed] = useState(false);

  const hoverIsVideo = hoverMedia?.type === 'video'
    || (hoverMedia?.url && /\.(mp4|mov|webm)(\?|$)/i.test(hoverMedia.url ?? ''));
  const mainIsVideo = mainMedia?.type === 'video'
    || (mainMedia?.url && /\.(mp4|mov|webm)(\?|$)/i.test(mainMedia?.url ?? ''));

  const showHover = hoverEnabled && Boolean(hoverMedia?.url) && !videoFailed;

  // Intersection observer: prime hover video preload once card is near viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !hoverIsVideo || !showHover) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVideoReady(true); io.disconnect(); } },
      { rootMargin: '300px' }
    );
    io.observe(el);
    return () => io.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function enter() {
    setHovered(true);
    if (showHover && hoverIsVideo) {
      const v = videoRef.current;
      if (v) { v.currentTime = 0; v.play().catch(() => {}); }
    }
  }

  function leave() {
    setHovered(false);
    if (hoverIsVideo && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }

  return (
    <Link
      href={href}
      className="group flex flex-col"
      onMouseEnter={enter}
      onMouseLeave={leave}
    >
      {/* ── Fixed square media region ───────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden bg-white"
        style={{ aspectRatio: '1 / 1' }}
      >
        {/* Main media */}
        {mainMedia?.url ? (
          mainIsVideo ? (
            <video
              src={mainMedia.url}
              poster={mainMedia.posterUrl}
              autoPlay muted loop playsInline
              className="absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ease-out"
              style={{ opacity: hovered && showHover ? 0 : 1 }}
            />
          ) : (
            <Image
              src={mainMedia.url}
              alt={mainMedia.alt ?? name}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              priority={priority}
              className="object-contain transition-opacity duration-700 ease-out"
              style={{ opacity: hovered && showHover ? 0 : 1 }}
            />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.3em', color: '#ccc' }}>
              No image
            </p>
          </div>
        )}

        {/* Hover media — desktop only; never rendered on mobile (mouseenter not fired on touch) */}
        {showHover && hoverMedia?.url && (
          hoverIsVideo ? (
            <video
              ref={videoRef}
              src={hoverMedia.url}
              poster={hoverMedia.posterUrl}
              muted loop playsInline
              preload={videoReady ? 'metadata' : 'none'}
              onError={() => setVideoFailed(true)}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-out"
              style={{ opacity: hovered ? 1 : 0 }}
            />
          ) : (
            <Image
              src={hoverMedia.url}
              alt=""
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="absolute inset-0 object-cover transition-opacity duration-700 ease-out"
              style={{ opacity: hovered ? 1 : 0 }}
            />
          )
        )}
      </div>

      {/* ── Name + price ─────────────────────────────────────────────────── */}
      <div style={{ paddingTop: 20 }}>
        <p
          className="font-display"
          style={{ fontSize: 'clamp(15px, 1.3vw, 19px)', fontWeight: 300, letterSpacing: '0.02em', color: G, lineHeight: 1.3 }}
        >
          {name}
        </p>
        <p
          className="font-sans"
          style={{ fontSize: 12, fontWeight: 300, color: '#888', letterSpacing: '0.04em', marginTop: 8 }}
        >
          {price}
        </p>
      </div>
    </Link>
  );
}
