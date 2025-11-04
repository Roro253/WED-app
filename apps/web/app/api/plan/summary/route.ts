import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  const uid = (await cookies()).get('uid')?.value || 'dev-user'
  const body = await req.json()
  try {
    const plan = await prisma.plan.findFirst({ where: { userId: uid } })
    if (!plan) return NextResponse.json({ ok: false }, { status: 404 })
    await prisma.plan.update({ where: { id: plan.id }, data: { summary: JSON.stringify(body) } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
