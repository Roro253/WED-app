import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { z } from 'zod'

type Opt = { id: string; name: string; priceCents: number; tags: string[]; reasons: string[] }

function parseJSON<T>(s?: string | null): T | null {
  try {
    if (!s) return null
    return JSON.parse(s) as T
  } catch {
    return null
  }
}

export async function GET() {
  const uid = (await cookies()).get('uid')?.value || 'dev-user'
  let plan = await prisma.plan.findFirst({ where: { userId: uid }, include: { decisions: true } })
  if (!plan) {
    // Ensure plan exists by hitting dev seeding endpoint logic
    await prisma.user.upsert({ where: { id: uid }, update: {}, create: { id: uid } })
    const created = await prisma.plan.create({ data: { userId: uid, redlineCents: 4_000_000, totalCents: 0, status: 'preview', summary: '{}', dateWindows: '[]' } })
    plan = await prisma.plan.findFirst({ where: { id: created.id }, include: { decisions: true } }) as any
  }
  const decisions = ((plan?.decisions as any[]) ?? []).map((d) => ({
    id: d.id,
    category: d.category,
    impactScore: d.impactScore,
    status: d.status,
    selectedId: d.selectedId,
    selected: parseJSON<Opt>(d.selected)!,
    options: parseJSON<Opt[]>(d.options) ?? [],
    deltaCents: d.deltaCents,
  }))
  const subtotal = decisions.reduce((s: number, d: any) => s + (d.selected?.priceCents ?? 0), 0)
  const tax = Math.round(subtotal * (plan?.taxPct || 0))
  const service = Math.round(subtotal * (plan?.servicePct || 0))
  const gratuity = Math.round(subtotal * (plan?.gratuityPct || 0))
  const total = subtotal + tax + service + gratuity
  if (plan) {
    await prisma.plan.update({ where: { id: plan.id }, data: { totalCents: subtotal } })
  }
  const summary = parseJSON<any>(plan?.summary || '{}') || {}
  const dateWindows = parseJSON<string[]>(plan?.dateWindows || '[]') || []
  return NextResponse.json({
    plan: {
      id: plan?.id || 'plan',
      redlineCents: plan?.redlineCents || 0,
      taxPct: plan?.taxPct || 0,
      servicePct: plan?.servicePct || 0,
      gratuityPct: plan?.gratuityPct || 0,
      summary,
      dateWindows,
    },
    totals: { subtotal, tax, service, gratuity, total },
    decisions: decisions.sort((a, b) => (b.impactScore - a.impactScore) || a.category.localeCompare(b.category)),
  })
}
