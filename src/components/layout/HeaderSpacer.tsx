'use client';

import { usePathname } from 'next/navigation';

/**
 * Reserves space for the fixed header on every page except the home page,
 * where the video windows sit full-bleed beneath the transparent header.
 */
export function HeaderSpacer() {
  const pathname = usePathname();
  if (pathname === '/') return null;
  return <div className="h-[72px]" aria-hidden />;
}
