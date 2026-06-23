'use client';

import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { loginAction } from '@/app/admin/login/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded bg-stone-900 py-3 text-xs font-semibold tracking-widest text-white transition-opacity hover:opacity-80 disabled:opacity-40"
    >
      {pending ? 'SIGNING IN…' : 'SIGN IN'}
    </button>
  );
}

export function AdminLoginForm() {
  const [state, formAction] = useFormState(loginAction, null);

  // When the server action returns a redirectTo, do a hard top-level navigation
  // so the browser sends the newly-set session cookies with the next request.
  // When running inside an iframe (e.g. v0 preview), target the top frame so
  // the cookie is not scoped to the iframe context.
  useEffect(() => {
    if (state?.redirectTo) {
      try {
        const target = window.top && window.top !== window ? window.top : window;
        target.location.href = state.redirectTo;
      } catch {
        window.location.href = state.redirectTo;
      }
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <p className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="space-y-1">
        <label htmlFor="email" className="block text-xs tracking-widest text-stone-500">
          EMAIL
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-500 focus:outline-none disabled:opacity-50"
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="block text-xs tracking-widest text-stone-500">
          PASSWORD
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-500 focus:outline-none disabled:opacity-50"
          placeholder="••••••••"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
