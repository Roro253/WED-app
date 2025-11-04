import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const Query = z.object({ proposedSubtotalCents: z.string().optional() })

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = Query.safeParse(Object.fromEntries(url.searchParams))
  if (!q.success) return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 })
  const plan = await prisma.plan.findFirst()
  if (!plan) return NextResponse.json({ ok: false, error: 'no_plan' }, { status: 404 })
  const proposed = Number(q.data.proposedSubtotalCents || 0) || undefined
  const currentSubtotal = (await prisma.decisionItem.findMany({ where: { planId: plan.id } })).reduce((s, d) => s + (JSON.parse(d.selected || 'null')?.priceCents || 0), 0)
  const cTax = Math.round(currentSubtotal * plan.taxPct)
  const cService = Math.round(currentSubtotal * plan.servicePct)
  const cGratuity = Math.round(currentSubtotal * plan.gratuityPct)
  const cTotal = currentSubtotal + cTax + cService + cGratuity
  const pSubtotal = proposed ?? currentSubtotal
  const pTax = Math.round(pSubtotal * plan.taxPct)
  const pService = Math.round(pSubtotal * plan.servicePct)
  const pGratuity = Math.round(pSubtotal * plan.gratuityPct)
  const pTotal = pSubtotal + pTax + pService + pGratuity
  return NextResponse.json({ ok: true, current: { subtotal: currentSubtotal, tax: cTax, service: cService, gratuity: cGratuity, total: cTotal }, proposed: { subtotal: pSubtotal, tax: pTax, service: pService, gratuity: pGratuity, total: pTotal } })
}

