import type { Metadata } from 'next';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Staff Sign In — Éclat Grandeur',
  robots: { index: false, follow: false },
};

const ERROR_MESSAGES: Record<string, string> = {
  forbidden: 'Your account does not have access to that area.',
};

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const initialError = searchParams.error
    ? ERROR_MESSAGES[searchParams.error] ?? undefined
    : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-admin-ivory px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="font-sans text-[10px] uppercase tracking-[0.32em] text-admin-gold">
            Éclat Grandeur
          </p>
          <h1 className="mt-3 font-display text-3xl text-admin-forest">Staff Portal</h1>
          <p className="mt-2 font-sans text-sm text-admin-forest/60">
            Sign in with your staff credentials.
          </p>
        </div>

        <div className="border border-admin-forest/10 bg-admin-panel p-8 shadow-sm">
          <LoginForm initialError={initialError} />
        </div>
      </div>
    </main>
  );
}
