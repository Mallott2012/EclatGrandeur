'use client';

import { useRef, useState, useCallback } from 'react';
import { RotateCw, ZoomIn, Move3d } from 'lucide-react';
import { JewelArt } from '@/components/art/JewelArt';
import { METAL_LABELS, METAL_SWATCH, type JewelArt as Art, type Metal } from '@/types';
import { cn } from '@/lib/utils';

export function DiamondViewer({
  art,
  metals,
  gid,
}: {
  art: Art;
  metals: Metal[];
  gid: string;
}) {
  const [metal, setMetal] = useState<Metal>(art.metal);
  const [rock, setRock] = useState(true);
  const [zoom, setZoom] = useState(false);
  const [drag, setDrag] = useState<{ ry: number; rx: number } | null>(null);
  const dragging = useRef(false);
  const start = useRef({ x: 0, y: 0, ry: 0, rx: 0 });

  const onDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true;
      setRock(false);
      start.current = { x: e.clientX, y: e.clientY, ry: drag?.ry ?? 0, rx: drag?.rx ?? 0 };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [drag]
  );
  const onMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    setDrag({
      ry: Math.max(-26, Math.min(26, start.current.ry + dx * 0.32)),
      rx: Math.max(-14, Math.min(14, start.current.rx - dy * 0.22)),
    });
  }, []);
  const onUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const transform = drag
    ? `rotateY(${drag.ry}deg) rotateX(${drag.rx}deg) scale(${zoom ? 1.5 : 1})`
    : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div
        className="group relative aspect-[4/5] w-full select-none overflow-hidden bg-ivory-deep"
        style={{ perspective: '1400px' }}
      >
        <div
          className={cn('h-full w-full touch-none transition-transform duration-300 ease-luxe', rock && 'animate-float', zoom ? 'cursor-zoom-out' : 'cursor-grab active:cursor-grabbing')}
          style={{ transform, transformStyle: 'preserve-3d' }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
        >
          <JewelArt art={{ ...art, metal }} gid={`${gid}-view-${metal}`} tone="ivory" className="h-full w-full" priority />
        </div>

        {/* 360 hint */}
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-noir/70 px-4 py-1.5 text-[10px] uppercase tracking-luxe text-ivory/90 opacity-100 transition-opacity duration-500 group-hover:opacity-0">
          <span className="inline-flex items-center gap-1.5"><Move3d className="h-3 w-3" /> Drag to view</span>
        </div>

        {/* tools */}
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <ToolButton label="Auto rotate" active={rock} onClick={() => { setRock((r) => !r); setDrag(null); }}>
            <RotateCw className="h-4 w-4" />
          </ToolButton>
          <ToolButton label="Zoom" active={zoom} onClick={() => setZoom((z) => !z)}>
            <ZoomIn className="h-4 w-4" />
          </ToolButton>
        </div>
      </div>

      {/* metal selector */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-luxe text-ink/50">Metal — {METAL_LABELS[metal]}</span>
        <div className="flex items-center gap-2.5">
          {metals.map((m) => {
            const s = METAL_SWATCH[m];
            return (
              <button
                key={m}
                aria-label={METAL_LABELS[m]}
                title={METAL_LABELS[m]}
                onClick={() => setMetal(m)}
                className={cn(
                  'h-7 w-7 rounded-full border transition',
                  metal === m ? 'border-noir ring-1 ring-noir ring-offset-2 ring-offset-ivory' : 'border-ink/20 hover:border-ink'
                )}
                style={{ background: `linear-gradient(135deg, ${s.light}, ${s.base} 55%, ${s.deep})` }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ToolButton({
  children,
  label,
  active,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur transition',
        active ? 'border-noir bg-noir text-ivory' : 'border-ink/15 bg-ivory/80 text-ink hover:border-ink'
      )}
    >
      {children}
    </button>
  );
}
