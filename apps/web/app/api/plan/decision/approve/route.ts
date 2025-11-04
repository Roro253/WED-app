import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const Body = z.object({ itemId: z.string(), optionId: z.string().optional(), option: z.any().optional() })

export async function POST(req: Request) {
  const body = Body.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 })
  const { itemId, optionId, option } = body.data
  try {
    let selectedSnapshot = option
    let selectedId = optionId || option?.id
    if (!selectedSnapshot && optionId) {
      const v = await prisma.vendorOption.findUnique({ where: { id: optionId } })
      if (!v) return NextResponse.json({ ok: false, error: 'option_not_found' }, { status: 404 })
      selectedSnapshot = { id: v.id, name: v.name, priceCents: v.priceCents, tags: JSON.parse(v.tags || '[]'), reasons: JSON.parse(v.reasons || '[]') }
      selectedId = v.id
    }
    const updated = await prisma.decisionItem.update({ where: { id: itemId }, data: { selectedId: selectedId || null, selected: JSON.stringify(selectedSnapshot), status: 'approved' } })
    // Recompute totals
    const plan = await prisma.plan.findUnique({ where: { id: updated.planId }, include: { decisions: true } })
    const subtotal = (plan?.decisions || []).reduce((s, d) => s + (JSON.parse(d.selected || 'null')?.priceCents || 0), 0)
    const tax = Math.round(subtotal * (plan?.taxPct || 0))
    const service = Math.round(subtotal * (plan?.servicePct || 0))
    const gratuity = Math.round(subtotal * (plan?.gratuityPct || 0))
    const total = subtotal + tax + service + gratuity
    return NextResponse.json({ ok: true, totals: { subtotal, tax, service, gratuity, total }, itemId })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'approve_failed' }, { status: 500 })
  }
}

