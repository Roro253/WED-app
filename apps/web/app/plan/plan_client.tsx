"use client"
import { useMemo, useState } from 'react'
import { formatCents } from '@/lib/money'
import { DecisionModal, type Option } from '@/components/DecisionModal'
import { RedlineModal } from '@/components/RedlineModal'
import { track } from '@/lib/analytics'

type DecisionItem = {
  id: string
  category: 'venue' | 'photo' | 'florals' | 'music' | 'rentals'
  status: string
  selected: Option
  options: Option[]
}

export default function Client({
  planId,
  redline,
  total,
  items,
}: {
  planId: string
  redline: number
  total: number
  items: DecisionItem[]
}) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [planTotal, setPlanTotal] = useState(total)
  const [redlineOpen, setRedlineOpen] = useState(false)
  const [proposedTotal, setProposedTotal] = useState(0)

  const openItem = items.find((i) => i.id === openId) || null

  async function approve(option: Option) {
    const res = await fetch('/api/decision/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: openId, option }),
    })
    if (res.ok) {
      const data = await res.json()
      setPlanTotal(data.plan.totalCents)
    }
  }

  async function swap(option: Option) {
    await fetch('/api/decision/swap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: openId, option }),
    })
  }

  function onOverBudget(nextTotal: number) {
    setProposedTotal(nextTotal)
    setRedlineOpen(true)
  }

  const waysToSave = useMemo(() => {
    // pick the lowest priced alt across categories
    const best: { label: string; saveCents: number }[] = []
    for (const it of items) {
      const cheapest = [...it.options, it.selected].sort((a, b) => a.priceCents - b.priceCents)[0]
      const save = it.selected.priceCents - cheapest.priceCents
      if (save > 0) best.push({ label: `${it.category} → ${cheapest.name}`, saveCents: save })
    }
    return best.sort((a, b) => b.saveCents - a.saveCents).slice(0, 3)
  }, [items])

  return (
    <div className="space-y-3">
      {items.map((it) => (
        <button
          key={it.id}
          className="flex w-full items-center justify-between rounded-xl border border-[--ink-200] p-4 text-left hover:bg-[--paper-100] focus:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-600]"
          onClick={() => setOpenId(it.id)}
          aria-label={`Open ${it.category} decision`}
        >
          <div>
            <div className="text-sm text-[--ink-600]">{it.category}</div>
            <div className="font-medium text-[--ink-900]">{it.selected.name}</div>
          </div>
          <div className="text-[--ink-900]">{formatCents(it.selected.priceCents)}</div>
        </button>
      ))}

      {openItem && (
        <DecisionModal
          open={!!openItem}
          onClose={() => setOpenId(null)}
          itemId={openItem.id}
          category={openItem.category}
          current={openItem.selected}
          alternates={openItem.options}
          redlineCents={redline}
          planTotalCents={planTotal}
          onApprove={approve}
          onSwap={swap}
          onOverBudget={onOverBudget}
        />
      )}

      <RedlineModal
        open={redlineOpen}
        currentTotal={planTotal}
        proposedTotal={proposedTotal}
        redline={redline}
        waysToSave={waysToSave}
        onClose={() => setRedlineOpen(false)}
        onProceed={async () => {
          setRedlineOpen(false)
          track('decision_approved')
        }}
        onOptimize={async (pick) => {
          // No-op demo: just close modal
          setRedlineOpen(false)
          track('optimize_to_budget', { pick: pick.label })
        }}
      />
    </div>
  )
}

