import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

type Option = { id: string; name: string; priceCents: number; tags: string[]; reasons: string[] }

export async function GET() {
  const uid = (await cookies()).get('uid')?.value || 'dev-user'
  try {
    // ensure user exists
    const user = await prisma.user.upsert({
      where: { id: uid },
      update: {},
      create: { id: uid, email: null },
    })

    // find or create plan
    let plan = await prisma.plan.findFirst({
      where: { userId: user.id },
      include: { decisions: true },
    })
    if (!plan) {
      // create simple plan with defaults similar to seed
      const created = await prisma.plan.create({
        data: {
          userId: user.id,
          redlineCents: 4_000_000,
          totalCents: 0,
          status: 'preview',
          summary: JSON.stringify({ venuePreference: null }),
        },
      })

      const mk = (name: string, priceCents: number, tags: string[], reasons: string[]) => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        priceCents,
        tags,
        reasons,
      })

      const items: { category: string; impactScore: number; options: Option[] }[] = [
        {
          category: 'venue',
          impactScore: 9,
          options: [
            mk('Garden Loft', 1_200_000, ['garden', 'modern'], ['Price↓', 'Vibe≈']),
            mk('Historic Hall', 1_500_000, ['historic'], ['Availability↑', 'Vibe≈']),
            mk('Riverside Pavilion', 1_000_000, ['modern'], ['Price↓']),
          ],
        },
        {
          category: 'photo',
          impactScore: 6,
          options: [
            mk('Studio Verve', 350_000, ['modern'], ['Vibe≈']),
            mk('Light & Lace', 280_000, ['garden'], ['Price↓']),
            mk('Silver Grain', 420_000, ['historic'], ['Availability↑']),
          ],
        },
        {
          category: 'florals',
          impactScore: 7,
          options: [
            mk('Green Ivy', 300_000, ['garden'], ['Vibe≈']),
            mk('Petal & Stem', 220_000, ['modern'], ['Price↓']),
            mk('Bloom Atelier', 400_000, ['historic'], ['Availability↑']),
          ],
        },
        {
          category: 'music',
          impactScore: 5,
          options: [
            mk('Velvet Quartet', 260_000, ['historic'], ['Vibe≈']),
            mk('Sunset DJ', 180_000, ['modern'], ['Price↓']),
            mk('City Swing Band', 320_000, ['garden'], ['Availability↑']),
          ],
        },
        {
          category: 'rentals',
          impactScore: 4,
          options: [
            mk('Luxe Linen Set', 200_000, ['modern'], ['Vibe≈']),
            mk('Classic Chairs', 150_000, ['historic'], ['Price↓']),
            mk('Garden Mix', 170_000, ['garden'], ['Availability↑']),
          ],
        },
      ]

      for (const item of items) {
        const selected = item.options[0]
        const options = item.options.slice(1)
        await prisma.decisionItem.create({
          data: {
            planId: created.id,
            category: item.category,
            impactScore: item.impactScore,
            status: 'pending',
            selected: JSON.stringify(selected),
            options: JSON.stringify(options),
            deltaCents: 0,
          },
        })
      }
      const decisions = await prisma.decisionItem.findMany({ where: { planId: created.id } })
      const total = decisions.reduce((sum, d) => sum + (JSON.parse(d.selected) as Option).priceCents, 0)
      await prisma.plan.update({ where: { id: created.id }, data: { totalCents: total } })
      plan = await prisma.plan.findFirst({ where: { id: created.id }, include: { decisions: true } })
    }

    // shape payload
    if (!plan) throw new Error('Plan not found')
    const decisions = plan.decisions.map((d) => ({
      ...d,
      selected: JSON.parse(d.selected as unknown as string) as Option,
      options: JSON.parse(d.options as unknown as string) as Option[],
    }))
    return NextResponse.json({ ...plan, decisions })
  } catch (err) {
    // Fallback: return a static fixture so the demo still works
    const fallback = {
      id: 'demo-plan',
      status: 'preview',
      redlineCents: 4_000_000,
      totalCents: 0,
      decisions: [
        {
          id: 'd1',
          category: 'venue',
          impactScore: 9,
          status: 'pending',
          selected: { id: 'garden-loft', name: 'Garden Loft', priceCents: 1_200_000, tags: ['garden'], reasons: ['Price↓', 'Vibe≈'] },
          options: [
            { id: 'historic-hall', name: 'Historic Hall', priceCents: 1_500_000, tags: ['historic'], reasons: ['Availability↑'] },
            { id: 'riverside-pavilion', name: 'Riverside Pavilion', priceCents: 1_000_000, tags: ['modern'], reasons: ['Price↓'] },
          ],
          deltaCents: 0,
        },
      ],
    }
    fallback.totalCents = fallback.decisions.reduce((a, d) => a + d.selected.priceCents, 0)
    return NextResponse.json(fallback)
  }
}
