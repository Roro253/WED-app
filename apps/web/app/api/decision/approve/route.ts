import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const { itemId, option } = (await req.json()) as { itemId: string; option: any }
  try {
    const item = await prisma.decisionItem.update({
      where: { id: itemId },
      data: { selected: JSON.stringify(option), status: 'approved' },
    })
    // Recompute plan total
    const decisions = await prisma.decisionItem.findMany({ where: { planId: item.planId } })
    const total = decisions.reduce((sum, d) => sum + (JSON.parse(d.selected) as any).priceCents, 0)
    const plan = await prisma.plan.update({ where: { id: item.planId }, data: { totalCents: total } })
    return NextResponse.json({ ok: true, plan })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'approve_failed' }, { status: 500 })
  }
}

