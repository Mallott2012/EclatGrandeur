import type { Metadata } from 'next';
import { Montserrat, Lato } from 'next/font/google';
import './globals.css';
import { siteConfig } from '@/config/site';
import { Header } from '@/components/layout/Header';
import { HeaderSpacer } from '@/components/layout/HeaderSpacer';
import { Footer } from '@/components/layout/Footer';
import { LiveChat } from '@/components/layout/LiveChat';
import { CartDrawer } from '@/components/cart/CartDrawer';

const display = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
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
    'build your own ring',
    'loose diamonds',
    'diamond search',
    'wedding rings',
    'diamond earrings',
    'fine jewelry',
  ],
  openGraph: {
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    type: 'website',
    siteName: siteConfig.name,
    locale: 'en_US',
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
