'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'Login failed. Please try again.');
        return;
      }

      // Cookies are now set on the browser by the Route Handler response.
      // A full page navigation (not client-side push) ensures middleware sees them.
      window.location.href = '/admin';
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="rounded border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="space-y-1">
        <label htmlFor="email" className="block text-xs tracking-widest text-neutral-400">
          EMAIL
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
          className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-neutral-400 focus:outline-none disabled:opacity-50"
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="block text-xs tracking-widest text-neutral-400">
          PASSWORD
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
          className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-neutral-400 focus:outline-none disabled:opacity-50"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-white py-3 text-xs font-semibold tracking-widest text-neutral-950 transition-opacity hover:opacity-80 disabled:opacity-40"
      >
        {pending ? 'SIGNING IN…' : 'SIGN IN'}
      </button>
    </form>
  );
}
