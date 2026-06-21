import type { Metadata } from 'next';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';

export const metadata: Metadata = {
  title: 'Staff Login',
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ error?: string }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  no_staff_role: 'Your account does not have staff access. Contact a super admin.',
  insufficient_role: 'You do not have permission to access that page.',
};

export default async function AdminLoginPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? 'Access denied.') : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="mb-10 text-center">
          <span className="font-display text-2xl font-light tracking-[0.25em] text-white">
            ÉCLAT GRANDEUR
          </span>
          <p className="mt-1 text-xs tracking-widest text-neutral-500">STAFF ACCESS</p>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        <AdminLoginForm />
      </div>
    </div>
  );
}
