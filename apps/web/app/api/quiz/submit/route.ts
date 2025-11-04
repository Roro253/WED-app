import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

function seasonFromMonth(m?: number) {
  if (m == null) return undefined
  // Jan=1
  if ([3, 4, 5].includes(m)) return 'spring'
  if ([6, 7, 8].includes(m)) return 'summer'
  if ([9, 10, 11].includes(m)) return 'fall'
  return 'winter'
}

export async function POST(req: Request) {
  const uid = (await cookies()).get('uid')?.value || 'dev-user'
  const { quizId, answers } = (await req.json()) as { quizId: string; answers: any }
  try {
    const tags: string[] = []

    // Who / Stage
    if (answers?.who) tags.push(answers.who === 'couple' ? 'planner_self' : 'planner_proxy')
    if (answers?.stage) tags.push(answers.stage === 'new' ? 'stage_new' : 'stage_partial')

    // Budget bands
    const budget = Number(answers?.budget ?? 27500)
    if (budget < 20000) tags.push('budget_10k_20k')
    else if (budget < 30000) tags.push('budget_20k_30k')
    else if (budget < 50000) tags.push('budget_30k_50k')
    else tags.push('budget_50k_plus')

    // Budget flexibility
    if (answers?.budgetFlex === 'under_only') tags.push('under_only')
    if (answers?.budgetFlex === 'plus5') tags.push('redline_plus5')
    if (answers?.budgetFlex === 'plus10') tags.push('redline_plus10')

    // Guests
    const guests = Number(answers?.guests ?? 100)
    if (guests <= 50) tags.push('guests_<=50')
    else if (guests <= 100) tags.push('guests_51_100')
    else if (guests <= 150) tags.push('guests_101_150')
    else if (guests <= 200) tags.push('guests_151_200')
    else tags.push('guests_200_plus')
    if (answers?.kidsPets?.includes?.('kids')) tags.push('kids_yes')
    if (answers?.kidsPets?.includes?.('pets')) tags.push('pets_yes')

    // Dates & Flexibility
    const month = Number(answers?.dateMonth)
    const season = seasonFromMonth(month)
    if (season) tags.push(`season_${season}`)
    if (answers?.dateFlex) tags.push(`date_${answers.dateFlex}`)
    if (answers?.ceremonyTime) tags.push(`ceremony_${answers.ceremonyTime}`)

    // Regions
    const regions: string[] = answers?.regions ?? []
    for (const r of regions) tags.push(`region_${r}`)
    if (answers?.shuttle) tags.push('needs_shuttle')
    if (answers?.hotelBlock) tags.push('needs_hotel_block')

    // Vibe & palette
    const vibe: string[] = answers?.vibe ?? []
    for (const v of vibe) tags.push(`vibe_${v}`)
    if (answers?.palette) tags.push(`palette_${answers.palette}`)

    // Formality & layout
    if (answers?.formality) tags.push(`formality_${answers.formality}`)
    if (answers?.layout) tags.push(`layout_${answers.layout}`)
    if (answers?.seating) tags.push(`seating_${answers.seating}`)
    if (answers?.rainPlan) tags.push(`rain_${answers.rainPlan}`)

    // Priorities & optimize
    const priorities: string[] = answers?.priorities ?? []
    for (const p of priorities) tags.push(`prio_${p}`)
    if (answers?.optimize) tags.push(`opt_${answers.optimize}`)

    // Traditions / a11y / diet
    const traditions: string[] = answers?.traditions ?? []
    for (const t of traditions) tags.push(`trad_${t}`)
    const a11y: string[] = answers?.accessibility ?? []
    for (const a of a11y) tags.push(a.startsWith('diet_') ? a : `a11y_${a}`)

    // Must / No-gos helper chips -> tags
    const mustChips: string[] = answers?.mustChips ?? []
    for (const m of mustChips) tags.push(`must_${m}`)
    const nogoChips: string[] = answers?.nogoChips ?? []
    for (const n of nogoChips) tags.push(`nogo_${n}`)

    // Persist response
    await prisma.quizResponse.create({
      data: {
        userId: uid,
        quizId,
        answers: JSON.stringify(answers),
        tags: JSON.stringify(tags),
      },
    })

    // Promote fields to Plan: redline, guests, regions; store rest in summary
    try {
      const plan = await prisma.plan.findFirst({ where: { userId: uid } })
      if (plan) {
        const summary = {
          guests,
          kidsPets: { kids: !!answers?.kidsPets?.includes?.('kids'), pets: !!answers?.kidsPets?.includes?.('pets') },
          date: { month, season, flex: answers?.dateFlex, ceremonyTime: answers?.ceremonyTime },
          regions,
          travel: { shuttle: !!answers?.shuttle, hotelBlock: !!answers?.hotelBlock },
          vibe,
          palette: answers?.palette,
          formality: answers?.formality,
          layout: answers?.layout,
          seating: answers?.seating,
          rainPlan: answers?.rainPlan,
          priorities,
          optimize: answers?.optimize,
          traditions,
          accessibility: a11y,
          mustHaves: answers?.musts ?? '',
          noGos: answers?.nogos ?? '',
          weights: {
            venue: 0.35,
            budget: 0.25,
            availability: 0.2,
            vibe: 0.15,
            logistics: 0.05,
          },
        }
        // bump weight for optimize choice
        if (answers?.optimize === 'budget') summary.weights.budget += 0.1
        if (answers?.optimize === 'venue') summary.weights.venue += 0.1
        if (answers?.optimize === 'quality') summary.weights.vibe += 0.1
        await prisma.plan.update({
          where: { id: plan.id },
          data: {
            redlineCents: Math.round(budget * 100),
            summary: JSON.stringify(summary),
          },
        })
      }
    } catch {}

    return NextResponse.json({ ok: true, tags })
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
