"use client"
import { useEffect, useMemo, useRef, useState } from 'react'
import { PlanSummaryPanel } from '@/components/PlanSummaryPanel'
import { VendorLoadout } from '@/components/VendorLoadout'
import PreferencesDrawer from '@/components/preferences/PreferencesDrawer'
import { DecisionModal, type Option } from '@/components/DecisionModal'
import { RedlineModal } from '@/components/RedlineModal'
import { formatCents } from '@/lib/money'
import { track } from '@/lib/analytics'

type Item = { id: string; category: 'venue'|'photo'|'florals'|'music'|'rentals'|'lead'; status: string; impactScore: number; selected: Option; options: Option[] }
type Totals = { subtotal: number; tax: number; service: number; gratuity: number; total: number }

export default function PlanClient() {
  const [items, setItems] = useState<Item[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [redline, setRedline] = useState(0)
  const [openId, setOpenId] = useState<string | null>(null)
  const [redlineOpen, setRedlineOpen] = useState(false)
  const [proposedTotal, setProposedTotal] = useState(0)
  const undoRef = useRef<{ itemId: string; prevSelected: Option | null; timeout?: NodeJS.Timeout } | null>(null)

  async function refresh() {
    const res = await fetch('/api/plan', { cache: 'no-store' })
    if (!res.ok) return
    const data = await res.json()
    setItems(data.decisions)
    setTotals(data.totals)
    setRedline(data.plan.redlineCents)
  }
  useEffect(() => { refresh() }, [])

  async function approve(option: Option) {
    const current = items.find((i) => i.id === openId)
    const res = await fetch('/api/plan/decision/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId: openId, option }) })
    if (res.ok) {
      const data = await res.json()
      setTotals(data.totals)
      if (current) undoRef.current = { itemId: current.id, prevSelected: current.selected }
      track('decision_approved', { category: current?.category, optionName: option.name, delta: (option.priceCents - (current?.selected.priceCents || 0)) })
      await refresh()
    }
  }

  async function swap(option: Option) {
    const current = items.find((i) => i.id === openId)
    const currentPrice = current?.selected.priceCents || 0
    const proposed = (totals?.subtotal || 0) - currentPrice + option.priceCents
    if (proposed > redline) {
      setProposedTotal(proposed)
      setRedlineOpen(true)
      track('redline_intercepted', { overBy: proposed - redline })
      return
    }
    const res = await fetch('/api/plan/decision/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId: openId, option }) })
    if (res.ok) {
      const data = await res.json()
      setTotals(data.totals)
      if (current) undoRef.current = { itemId: current.id, prevSelected: current.selected }
      track('swap_applied', { category: current?.category, optionName: option.name })
      await refresh()
    }
  }

  function onOverBudget(nextTotal: number) {
    setProposedTotal(nextTotal)
    setRedlineOpen(true)
    track('redline_intercepted', { overBy: nextTotal - redline })
  }

  async function optimize() {
    const res = await fetch('/api/plan/optimize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    if (res.ok) {
      const data = await res.json()
      setTotals(data.totals)
      track('optimize_to_budget', { appliedCount: data.applied?.length || 0, saved: data.saved || 0 })
      await refresh()
    }
  }

  async function undo() {
    const u = undoRef.current
    if (!u || !u.prevSelected) return
    await fetch('/api/plan/decision/undo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId: u.itemId, prevSelectedId: u.prevSelected.id, prevSelected: u.prevSelected }) })
    undoRef.current = null
    track('undo_applied', {})
    await refresh()
  }

  const openItem = items.find((i) => i.id === openId) || null
  const waysToSave = useMemo(() => {
    const best: { label: string; saveCents: number }[] = []
    for (const it of items) {
      const cheapest = [...it.options, it.selected].sort((a, b) => a.priceCents - b.priceCents)[0]
      const save = it.selected.priceCents - cheapest.priceCents
      if (save > 0) best.push({ label: `${it.category} → ${cheapest.name}`, saveCents: save })
    }
    return best.sort((a, b) => b.saveCents - a.saveCents).slice(0, 3)
  }, [items])

  return (
    <div className="grid gap-6 md:grid-cols-[320px,1fr]">
      <PlanSummaryPanel />
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-serif text-xl text-[--ink-900]">Party Loadout</h2>
          <PreferencesButton />
        </div>
        <VendorLoadout onOpen={(id) => setOpenId(id)} />
        <h3 className="mb-2 mt-6 font-serif text-xl text-[--ink-900]">Decisions</h3>
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
        </div>
      </section>

      {openItem && (
        <DecisionModal
          open={!!openItem}
          onClose={() => setOpenId(null)}
          itemId={openItem.id}
          category={openItem.category}
          current={openItem.selected}
          alternates={openItem.options}
          redlineCents={redline}
          planTotalCents={totals?.subtotal || 0}
          onApprove={approve}
          onSwap={swap}
          onOverBudget={onOverBudget}
        />
      )}

      <RedlineModal
        open={redlineOpen}
        currentTotal={totals?.subtotal || 0}
        proposedTotal={proposedTotal}
        redline={redline}
        waysToSave={waysToSave}
        onClose={() => setRedlineOpen(false)}
        onProceed={async () => setRedlineOpen(false)}
        onOptimize={async () => { setRedlineOpen(false); await optimize() }}
      />

      {/* Simple toast/undo (aria-live) */}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {undoRef.current && (
          <div className="pointer-events-auto rounded-xl border border-[--ink-200] bg-[--paper-50] px-3 py-2 shadow">
            <span className="mr-2 text-[--ink-900]">Change saved.</span>
            <button onClick={undo} className="rounded-full border border-[--ink-300] px-2 py-0.5 text-sm text-[--ink-900] hover:bg-[--paper-100]">Undo</button>
          </div>
        )}
      </div>
    </div>
  )
}

function PreferencesButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-full border border-[--ink-300] px-3 py-1 text-sm text-[--ink-900] hover:bg-[--paper-100]">Edit preferences</button>
      {open && <PreferencesDrawer onClose={() => setOpen(false)} />}
    </>
  )
}
