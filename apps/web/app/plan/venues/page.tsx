import Link from 'next/link'
import { formatCents } from '@/lib/money'

export default async function PlanVenuesPage() {
  // Static demo venues reused from early preview
  const venues = [
    {
      id: 'garden-loft',
      name: 'Garden Loft',
      priceCents: 1_200_000,
      score: 92,
      reasons: ['Open layout', 'Great light'],
      tags: ['garden', 'modern'],
    },
    {
      id: 'historic-hall',
      name: 'Historic Hall',
      priceCents: 1_500_000,
      score: 86,
      reasons: ['Classic vibe', 'Central location'],
      tags: ['historic'],
    },
    {
      id: 'riverside-pavilion',
      name: 'Riverside Pavilion',
      priceCents: 1_000_000,
      score: 94,
      reasons: ['Waterfront', 'Rain plan'],
      tags: ['modern'],
    },
  ]

  async function tryInMyPlan(venueId: string) {
    'use server'
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/plan/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venue: venueId }),
    })
  }

  return (
    <div>
      <h1 className="font-serif text-2xl text-[--ink-900]">Venue options</h1>
      <p className="mt-1 text-[--ink-700]">Pick a venue to try in your plan. You can change this anytime.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {venues.map((v) => (
          <form key={v.id} action={tryInMyPlan.bind(null, v.id)} className="rounded-2xl border border-[--ink-200] p-4">
            <div className="aspect-video w-full rounded-xl bg-[--ink-100]" aria-label="Venue image" />
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <div className="font-medium text-[--ink-900]">{v.name}</div>
                <div className="text-sm text-[--ink-600]">Compatibility {v.score}%</div>
              </div>
              <div className="text-[--ink-900]">{formatCents(v.priceCents)}</div>
            </div>
            <ul className="mt-2 list-disc pl-5 text-sm text-[--ink-700]">
              {v.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between">
              <button className="rounded-full bg-[--ink-900] px-4 py-2 text-[--paper-50] hover:bg-[--ink-800] focus:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-600]">
                Try in my plan
              </button>
              <Link href="/plan" className="text-sm text-[--ink-700] underline">
                Back to plan
              </Link>
            </div>
          </form>
        ))}
      </div>
    </div>
  )
}

