interface StatusCardProps {
  title: string;
  status: string;
  detail: string;
  ok?: boolean;
}

export function StatusCard({ title, status, detail, ok = true }: StatusCardProps) {
  return (
    <div className="border border-admin-forest/10 bg-admin-panel p-6">
      <div className="flex items-center justify-between">
        <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-admin-forest/50">
          {title}
        </p>
        <span
          className={[
            'inline-block h-2 w-2 rounded-full',
            ok ? 'bg-admin-gold' : 'bg-red-500',
          ].join(' ')}
          aria-hidden
        />
      </div>
      <p className="mt-3 font-display text-2xl text-admin-forest">{status}</p>
      <p className="mt-1 font-sans text-xs text-admin-forest/60">{detail}</p>
    </div>
  );
}
