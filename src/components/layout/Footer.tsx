import Link from 'next/link';
import { footerNav, siteConfig } from '@/config/site';

export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-ink text-ivory">
      <div className="container-luxe grid grid-cols-1 gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-4">
          <span className="font-display text-2xl">{siteConfig.name}</span>
          <p className="max-w-xs text-sm font-light leading-relaxed text-ivory/60">
            {siteConfig.tagline}. Rare diamonds and master-crafted fine jewellery,
            created in our London atelier.
          </p>
        </div>

        {footerNav.map((col) => (
          <div key={col.title}>
            <h3 className="mb-5 text-xs uppercase tracking-luxe text-champagne-soft">
              {col.title}
            </h3>
            <ul className="flex flex-col gap-3">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="link-underline text-sm font-light text-ivory/70 hover:text-ivory"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-ivory/10">
        <div className="container-luxe flex flex-col items-center justify-between gap-4 py-6 text-xs font-light text-ivory/50 md:flex-row">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-ivory">
              {siteConfig.contact.email}
            </a>
            <span>{siteConfig.contact.phone}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
