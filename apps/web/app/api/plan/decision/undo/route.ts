import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const Body = z.object({ itemId: z.string(), prevSelectedId: z.string().nullable().optional(), prevSelected: z.any() })

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 })
  const { itemId, prevSelectedId, prevSelected } = parsed.data
  try {
    const item = await prisma.decisionItem.update({ where: { id: itemId }, data: { selectedId: prevSelectedId || null, selected: JSON.stringify(prevSelected), status: 'pending' } })
    const plan = await prisma.plan.findUnique({ where: { id: item.planId }, include: { decisions: true } })
    const subtotal = (plan?.decisions || []).reduce((s, d) => s + (JSON.parse(d.selected || 'null')?.priceCents || 0), 0)
    const tax = Math.round(subtotal * (plan?.taxPct || 0))
    const service = Math.round(subtotal * (plan?.servicePct || 0))
    const gratuity = Math.round(subtotal * (plan?.gratuityPct || 0))
    const total = subtotal + tax + service + gratuity
    return NextResponse.json({ ok: true, totals: { subtotal, tax, service, gratuity, total } })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'undo_failed' }, { status: 500 })
  }
}

