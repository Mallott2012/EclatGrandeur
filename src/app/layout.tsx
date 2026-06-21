import type { Metadata } from 'next';
import { Cormorant_Garamond, Jost } from 'next/font/google';
import './globals.css';
import { siteConfig } from '@/config/site';
import { Header } from '@/components/layout/Header';
import { HeaderSpacer } from '@/components/layout/HeaderSpacer';
import { Footer } from '@/components/layout/Footer';
import { LiveChat } from '@/components/layout/LiveChat';
import { CartDrawer } from '@/components/cart/CartDrawer';

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    'diamond engagement rings',
    'fine jewellery',
    'bespoke diamonds',
    'diamond earrings',
    'diamond necklaces',
    'tennis bracelets',
    'London jeweller',
  ],
  openGraph: {
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    type: 'website',
    siteName: siteConfig.name,
    locale: 'en_GB',
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="flex min-h-screen flex-col">
        <Header />
        <HeaderSpacer />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
        <LiveChat />
      </body>
    </html>
  );
}
