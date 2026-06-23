'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';

// Pages that need a white/light header instead of the default ivory
const WHITE_HEADER_PATHS = ['/', '/engagement-rings', '/build-a-ring', '/necklaces', '/bracelets', '/earrings'];

export function HeaderWrapper() {
  const pathname = usePathname();
  // Admin pages have their own nav bar — suppress the storefront header entirely
  if (pathname.startsWith('/admin')) return null;
  const isWhite = WHITE_HEADER_PATHS.some(p => pathname.startsWith(p));
  return <Header theme={isWhite ? 'white' : 'ivory'} />;
}
