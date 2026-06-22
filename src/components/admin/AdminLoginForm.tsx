'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { loginAction, type LoginState } from '@/app/admin/login/actions';

const initialState: LoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded bg-white py-3 text-xs font-semibold tracking-widest text-neutral-950 transition-opacity hover:opacity-80 disabled:opacity-40"
    >
      {pending ? 'SIGNING IN…' : 'SIGN IN'}
    </button>
  );
}

export function AdminLoginForm() {
  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <p className="rounded border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {state.error}
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
          className="w-full rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-neutral-400 focus:outline-none disabled:opacity-50"
          placeholder="••••••••"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
