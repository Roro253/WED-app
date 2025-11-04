"use client"
import { useEffect, useMemo, useState } from 'react'

type Option = { id: string; name: string; priceCents: number; tags: string[]; reasons: string[] }
type Item = { id: string; category: string; status: string; selected: Option; options: Option[] }

export default function ApprovalsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [bulkBusy, setBulkBusy] = useState(false)

  async function refresh() {
    setLoading(true)
    const res = await fetch('/api/plan', { cache: 'no-store' })
    const data = await res.json()
    setItems(data.decisions || [])
    setLoading(false)
  }
  useEffect(() => { refresh() }, [])

  const pending = useMemo(() => items.filter(i => i.status !== 'approved' && i.status !== 'auto_approved'), [items])

  async function approveOne(itemId: string, opt: Option) {
    await fetch('/api/plan/decision/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId, option: opt }) })
    await refresh()
  }

  async function approveAll() {
    // Internal API call; no third‑party keys required
    setBulkBusy(true)
    for (const it of pending) {
      await approveOne(it.id, it.selected)
    }
    setBulkBusy(false)
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-[--ink-900]">Approvals</h1>
        <button
          className="rounded-full bg-[--ink-900] px-4 py-2 text-[--paper-50] disabled:opacity-60"
          onClick={approveAll}
          disabled={bulkBusy || pending.length === 0}
        >
          Approve all essentials ({pending.length})
        </button>
      </div>
      {loading ? (
        <div className="rounded-xl border border-[--ink-200] p-4 text-[--ink-700]">Loading…</div>
      ) : pending.length === 0 ? (
        <div className="rounded-xl border border-[--ink-200] p-4 text-[--ink-700]">Everything’s approved. You’re ready for checkout.</div>
      ) : (
        <div className="space-y-3">
          {pending.map((i) => (
            <div key={i.id} className="flex items-center justify-between rounded-xl border border-[--ink-200] p-4">
              <div>
                <div className="text-sm text-[--ink-600]">{i.category}</div>
                <div className="font-medium text-[--ink-900]">{i.selected.name}</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-full border border-[--ink-300] px-3 py-1 text-sm text-[--ink-900] hover:bg-[--paper-100]" onClick={() => approveOne(i.id, i.selected)}>Approve</button>
                <a className="rounded-full border border-[--ink-300] px-3 py-1 text-sm text-[--ink-900] hover:bg-[--paper-100]" href="/plan">Swap</a>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-6 rounded-xl border border-[--ink-200] p-4 text-sm text-[--ink-700]">
        Checkout and payments — coming soon (requires provider API keys).
      </div>
    </div>
  )
}

