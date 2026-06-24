import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

const G      = '#1a2b1a';
const BORDER = '#ebebeb';

interface FeatureItem {
  label:       string;
  description: string;
}

interface Props {
  icon:        LucideIcon;
  section:     string;
  title:       string;
  description: string;
  features:    FeatureItem[];
  backHref?:   string;
  backLabel?:  string;
}

export function AdminPlaceholder({
  icon: Icon,
  section,
  title,
  description,
  features,
  backHref  = '/admin',
  backLabel = 'Dashboard',
}: Props) {
  return (
    <div className="min-h-screen bg-white" style={{ color: G }}>

      {/* Page header */}
      <div className="px-8 lg:px-14 py-10" style={{ borderBottom: `1px solid #f0f0f0` }}>
        <Link
          href={backHref}
          className="font-sans uppercase transition-opacity hover:opacity-60 mb-6 inline-block"
          style={{ fontSize: 9, letterSpacing: '0.22em', color: '#bbb' }}
        >
          ← {backLabel}
        </Link>
        <div className="flex items-start gap-4">
          <div
            className="flex items-center justify-center flex-shrink-0 mt-1"
            style={{ width: 40, height: 40, border: `1px solid ${BORDER}`, color: '#ccc' }}
          >
            <Icon className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <div>
            <p
              className="font-sans uppercase mb-1"
              style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}
            >
              {section}
            </p>
            <h1
              className="font-display"
              style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 300, letterSpacing: '0.06em' }}
            >
              {title}
            </h1>
          </div>
        </div>
      </div>

      <div className="px-8 lg:px-14 py-14">

        {/* Coming soon banner */}
        <div
          className="flex items-start gap-5 px-8 py-7 mb-14"
          style={{ border: `1px solid ${BORDER}`, background: '#fafafa' }}
        >
          <div
            className="font-sans uppercase flex-shrink-0 px-2.5 py-1 mt-0.5"
            style={{ fontSize: 8, letterSpacing: '0.3em', background: G, color: '#fff' }}
          >
            Coming soon
          </div>
          <p
            className="font-sans leading-relaxed"
            style={{ fontSize: 13, color: '#888', letterSpacing: '0.02em' }}
          >
            {description}
          </p>
        </div>

        {/* Feature list */}
        <div>
          <p
            className="font-sans uppercase mb-8"
            style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}
          >
            Planned Features
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div
                key={i}
                className="px-6 py-5"
                style={{ border: `1px solid ${BORDER}` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: '#ddd' }}
                  />
                  <p
                    className="font-sans uppercase"
                    style={{ fontSize: 9, letterSpacing: '0.2em', color: '#aaa' }}
                  >
                    {f.label}
                  </p>
                </div>
                <p
                  className="font-sans leading-relaxed"
                  style={{ fontSize: 12, color: '#999', letterSpacing: '0.02em' }}
                >
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
