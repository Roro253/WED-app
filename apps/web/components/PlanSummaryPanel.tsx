"use client"
import { useEffect, useState } from 'react'
import { BudgetBar } from '@/components/BudgetBar'
import { formatCents } from '@/lib/money'

type Totals = { subtotal: number; tax: number; service: number; gratuity: number; total: number }

export function PlanSummaryPanel() {
  const [totals, setTotals] = useState<Totals | null>(null)
  const [redline, setRedline] = useState(0)
  const [dateWindows, setDateWindows] = useState<string[]>([])

  async function refresh() {
    const res = await fetch('/api/plan', { cache: 'no-store' })
    if (!res.ok) return
    const data = await res.json()
    setTotals(data.totals)
    setRedline(data.plan.redlineCents)
    setDateWindows(data.plan.dateWindows || [])
  }

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 2000)
    return () => clearInterval(t)
  }, [])

  if (!totals) return <div className="rounded-2xl border border-[--ink-200] p-4">Loading…</div>
  return (
    <aside className="rounded-2xl border border-[--ink-200] p-4" aria-label="Plan summary">
      <BudgetBar total={totals.subtotal} redline={redline} />
      <div className="mt-4 space-y-1 text-sm text-[--ink-800]">
        <div className="flex items-center justify-between"><span>Subtotal</span><span>{formatCents(totals.subtotal)}</span></div>
        <div className="flex items-center justify-between"><span>Tax</span><span>{formatCents(totals.tax)}</span></div>
        <div className="flex items-center justify-between"><span>Service</span><span>{formatCents(totals.service)}</span></div>
        <div className="flex items-center justify-between"><span>Gratuity</span><span>{formatCents(totals.gratuity)}</span></div>
        <button className="mt-2 w-full rounded-xl border border-[--ink-300] px-3 py-2 text-left text-[--ink-900] hover:bg-[--paper-100]" aria-label="View totals explanation">
          Total {formatCents(totals.total)}
        </button>
      </div>
      {dateWindows?.length > 0 && (
        <div className="mt-4">
          <div className="text-sm text-[--ink-700]">Date windows</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {dateWindows.map((d) => (
              <span key={d} className="rounded-full border border-[--ink-300] px-3 py-1 text-xs text-[--ink-800]">{d}</span>
            ))}
          </div>
        </div>
      )}
      <button
        className="mt-4 w-full rounded-full border border-[--ink-300] px-4 py-2 text-[--ink-900] hover:bg-[--paper-100]"
        onClick={async () => {
          const res = await fetch('/api/plan/optimize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
          if (res.ok) await refresh()
        }}
      >
        Optimize to Budget
      </button>
    </aside>
  )
}

