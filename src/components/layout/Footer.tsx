import Link from 'next/link';
import { Instagram, Sparkles } from 'lucide-react';
import { footerNav, siteConfig } from '@/config/site';
import { Newsletter } from './Newsletter';
import { Divider } from '@/components/ui/Divider';

export function Footer() {
  return (
    <footer className="ground-noir text-ivory">
      {/* Newsletter band */}
      <div className="border-b border-ivory/10">
        <div className="container-luxe grid grid-cols-1 items-center gap-8 py-14 md:grid-cols-2">
          <div>
            <span className="eyebrow-light">Stay in the know</span>
            <h3 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
              Sign up & save on your first order
            </h3>
            <p className="mt-3 max-w-md text-sm font-light leading-relaxed text-ivory/60">
              Be first to hear about new arrivals, exclusive offers and expert diamond buying tips.
            </p>
          </div>
          <div className="md:pl-10">
            <Newsletter tone="dark" />
            <p className="mt-3 text-[11px] font-light text-ivory/40">
              By subscribing you agree to our privacy policy. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Link columns */}
      <div className="container-luxe grid grid-cols-2 gap-10 py-16 md:grid-cols-4 lg:grid-cols-5">
        <div className="col-span-2 flex flex-col gap-4 lg:col-span-2">
          <span className="font-display text-3xl">{siteConfig.name}</span>
          <p className="max-w-xs text-sm font-light leading-relaxed text-ivory/55">
            The original online jeweler — certified diamonds and fine jewelry at a better value,
            shipped direct since {siteConfig.founded}.
          </p>
          <div className="mt-2 flex flex-col gap-1 text-sm font-light text-ivory/55">
            <span>{siteConfig.contact.address}</span>
            <a href={`mailto:${siteConfig.contact.email}`} className="link-underline w-fit hover:text-ivory">
              {siteConfig.contact.email}
            </a>
            <span>{siteConfig.contact.phone}</span>
          </div>
          <a
            href={siteConfig.social.instagram}
            className="mt-2 inline-flex w-fit items-center gap-2 text-xs uppercase tracking-luxe text-ivory/60 hover:text-ivory"
          >
            <Instagram className="h-4 w-4" strokeWidth={1.25} /> @bluenile
          </a>
        </div>

        {footerNav.map((col) => (
          <div key={col.title}>
            <h4 className="mb-5 text-[11px] uppercase tracking-wide2 text-champagne-soft">{col.title}</h4>
            <ul className="flex flex-col gap-3">
              {col.links.map((link) => (
                <li key={`${col.title}-${link.label}`}>
                  <Link href={link.href} className="link-underline text-sm font-light text-ivory/65 hover:text-ivory">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Divider tone="light" className="pb-8" />

      {/* Trust strip */}
      <div className="container-luxe flex flex-wrap items-center justify-center gap-x-8 gap-y-2 pb-10 text-[10.5px] uppercase tracking-luxe text-ivory/45">
        <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-champagne" /> Certified Diamonds</span>
        <span>Lifetime Warranty</span>
        <span>Conflict-Free</span>
        <span>Free Shipping</span>
        <span>30-Day Returns</span>
      </div>

      <div className="border-t border-ivory/10">
        <div className="container-luxe flex flex-col items-center justify-between gap-3 py-6 text-[11px] font-light text-ivory/40 md:flex-row">
          <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/contact" className="hover:text-ivory">Privacy</Link>
            <Link href="/contact" className="hover:text-ivory">Terms</Link>
            <Link href="/contact" className="hover:text-ivory">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
