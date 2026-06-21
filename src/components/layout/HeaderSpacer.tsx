'use client';

import { usePathname } from 'next/navigation';

/** Offsets the fixed header on every page except the home hero (which sits beneath it). */
export function HeaderSpacer() {
  const pathname = usePathname();
  if (pathname === '/') return null;
  return <div className="h-[96px] lg:h-[150px]" aria-hidden />;
}
