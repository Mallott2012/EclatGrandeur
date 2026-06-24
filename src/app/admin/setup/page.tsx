'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'Setup failed.');
        return;
      }

      setDone(true);
      setTimeout(() => router.push('/admin/login'), 2500);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm space-y-8">

        {/* Wordmark */}
        <div className="text-center">
          <p
            className="font-display italic text-white"
            style={{ fontSize: 28, fontWeight: 300, letterSpacing: '0.04em' }}
          >
            Éclat Grandeur
          </p>
          <p className="mt-2 font-sans text-xs tracking-widest text-neutral-500">
            FIRST-TIME SETUP
          </p>
        </div>

        {done ? (
          <div className="rounded border border-emerald-800 bg-emerald-950/40 px-6 py-5 text-center">
            <p className="text-sm text-emerald-300">
              Super admin created. Redirecting to login…
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <p className="text-center text-xs leading-relaxed text-neutral-500">
              Create the first super admin account. This page disables itself
              once an admin exists.
            </p>

            {error && (
              <p className="rounded border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            )}

            <div className="space-y-1">
              <label className="block text-xs tracking-widest text-neutral-400">
                EMAIL
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={pending}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-neutral-400 focus:outline-none disabled:opacity-50"
                placeholder="admin@example.com"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs tracking-widest text-neutral-400">
                PASSWORD
              </label>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={pending}
                className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-neutral-400 focus:outline-none disabled:opacity-50"
                placeholder="Min. 8 characters"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded bg-white py-3 text-xs font-semibold tracking-widest text-neutral-950 transition-opacity hover:opacity-80 disabled:opacity-40"
            >
              {pending ? 'CREATING…' : 'CREATE SUPER ADMIN'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
