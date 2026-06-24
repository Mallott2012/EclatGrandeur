import Link from 'next/link';
import { listRingSettings } from '@/lib/ring-settings/service';
import { listJewelleryProducts } from '@/lib/jewellery/service';
import { listDiamonds } from '@/lib/diamonds/service';
import { listEnquiries } from '@/lib/enquiries/service';
import { listHeroMedia } from '@/lib/hero/service';
import { requireStaffRole } from '@/lib/staff';
import {
  LayoutGrid,
  Gem,
  MessageSquare,
  ImageIcon,
  ChevronRight,
  Circle,
  ShoppingBag,
  Users,
  TrendingUp,
  Mail,
  FileText,
  Layout,
} from 'lucide-react';

const G = '#1a2b1a';

export default async function AdminDashboardPage() {
  await requireStaffRole([]);

  const [rings, allJewellery, diamonds, enquiries, heroMedia] = await Promise.all([
    listRingSettings().catch(() => []),
    listJewelleryProducts().catch(() => []),
    listDiamonds().catch(() => []),
    listEnquiries().catch(() => []),
    listHeroMedia().catch(() => []),
  ]);

  const necklaces  = allJewellery.filter(p => p.category === 'necklaces');
  const bracelets  = allJewellery.filter(p => p.category === 'bracelets');
  const earrings   = allJewellery.filter(p => p.category === 'earrings');
  const newEnquiries = enquiries.filter(e => e.status === 'new');
  const heroPublished = heroMedia.filter(h => h.is_published).length;

  const categories = [
    { label: 'Rings',      href: '/admin/rings',      total: rings.length,      published: rings.filter(r => r.is_published).length },
    { label: 'Necklaces',  href: '/admin/necklaces',  total: necklaces.length,  published: necklaces.filter(p => p.is_published).length },
    { label: 'Bracelets',  href: '/admin/bracelets',  total: bracelets.length,  published: bracelets.filter(p => p.is_published).length },
    { label: 'Earrings',   href: '/admin/earrings',   total: earrings.length,   published: earrings.filter(p => p.is_published).length },
  ];

  const recentEnquiries = enquiries.slice(0, 5);

  return (
    <div className="min-h-screen bg-white" style={{ color: G }}>

      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <div
        className="px-8 lg:px-14 py-10"
        style={{ borderBottom: '1px solid #f0f0f0' }}
      >
        <p
          className="font-sans uppercase mb-2"
          style={{ fontSize: 10, letterSpacing: '0.28em', color: '#bbb' }}
        >
          Overview
        </p>
        <h1
          className="font-display"
          style={{ fontSize: 'clamp(26px, 3vw, 38px)', fontWeight: 300, letterSpacing: '0.06em' }}
        >
          Dashboard
        </h1>
      </div>

      <div className="px-8 lg:px-14 py-10 space-y-14">

        {/* ── STAT CARDS ──────────────────────────────────────────────── */}
        <section>
          <p
            className="font-sans uppercase mb-6"
            style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}
          >
            At a Glance
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Total products */}
            <StatCard
              icon={<LayoutGrid className="w-4 h-4" strokeWidth={1.5} />}
              label="Total Products"
              value={rings.length + allJewellery.length}
              sub={`${rings.filter(r=>r.is_published).length + allJewellery.filter(p=>p.is_published).length} published`}
            />

            {/* Diamonds */}
            <StatCard
              icon={<Gem className="w-4 h-4" strokeWidth={1.5} />}
              label="Diamonds"
              value={diamonds.length}
              sub={`${diamonds.filter(d => d.status === 'available').length} available`}
            />

            {/* Enquiries */}
            <StatCard
              icon={<MessageSquare className="w-4 h-4" strokeWidth={1.5} />}
              label="Enquiries"
              value={enquiries.length}
              sub={newEnquiries.length > 0 ? `${newEnquiries.length} new` : 'all reviewed'}
              highlight={newEnquiries.length > 0}
            />

            {/* Hero media */}
            <StatCard
              icon={<ImageIcon className="w-4 h-4" strokeWidth={1.5} />}
              label="Hero Media"
              value={heroMedia.length}
              sub={`${heroPublished} of 5 live`}
            />

          </div>
        </section>

        {/* ── COLLECTIONS ─────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <p className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}>
              Collections
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {categories.map(cat => (
              <Link
                key={cat.href}
                href={cat.href}
                className="group flex items-center justify-between px-6 py-5 transition-colors hover:bg-stone-50"
                style={{ border: '1px solid #ebebeb' }}
              >
                <div>
                  <p
                    className="font-display"
                    style={{ fontSize: 17, fontWeight: 300, letterSpacing: '0.03em', color: G }}
                  >
                    {cat.label}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="font-sans" style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.04em' }}>
                      {cat.total} {cat.total === 1 ? 'piece' : 'pieces'}
                    </span>
                    <span
                      className="font-sans"
                      style={{ fontSize: 11, letterSpacing: '0.04em', color: cat.published > 0 ? '#5a7a5a' : '#ccc' }}
                    >
                      {cat.published} published
                    </span>
                    {cat.total > cat.published && (
                      <span className="font-sans" style={{ fontSize: 11, color: '#c9a96e', letterSpacing: '0.04em' }}>
                        {cat.total - cat.published} draft
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight
                  className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                  style={{ color: '#ccc' }}
                  strokeWidth={1.5}
                />
              </Link>
            ))}
          </div>
        </section>

        {/* ── COMING SOON SECTIONS ────────────────────────────────────── */}
        <section>
          <p
            className="font-sans uppercase mb-6"
            style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}
          >
            In Development
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: ShoppingBag, label: 'Orders',          href: '/admin/orders',          desc: 'Full order journey from reservation to delivery.' },
              { icon: Users,       label: 'Clients',         href: '/admin/clients',         desc: 'Unified client profiles, history, and preferences.' },
              { icon: TrendingUp,  label: 'Sales',           href: '/admin/sales',           desc: 'Revenue reporting and business analytics.' },
              { icon: Mail,        label: 'Communications',  href: '/admin/communications',  desc: 'Shared inbox and client correspondence log.' },
              { icon: FileText,    label: 'Email Templates', href: '/admin/email-templates', desc: 'Branded templates for every client touchpoint.' },
              { icon: Layout,      label: 'Homepage',        href: '/admin/homepage',        desc: 'Edit all hero panels and homepage sections.' },
            ].map(({ icon: Icon, label, href, desc }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-start gap-4 px-6 py-5 transition-colors hover:bg-stone-50"
                style={{ border: '1px solid #ebebeb' }}
              >
                <div
                  className="flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ width: 32, height: 32, border: '1px solid #eee', color: '#ccc' }}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-sans uppercase" style={{ fontSize: 10, letterSpacing: '0.16em', color: '#aaa' }}>
                      {label}
                    </p>
                    <span
                      className="font-sans uppercase"
                      style={{ fontSize: 7, letterSpacing: '0.2em', color: '#fff', background: '#ccc', padding: '1px 5px' }}
                    >
                      soon
                    </span>
                  </div>
                  <p className="font-sans leading-relaxed" style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.02em' }}>
                    {desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── BOTTOM ROW: Hero media + Recent enquiries ────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* Hero media */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <p className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}>
                Hero Media
              </p>
              <Link
                href="/admin/rings"
                className="font-sans uppercase transition-opacity hover:opacity-60"
                style={{ fontSize: 9, letterSpacing: '0.18em', color: '#aaa' }}
              >
                Edit via collections
              </Link>
            </div>
            <div className="space-y-1">
              {(['homepage', 'engagement-rings', 'necklaces', 'bracelets', 'earrings'] as const).map(placement => {
                const record = heroMedia.find(h => h.placement === placement && h.is_published);
                const any    = heroMedia.find(h => h.placement === placement);
                return (
                  <div
                    key={placement}
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: '1px solid #f5f5f5' }}
                  >
                    <div className="flex items-center gap-3">
                      <Circle
                        className="w-1.5 h-1.5 flex-shrink-0"
                        style={{ fill: record ? '#5a7a5a' : '#e0e0e0', color: record ? '#5a7a5a' : '#e0e0e0' }}
                        strokeWidth={0}
                      />
                      <span
                        className="font-sans capitalize"
                        style={{ fontSize: 12, color: G, letterSpacing: '0.04em' }}
                      >
                        {placement.replace('-', ' ')}
                      </span>
                    </div>
                    <span
                      className="font-sans uppercase"
                      style={{ fontSize: 9, letterSpacing: '0.18em', color: record ? '#5a7a5a' : (any ? '#c9a96e' : '#ccc') }}
                    >
                      {record ? 'Live' : (any ? 'Draft' : 'Not set')}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Recent enquiries */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <p className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}>
                Recent Enquiries
              </p>
              <Link
                href="/admin/enquiries"
                className="font-sans uppercase transition-opacity hover:opacity-60"
                style={{ fontSize: 9, letterSpacing: '0.18em', color: '#aaa' }}
              >
                View all
              </Link>
            </div>
            {recentEnquiries.length === 0 ? (
              <p className="font-sans" style={{ fontSize: 12, color: '#ccc', letterSpacing: '0.04em' }}>
                No enquiries yet.
              </p>
            ) : (
              <div className="space-y-1">
                {recentEnquiries.map(enq => (
                  <Link
                    key={enq.id}
                    href={`/admin/enquiries/${enq.id}`}
                    className="group flex items-center justify-between px-4 py-3 transition-colors hover:bg-stone-50"
                    style={{ borderBottom: '1px solid #f5f5f5' }}
                  >
                    <div>
                      <p className="font-sans" style={{ fontSize: 12, color: G, letterSpacing: '0.02em' }}>
                        {enq.customer_name}
                      </p>
                      <p className="font-sans mt-0.5" style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.02em' }}>
                        {enq.customer_email}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={enq.status} />
                      <ChevronRight
                        className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                        style={{ color: '#ddd' }}
                        strokeWidth={1.5}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function StatCard({
  icon,
  label,
  value,
  sub,
  highlight = false,
}: {
  icon:      React.ReactNode;
  label:     string;
  value:     number;
  sub:       string;
  highlight?: boolean;
}) {
  return (
    <div
      className="px-6 py-6"
      style={{ border: '1px solid #ebebeb', background: '#fff' }}
    >
      <div
        className="flex items-center gap-2 mb-4"
        style={{ color: '#bbb' }}
      >
        {icon}
        <span className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.24em', color: '#bbb' }}>
          {label}
        </span>
      </div>
      <p
        className="font-display"
        style={{ fontSize: 36, fontWeight: 300, letterSpacing: '0.02em', color: G, lineHeight: 1 }}
      >
        {value}
      </p>
      <p
        className="font-sans mt-2"
        style={{ fontSize: 11, letterSpacing: '0.04em', color: highlight ? '#c9a96e' : '#bbb' }}
      >
        {sub}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { color: string; label: string }> = {
    new:       { color: '#c9a96e', label: 'New'       },
    contacted: { color: '#5a7a9a', label: 'Contacted' },
    closed:    { color: '#aaa',    label: 'Closed'    },
  };
  const s = styles[status] ?? styles.closed;
  return (
    <span
      className="font-sans uppercase"
      style={{ fontSize: 9, letterSpacing: '0.18em', color: s.color }}
    >
      {s.label}
    </span>
  );
}
