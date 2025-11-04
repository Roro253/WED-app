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
      summary: JSON.stringify({
        venuePreference: null,
        baselineBudgetCents: 3200000,
        dateWindows: [
          { label: 'May–Jun', score: 0.8 },
          { label: 'Sep–Oct', score: 0.9 },
        ],
      }),
    },
  })

  type Opt = { id: string; name: string; priceCents: number; tags: string[]; reasons: string[] }

  function opt(name: string, priceCents: number, tags: string[], reasons: string[]): Opt {
    return { id: name.toLowerCase().replace(/\s+/g, '-'), name, priceCents, tags, reasons }
  }

  const items = [
    {
      category: 'venue',
      impactScore: 9,
      options: [
        opt('Garden Loft', 1200000, ['garden','modern'], ['Price↓','Vibe≈']),
        opt('Historic Hall', 1500000, ['historic'], ['Availability↑','Vibe≈']),
        opt('Riverside Pavilion', 1000000, ['modern'], ['Price↓']),
      ],
    },
    {
      category: 'photo',
      impactScore: 6,
      options: [
        opt('Studio Verve', 350000, ['modern'], ['Vibe≈']),
        opt('Light & Lace', 280000, ['garden'], ['Price↓']),
        opt('Silver Grain', 420000, ['historic'], ['Availability↑']),
      ],
    },
    {
      category: 'florals',
      impactScore: 7,
      options: [
        opt('Green Ivy', 300000, ['garden'], ['Vibe≈']),
        opt('Petal & Stem', 220000, ['modern'], ['Price↓']),
        opt('Bloom Atelier', 400000, ['historic'], ['Availability↑']),
      ],
    },
    {
      category: 'music',
      impactScore: 5,
      options: [
        opt('Velvet Quartet', 260000, ['historic'], ['Vibe≈']),
        opt('Sunset DJ', 180000, ['modern'], ['Price↓']),
        opt('City Swing Band', 320000, ['garden'], ['Availability↑']),
      ],
    },
    {
      category: 'rentals',
      impactScore: 4,
      options: [
        opt('Luxe Linen Set', 200000, ['modern'], ['Vibe≈']),
        opt('Classic Chairs', 150000, ['historic'], ['Price↓']),
        opt('Garden Mix', 170000, ['garden'], ['Availability↑']),
      ],
    },
  ]

  for (const item of items) {
    const selected = item.options[0]
    const alternates = item.options.slice(1)
    await prisma.decisionItem.create({
      data: {
        planId: plan.id,
        category: item.category,
        impactScore: item.impactScore,
        status: 'pending',
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
