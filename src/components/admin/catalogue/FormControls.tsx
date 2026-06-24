'use client'

// Shared form primitives for the catalogue admin forms (necklaces, bracelets,
// earrings — settings and stones). Matches the dark editorial design system.

export function inputCls(hasError: boolean) {
  return `w-full rounded border ${
    hasError ? 'border-red-700 bg-red-950/20' : 'border-neutral-700 bg-neutral-900'
  } px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-amber-700 focus:outline-none`
}

export function Field({
  label, error, required, children,
}: {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium tracking-wider text-neutral-400">
        {label.toUpperCase()}
        {required && <span className="ml-1 text-amber-600">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}

export function FormError({ show, message }: { show: boolean; message: string }) {
  if (!show || !message) return null
  return (
    <div className="rounded border border-red-800/60 bg-red-950/30 px-4 py-3 text-sm text-red-400">
      {message}
    </div>
  )
}

// A titled grouping of fields, e.g. "THE 4CS".
export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-5 rounded border border-neutral-800 bg-neutral-900/20 p-5">
      <legend className="px-2 text-xs font-semibold tracking-widest text-amber-600/80">{title.toUpperCase()}</legend>
      {children}
    </fieldset>
  )
}
