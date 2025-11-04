import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

type Opt = { id: string; name: string; priceCents: number; tags: string[]; reasons: string[] }

const Body = z.object({ targetTotalCents: z.number().optional() })

function parseJSON<T>(s?: string | null): T | null {
  try { return s ? (JSON.parse(s) as T) : null } catch { return null }
}

export async function POST(req: Request) {
  const body = Body.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 })
  const uid = 'dev-user'
  // Load plan
  const plan = await prisma.plan.findFirst({ where: { userId: uid }, include: { decisions: true } })
  if (!plan) return NextResponse.json({ ok: false, error: 'no_plan' }, { status: 404 })

  const decisions = plan.decisions.map((d) => ({
    id: d.id,
    category: d.category,
    impactScore: d.impactScore,
    selected: parseJSON<Opt>(d.selected)!,
    options: parseJSON<Opt[]>(d.options) || [],
  }))
  const vibe = (parseJSON<any>(plan.summary)?.vibe as string[] | undefined) || []

  const subtotal0 = decisions.reduce((s, d) => s + (d.selected?.priceCents || 0), 0)
  const redline = body.data.targetTotalCents ?? plan.redlineCents

  // Build candidates
  type Cand = { itemId: string; from: Opt; to: Opt; savings: number; impact: number }
  const cands: Cand[] = []
  for (const d of decisions) {
    if (d.category === 'lead') continue
    for (const o of d.options) {
      if (o.priceCents < d.selected.priceCents) {
        // Respect vibe: keep at least one overlap if vibe chosen
        if (vibe.length) {
          const overlaps = o.tags?.some?.((t) => vibe.includes(t))
          if (!overlaps) continue
        }
        cands.push({ itemId: d.id, from: d.selected, to: o, savings: d.selected.priceCents - o.priceCents, impact: d.impactScore })
      }
    }
  }
  cands.sort((a, b) => a.impact - b.impact || b.savings - a.savings)

  const applied: Cand[] = []
  let subtotal = subtotal0
  for (const c of cands) {
    if (subtotal <= redline) break
    // Apply swap virtually (avoid double-applying same item)
    if (applied.find((x) => x.itemId === c.itemId)) continue
    subtotal -= c.savings
    applied.push(c)
  }

  if (applied.length === 0) {
    return NextResponse.json({ ok: true, applied: [], totals: { subtotal: subtotal0, tax: 0, service: 0, gratuity: 0, total: subtotal0 }, message: `No safe swaps found. Consider reducing guest count or opening a weekday.` })
  }

  // Persist swaps
  for (const c of applied) {
    const item = await prisma.decisionItem.findUnique({ where: { id: c.itemId } })
    if (!item) continue
    const prev = parseJSON<Opt>(item.selected)
    const options = parseJSON<Opt[]>(item.options) || []
    const newOptions = [prev!, ...options.filter((o) => o.id !== c.to.id)]
    await prisma.decisionItem.update({
      where: { id: item.id },
      data: { selectedId: c.to.id, selected: JSON.stringify(c.to), options: JSON.stringify(newOptions), status: 'auto_approved' },
    })
  }

  // Recompute totals
  const after = await prisma.plan.findUnique({ where: { id: plan.id }, include: { decisions: true } })
  const sub = (after?.decisions || []).reduce((s, d) => s + (parseJSON<Opt>(d.selected)?.priceCents || 0), 0)
  const tax = Math.round(sub * (plan.taxPct || 0))
  const service = Math.round(sub * (plan.servicePct || 0))
  const gratuity = Math.round(sub * (plan.gratuityPct || 0))
  const total = sub + tax + service + gratuity

  const saved = subtotal0 - sub
  return NextResponse.json({ ok: true, applied: applied.map((a) => ({ itemId: a.itemId, from: a.from, to: a.to, savings: a.savings })), totals: { subtotal: sub, tax, service, gratuity, total }, saved })
}

