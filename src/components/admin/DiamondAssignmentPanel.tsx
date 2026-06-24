'use client'

import { useTransition } from 'react'

export interface DiamondSummary {
  id:        string
  sku:       string
  cut:       string
  carat:     string
  colour:    string
  clarity:   string
  price_gbp: string
}

interface Props {
  diamonds:         DiamondSummary[]
  assignedIds:      string[]
  onAssign:         (diamondId: string) => Promise<void>
  onUnassign:       (diamondId: string) => Promise<void>
}

export function DiamondAssignmentPanel({
  diamonds,
  assignedIds,
  onAssign,
  onUnassign,
}: Props) {
  const [pending, startTransition] = useTransition()
  const assignedSet = new Set(assignedIds)

  function toggle(diamondId: string, currentlyAssigned: boolean) {
    startTransition(async () => {
      if (currentlyAssigned) {
        await onUnassign(diamondId)
      } else {
        await onAssign(diamondId)
      }
    })
  }

  if (diamonds.length === 0) {
    return (
      <p className="text-sm text-stone-400">
        No diamonds in inventory yet. Add diamonds first.
      </p>
    )
  }

  return (
    <div className={pending ? 'opacity-60 pointer-events-none' : ''}>
      <div className="mb-3 grid grid-cols-[auto_1fr_1fr_1fr_1fr_auto] gap-x-4 border-b border-stone-200 pb-2 text-xs font-medium tracking-widest text-stone-400">
        <span></span>
        <span>SKU</span>
        <span>CUT / CARAT</span>
        <span>COLOUR / CLARITY</span>
        <span>PRICE</span>
        <span></span>
      </div>
      <div className="space-y-1">
        {diamonds.map((d) => {
          const assigned = assignedSet.has(d.id)
          return (
            <label
              key={d.id}
              className={`grid grid-cols-[auto_1fr_1fr_1fr_1fr_auto] cursor-pointer items-center gap-x-4 rounded px-3 py-2.5 text-sm transition-colors ${
                assigned
                  ? 'bg-emerald-50 border border-emerald-200'
                  : 'border border-transparent hover:bg-stone-50'
              }`}
            >
              <input
                type="checkbox"
                checked={assigned}
                onChange={() => toggle(d.id, assigned)}
                className="h-4 w-4 accent-emerald-600"
              />
              <span className="font-mono text-xs text-stone-500">{d.sku}</span>
              <span className="text-stone-700">
                {d.cut.charAt(0).toUpperCase() + d.cut.slice(1)} · {d.carat}ct
              </span>
              <span className="text-stone-700">
                {d.colour} · {d.clarity}
              </span>
              <span className="text-stone-900">
                £{Number(d.price_gbp).toLocaleString('en-GB')}
              </span>
              <span className={`text-xs font-medium ${assigned ? 'text-emerald-600' : 'text-stone-300'}`}>
                {assigned ? 'Assigned' : ''}
              </span>
            </label>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-stone-400">
        {assignedIds.length} diamond{assignedIds.length !== 1 ? 's' : ''} assigned
      </p>
    </div>
  )
}
