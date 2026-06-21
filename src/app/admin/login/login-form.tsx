'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { signIn, type LoginState } from './actions';

const initialState: LoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 w-full bg-admin-forest px-6 py-3.5 font-sans text-[11px] uppercase tracking-[0.2em] text-admin-ivory transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  );
}

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, formAction] = useFormState(signIn, {
    ...initialState,
    error: initialError,
  });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-admin-forest/70">
          Email
        </span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          className="border border-admin-forest/15 bg-white px-4 py-3 font-sans text-sm text-admin-forest outline-none focus:border-admin-gold"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-admin-forest/70">
          Password
        </span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          className="border border-admin-forest/15 bg-white px-4 py-3 font-sans text-sm text-admin-forest outline-none focus:border-admin-gold"
        />
      </label>

      {state.error ? (
        <p role="alert" className="font-sans text-xs text-red-700">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
