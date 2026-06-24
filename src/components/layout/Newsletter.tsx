'use client';

import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';

export function Newsletter({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    setDone(true);
  };

  const border = tone === 'dark' ? 'border-ivory/25' : 'border-ink/20';
  const text = tone === 'dark' ? 'text-ivory placeholder:text-ivory/40' : 'text-ink placeholder:text-ink/40';
  const btn = tone === 'dark' ? 'text-ivory hover:text-champagne-soft' : 'text-ink hover:text-champagne-deep';

  if (done) {
    return (
      <p className={`flex items-center gap-2 text-sm font-light ${tone === 'dark' ? 'text-ivory/80' : 'text-ink/70'}`}>
        <Check className="h-4 w-4 text-champagne" /> Thank you — welcome to the Maison.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className={`flex items-center gap-3 border-b ${border} pb-2`}>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        className={`w-full bg-transparent text-sm font-light tracking-wide focus:outline-none ${text}`}
        aria-label="Email address"
      />
      <button type="submit" aria-label="Subscribe" className={btn}>
        <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
      </button>
    </form>
  );
}
