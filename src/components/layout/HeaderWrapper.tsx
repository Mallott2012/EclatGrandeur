'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';

// Pages that need a white/light header instead of the default ivory
const WHITE_HEADER_PATHS = ['/', '/engagement-rings', '/build-a-ring'];

export function HeaderWrapper() {
  const pathname = usePathname();
  const isWhite = WHITE_HEADER_PATHS.some(p => pathname.startsWith(p));
  return <Header theme={isWhite ? 'white' : 'ivory'} />;
}
