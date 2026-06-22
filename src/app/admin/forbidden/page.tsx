import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Access Denied — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-10">
          <span className="font-display text-2xl font-light tracking-[0.25em] text-white">
            ÉCLAT GRANDEUR
          </span>
          <p className="mt-1 text-xs tracking-widest text-neutral-500">STAFF ACCESS</p>
        </div>

        <div className="mb-6 rounded border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          You do not have permission to access this area.
        </div>

        <Link
          href="/admin"
          className="text-xs text-neutral-500 transition-colors hover:text-neutral-300"
        >
          Return to dashboard
        </Link>
      </div>
    </div>
  )
}
