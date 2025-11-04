import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const uid = 'dev-user'
  let user = await prisma.user.findUnique({ where: { id: uid } })
  if (!user) {
    user = await prisma.user.create({ data: { id: uid, email: null } })
  }

  const existingPlan = await prisma.plan.findFirst({ where: { userId: uid } })
  if (existingPlan) {
    console.log('Plan already exists; skipping seed.')
    return
  }

  const redlineCents = 4000000 // $40,000

  const plan = await prisma.plan.create({
    data: {
      userId: uid,
      redlineCents,
      totalCents: 0,
      status: 'preview',
      taxPct: 0.0875,
      servicePct: 0.18,
      gratuityPct: 0,
      summary: JSON.stringify({
        venuePreference: null,
        baselineBudgetCents: 3200000,
      }),
      dateWindows: JSON.stringify(['2025-09-12','2025-09-19','2025-09-21'])
    },
  })

  type Opt = { id: string; name: string; priceCents: number; tags: string[]; reasons: string[] }

  function opt(name: string, priceCents: number, tags: string[], reasons: string[]): Opt {
    return { id: name.toLowerCase().replace(/\s+/g, '-'), name, priceCents, tags, reasons }
  }

  // Create VendorOptions (value, standard, premium) for categories
  const catalog: { category: string; tiers: { name: string; priceCents: number; tags: string[]; reasons: string[] }[] }[] = [
    { category: 'photo', tiers: [
        { name: 'Photo Value', priceCents: 250000, tags: ['modern','weekday_discount'], reasons: ['Price↓'] },
        { name: 'Photo Standard', priceCents: 350000, tags: ['modern'], reasons: ['Vibe≈'] },
        { name: 'Photo Premium', priceCents: 500000, tags: ['premium'], reasons: ['Availability↑'] },
      ] },
    { category: 'florals', tiers: [
        { name: 'Florals Value', priceCents: 180000, tags: ['garden'], reasons: ['Price↓'] },
        { name: 'Florals Standard', priceCents: 300000, tags: ['garden'], reasons: ['Vibe≈'] },
        { name: 'Florals Premium', priceCents: 450000, tags: ['premium'], reasons: ['Availability↑'] },
      ] },
    { category: 'music', tiers: [
        { name: 'Music Value (DJ)', priceCents: 180000, tags: ['modern'], reasons: ['Price↓'] },
        { name: 'Music Standard (Band)', priceCents: 320000, tags: ['garden'], reasons: ['Vibe≈'] },
        { name: 'Music Premium (Band)', priceCents: 500000, tags: ['premium'], reasons: ['Availability↑'] },
      ] },
    { category: 'rentals', tiers: [
        { name: 'Rentals Value', priceCents: 140000, tags: ['historic'], reasons: ['Price↓'] },
        { name: 'Rentals Standard', priceCents: 200000, tags: ['modern'], reasons: ['Vibe≈'] },
        { name: 'Rentals Premium', priceCents: 320000, tags: ['premium'], reasons: ['Availability↑'] },
      ] },
    { category: 'lead', tiers: [
        { name: 'Day‑of Lead', priceCents: 120000, tags: ['logistics'], reasons: ['Vibe≈'] },
        { name: 'Lead + Assistant', priceCents: 180000, tags: ['logistics'], reasons: ['Availability↑'] },
        { name: 'Full Service', priceCents: 450000, tags: ['premium'], reasons: ['Availability↑'] },
      ] },
  ]

  const vendorMap: Record<string, { id: string; name: string; priceCents: number; tags: string[]; reasons: string[] }[]> = {}
  for (const entry of catalog) {
    vendorMap[entry.category] = []
    for (const t of entry.tiers) {
      const v = await prisma.vendorOption.create({
        data: { category: entry.category, name: t.name, priceCents: t.priceCents, tags: JSON.stringify(t.tags), reasons: JSON.stringify(t.reasons) },
      })
      vendorMap[entry.category].push({ id: v.id, name: v.name, priceCents: v.priceCents, tags: t.tags, reasons: t.reasons })
    }
  }

  // Decision items from vendorMap; preselect Standard (index 1) for all except lead where index 0 is required
  const items = [
    { category: 'photo', impactScore: 4 },
    { category: 'florals', impactScore: 4 },
    { category: 'music', impactScore: 3 },
    { category: 'rentals', impactScore: 2 },
    { category: 'lead', impactScore: 5 },
  ]

  for (const item of items) {
    const opts = vendorMap[item.category]
    const selected = item.category === 'lead' ? opts[0] : opts[1]
    const alternates = opts.filter((o) => o.id !== selected.id)
    await prisma.decisionItem.create({
      data: {
        planId: plan.id,
        category: item.category,
        impactScore: item.impactScore,
        status: 'pending',
        selectedId: selected.id,
        selected: JSON.stringify(selected),
        options: JSON.stringify(alternates),
        deltaCents: 0,
      },
    })
  }

  // compute total
  const decisions = await prisma.decisionItem.findMany({ where: { planId: plan.id } })
  const total = decisions.reduce((sum, d) => sum + (JSON.parse(d.selected as unknown as string) as any).priceCents, 0)
  await prisma.plan.update({ where: { id: plan.id }, data: { totalCents: total } })

  // quiz spec
  const existingQuiz = await prisma.quiz.findFirst({ where: { name: 'onboarding-v1', version: 1 } })
  if (!existingQuiz) {
    await prisma.quiz.create({
      data: {
        name: 'onboarding-v1',
        version: 1,
        spec: JSON.stringify({
          version: 1,
          steps: [
            { key: 'budget', type: 'currency', min: 10000, max: 100000, step: 500 },
            { key: 'guests', type: 'number', min: 10, max: 300, step: 10 },
            { key: 'dateFlex', type: 'enum', options: ['fixed','window','flex'] },
            { key: 'vibe', type: 'multiselect', options: ['garden','industrial','historic','beach','modern'] }
          ],
        }),
      },
    })
  }

  console.log('Seed complete')
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })
