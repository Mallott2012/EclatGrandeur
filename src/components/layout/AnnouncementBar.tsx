'use client';

import { useEffect, useState } from 'react';

const messages = [
  'Free shipping & free 30-day returns on every order',
  'Every loose diamond independently certified',
  'Build your own engagement ring in three steps',
  'Lifetime warranty · Book a virtual appointment',
];

export function AnnouncementBar() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % messages.length), 4200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative z-[70] bg-noir text-ivory">
      <div className="container-luxe flex h-9 items-center justify-center overflow-hidden">
        <p
          key={i}
          className="animate-fade-up text-center text-[10.5px] font-light uppercase tracking-wide2 text-ivory/80"
        >
          {messages[i]}
        </p>
      </div>
    </div>
  );
}
