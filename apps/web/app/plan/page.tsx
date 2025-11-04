import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { formatCents } from '@/lib/money'
import Client from './plan_client'

type Option = { id: string; name: string; priceCents: number; tags: string[]; reasons: string[] }

export default async function PlanPage() {
  const uid = (await cookies()).get('uid')?.value || 'dev-user'
  let plan = await prisma.plan.findFirst({ where: { userId: uid }, include: { decisions: true } })
  if (!plan) {
    // Force-create via API path on first visit
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/dev/plan`, { cache: 'no-store' })
    plan = await prisma.plan.findFirst({ where: { userId: uid }, include: { decisions: true } })
  }
  if (!plan) {
    return <div>Loading...</div>
  }
  const decisions = plan.decisions.map((d) => ({
    ...d,
    category: d.category as 'venue' | 'photo' | 'florals' | 'music' | 'rentals',
    selected: JSON.parse(d.selected as unknown as string) as Option,
    options: JSON.parse(d.options as unknown as string) as Option[],
  }))
  return (
    <div className="grid gap-6 md:grid-cols-[320px,1fr]">
      <aside className="rounded-2xl border border-[--ink-200] p-4">
        <div className="text-sm text-[--ink-600]">Plan Summary</div>
        <div className="mt-2 text-2xl font-semibold text-[--ink-900]">{formatCents(plan.totalCents)}</div>
        <div className="mt-1 text-sm text-[--ink-600]">Redline {formatCents(plan.redlineCents)}</div>
      </aside>
      <section>
        <h2 className="mb-3 font-serif text-xl text-[--ink-900]">Decisions</h2>
        <Client planId={plan.id} redline={plan.redlineCents} total={plan.totalCents} items={decisions} />
      </section>
    </div>
  )
}
