"use client"
import { formatCents, withFees } from '@/lib/money'
import { track } from '@/lib/analytics'

type Option = { id: string; name: string; priceCents: number; tags: string[]; reasons: string[] }

export function RedlineModal({
  open,
  currentTotal,
  proposedTotal,
  redline,
  waysToSave,
  onClose,
  onProceed,
  onOptimize,
}: {
  open: boolean
  currentTotal: number
  proposedTotal: number
  redline: number
  waysToSave: { label: string; saveCents: number }[]
  onClose: () => void
  onProceed: () => Promise<void>
  onOptimize: (pick: { label: string; saveCents: number }) => Promise<void>
}) {
  if (!open) return null
  const delta = proposedTotal - redline
  const feesNow = withFees({ subtotal: currentTotal, taxPct: 0.09, servicePct: 0.1, gratuityPct: 0.15 })
  const feesProposed = withFees({ subtotal: proposedTotal, taxPct: 0.09, servicePct: 0.1, gratuityPct: 0.15 })
  return (
    <div role="dialog" aria-modal="true" aria-label="Budget redline" className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-[92vw] max-w-2xl rounded-3xl border border-[--ink-200] bg-white p-6 shadow-2xl">
        <header className="mb-4">
          <h2 className="text-xl font-serif text-[--ink-900]">This choice exceeds your redline by {formatCents(delta)}.</h2>
          <p className="mt-1 text-sm text-[--ink-600]">Let’s balance the budget in one tap.</p>
        </header>
        <div className="grid gap-4">
          <div className="rounded-xl border border-[--ink-200] p-4">
            <div className="text-sm font-medium text-[--ink-700]">Impact</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>Subtotal now</div>
              <div className="text-right">{formatCents(currentTotal)}</div>
              <div>Subtotal proposed</div>
              <div className="text-right">{formatCents(proposedTotal)}</div>
              <div>Total now (est.)</div>
              <div className="text-right">{formatCents(feesNow.total)}</div>
              <div>Total proposed (est.)</div>
              <div className="text-right">{formatCents(feesProposed.total)}</div>
            </div>
          </div>
          <div className="rounded-xl border border-[--ink-200] p-4">
            <div className="text-sm font-medium text-[--ink-700]">Ways to Save</div>
            <ul className="mt-2 space-y-2">
              {waysToSave.map((w) => (
                <li key={w.label} className="flex items-center justify-between">
                  <div className="text-[--ink-900]">Save {formatCents(w.saveCents)} by {w.label}</div>
                  <button
                    className="rounded-full border border-[--ink-300] px-3 py-1.5 text-sm hover:bg-[--paper-100]"
                    onClick={async () => {
                      await onOptimize(w)
                      track('optimize_to_budget', { pick: w.label })
                    }}
                  >
                    Apply
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <footer className="mt-6 flex items-center justify-end gap-3">
          <button onClick={onClose} className="rounded-full border border-[--ink-300] px-4 py-2 hover:bg-[--paper-100]">
            Cancel
          </button>
          <button onClick={onProceed} className="rounded-full bg-[--ink-900] px-5 py-2 text-white hover:bg-[--ink-800]">
            Proceed anyway
          </button>
        </footer>
      </div>
    </div>
  )
}

