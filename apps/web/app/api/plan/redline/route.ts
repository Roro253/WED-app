import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  const uid = (await cookies()).get('uid')?.value || 'dev-user'
  const { redlineCents } = (await req.json()) as { redlineCents: number }
  try {
    let plan = await prisma.plan.findFirst({ where: { userId: uid } })
    if (!plan) {
      plan = await prisma.plan.create({ data: { userId: uid, redlineCents, totalCents: 0, status: 'preview', summary: '{}' } })
    } else {
      await prisma.plan.update({ where: { id: plan.id }, data: { redlineCents } })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    // allow demo to proceed without DB
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}

