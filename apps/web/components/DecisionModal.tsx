"use client"
import { useEffect, useMemo, useRef, useState } from 'react'
import { formatCents } from '@/lib/money'
import { track } from '@/lib/analytics'

export type Option = { id: string; name: string; priceCents: number; tags: string[]; reasons: string[] }

export type DecisionModalProps = {
  open: boolean
  onClose: () => void
  itemId: string
  category: 'venue' | 'photo' | 'florals' | 'music' | 'rentals'
  current: Option
  alternates: Option[]
  redlineCents: number
  planTotalCents: number
  onApprove: (option: Option) => Promise<void>
  onSwap: (option: Option) => Promise<void>
  onOverBudget: (proposedTotal: number) => void
}

export function DecisionModal(props: DecisionModalProps) {
  const {
    open,
    onClose,
    category,
    current,
    alternates,
    planTotalCents,
    redlineCents,
    onApprove,
    onSwap,
    onOverBudget,
  } = props
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (open && !d.open) {
      d.showModal()
      track('decision_opened', { category })
    } else if (!open && d.open) {
      d.close()
    }
  }, [open, category])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter') handleApprove()
      if (e.key.toLowerCase() === 's' && alternates[0]) handleSwap(alternates[0])
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, alternates])

  const delta = useMemo(() => {
    return current.priceCents
  }, [current])

  async function handleApprove() {
    const proposedTotal = planTotalCents - current.priceCents + current.priceCents
    if (proposedTotal > redlineCents) {
      track('redline_intercepted', { category, proposedTotal })
      onOverBudget(proposedTotal)
      return
    }
    await onApprove(current)
    track('decision_approved', { category, optionId: current.id })
    onClose()
  }

  async function handleSwap(opt: Option) {
    await onSwap(opt)
    track('swap_applied', { category, optionId: opt.id })
    onClose()
  }

  return (
    <dialog ref={dialogRef} className="rounded-3xl border border-[--ink-200] p-0 shadow-2xl backdrop:bg-black/20 max-w-3xl w-[92vw]">
      <div role="document" className="p-6">
        <header className="mb-4 flex items-center justify-between">
          <h2 id="decision-title" className="text-xl font-serif text-[--ink-900]">
            {category[0].toUpperCase() + category.slice(1)}
          </h2>
          <button onClick={onClose} className="rounded-full px-3 py-1 text-sm text-[--ink-600] hover:bg-[--ink-100] focus:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-500]">
            Esc
          </button>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[--ink-200] p-4">
            <div className="text-sm text-[--ink-600]">Our pick</div>
            <div className="mt-1 text-lg font-medium text-[--ink-900]">{current.name}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {current.reasons?.map((r) => (
                <span key={r} className="rounded-full bg-[--paper-200] px-2 py-0.5 text-xs text-[--ink-700]">
                  {r}
                </span>
              ))}
            </div>
            <div className="mt-4 text-2xl font-semibold text-[--ink-900]">{formatCents(current.priceCents)}</div>
          </div>
          <div>
            <div className="mb-2 text-sm text-[--ink-600]">Alternates</div>
            <div className="grid gap-3">
              {alternates.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSwap(opt)}
                  className="flex items-center justify-between rounded-xl border border-[--ink-200] p-3 text-left hover:bg-[--paper-100] focus:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-500]"
                >
                  <div>
                    <div className="font-medium text-[--ink-900]">{opt.name}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {opt.reasons?.map((r) => (
                        <span key={r} className="rounded bg-[--paper-200] px-1.5 py-0.5 text-[10px] text-[--ink-700]">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="ml-3 text-[--ink-900]">{formatCents(opt.priceCents)}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <footer className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-full border border-[--ink-300] px-4 py-2 text-[--ink-800] hover:bg-[--paper-100] focus:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-500]"
          >
            Not now
          </button>
          <button
            onClick={handleApprove}
            className="rounded-full bg-[--ink-900] px-5 py-2 text-white hover:bg-[--ink-800] focus:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-500]"
            aria-keyshortcuts="Enter"
          >
            Approve
          </button>
        </footer>
      </div>
    </dialog>
  )
}

