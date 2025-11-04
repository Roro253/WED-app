"use client"
import { useEffect, useState } from 'react'
import { formatCents } from '@/lib/money'

type Item = { id: string; category: string; selected: { id: string; name: string; priceCents: number; tags: string[]; reasons: string[] } }

export function VendorLoadout({ onOpen }: { onOpen: (itemId: string) => void }) {
  const [items, setItems] = useState<Item[]>([])

  async function refresh() {
    const res = await fetch('/api/plan', { cache: 'no-store' })
    const data = await res.json()
    setItems(data.decisions)
  }
  useEffect(() => { refresh(); const t = setInterval(refresh, 2000); return () => clearInterval(t) }, [])

  const order = ['photo','florals','music','rentals','lead']
  const list = items.filter((i) => order.includes(i.category)).sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category))

  if (!list.length) return <div className="rounded-2xl border border-[--ink-200] p-4 text-[--ink-700]">We pre‑filled your core team. Change anything anytime.</div>
  return (
    <div className="grid gap-3 md:grid-cols-2" aria-label="Vendor loadout">
      {list.map((i) => (
        <div key={i.id} className="rounded-2xl border border-[--ink-200] p-4">
          <div className="text-sm text-[--ink-600]">{i.category}</div>
          <div className="mt-1 font-medium text-[--ink-900]">{i.selected.name}</div>
          <div className="mt-1 text-[--ink-900]">{formatCents(i.selected.priceCents)}</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {i.selected.reasons?.slice(0,3).map((r) => (
              <span key={r} className="rounded bg-[--paper-200] px-1.5 py-0.5 text-[10px] text-[--ink-700]">{r}</span>
            ))}
          </div>
          <button className="mt-3 rounded-full border border-[--ink-300] px-3 py-1 text-sm text-[--ink-900] hover:bg-[--paper-100]" onClick={() => onOpen(i.id)} aria-label={`Swap ${i.category}`}>
            Swap
          </button>
        </div>
      ))}
    </div>
  )
}

