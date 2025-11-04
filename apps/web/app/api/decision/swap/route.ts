import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const { itemId, option } = (await req.json()) as { itemId: string; option: any }
  try {
    const item = await prisma.decisionItem.findUnique({ where: { id: itemId } })
    if (!item) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
    // Replace selected with the provided option and move previous selected into options
    const prevSelected = JSON.parse(item.selected as unknown as string)
    const options = JSON.parse(item.options as unknown as string) as any[]
    // add prev to options if not already present
    const updatedOptions = [prevSelected, ...options.filter((o) => o.id !== option.id)]
    await prisma.decisionItem.update({
      where: { id: itemId },
      data: { selected: JSON.stringify(option), options: JSON.stringify(updatedOptions), status: 'swapped' },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'swap_failed' }, { status: 500 })
  }
}

