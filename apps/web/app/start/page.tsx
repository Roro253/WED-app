"use client"
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { withFees } from '@/lib/money'

type StepKey =
  | 'welcome'
  | 'budget'
  | 'guests'
  | 'dates'
  | 'location'
  | 'vibe'
  | 'formality'
  | 'priorities'
  | 'culture'
  | 'musts'
  | 'review'

type Answers = {
  who: 'couple' | 'proxy' | 'parent' | 'other'
  stage: 'new' | 'shortlist' | 'some_vendors' | 'most_booked'
  budget: number
  budgetFlex: 'under_only' | 'plus5' | 'plus10'
  guests: number
  kidsPets: ('kids' | 'pets')[]
  dateMonth?: number
  dateFlex: 'fixed' | 'window' | 'flex'
  ceremonyTime: 'day' | 'sunset' | 'evening'
  regions: ('sf' | 'eastbay' | 'northbay' | 'peninsula' | 'any')[]
  shuttle?: boolean
  hotelBlock?: boolean
  vibe: ('garden' | 'industrial' | 'historic' | 'modern' | 'coastal' | 'rustic' | 'glam' | 'boho')[]
  palette: 'neutral' | 'earth' | 'pastel' | 'jewel' | 'blacktie'
  formality: 'casual' | 'semi' | 'blacktie'
  layout: 'full' | 'cocktail' | 'ceremony_only' | 'reception_only'
  seating: 'rounds' | 'long' | 'mixed'
  rainPlan: 'indoor' | 'tent' | 'outdoor'
  priorities: ('venue' | 'photo' | 'food' | 'music' | 'flowers' | 'logistics' | 'budget' | 'guest' | 'culture')[]
  optimize: 'budget' | 'venue' | 'quality'
  traditions: string[]
  accessibility: string[]
  musts: string
  nogos: string
  mustChips?: string[]
  nogoChips?: string[]
}

const defaultAnswers: Answers = {
  who: 'couple',
  stage: 'new',
  budget: 27500,
  budgetFlex: 'under_only',
  guests: 100,
  kidsPets: [],
  dateMonth: undefined,
  dateFlex: 'window',
  ceremonyTime: 'sunset',
  regions: ['sf'],
  shuttle: false,
  hotelBlock: false,
  vibe: [],
  palette: 'neutral',
  formality: 'semi',
  layout: 'full',
  seating: 'rounds',
  rainPlan: 'indoor',
  priorities: [],
  optimize: 'budget',
  traditions: [],
  accessibility: [],
  musts: '',
  nogos: '',
  mustChips: [],
  nogoChips: [],
}

export default function StartPreferencesPage() {
  const [step, setStep] = useState<StepKey>('welcome')
  const [answers, setAnswers] = useState<Answers>(defaultAnswers)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const saveTimer = useRef<NodeJS.Timeout | null>(null)

  // Live redline update to plan (debounced)
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      fetch('/api/plan/redline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redlineCents: Math.round(answers.budget * 100) }),
      }).catch(() => {})
    }, 250)
  }, [answers.budget])

  const baseline = useMemo(() => {
    const fixed = 15000
    const perGuest = answers.formality === 'blacktie' ? 260 : answers.formality === 'semi' ? 200 : 160
    return fixed + answers.guests * perGuest
  }, [answers.guests, answers.formality])

  const fees = withFees({ subtotal: baseline, taxPct: 0.09, servicePct: 0.1, gratuityPct: 0.15 })

  function next() {
    const order: StepKey[] = ['welcome', 'budget', 'guests', 'dates', 'location', 'vibe', 'formality', 'priorities', 'culture', 'musts', 'review']
    const idx = order.indexOf(step)
    setStep(order[Math.min(order.length - 1, idx + 1)])
  }
  function back() {
    const order: StepKey[] = ['welcome', 'budget', 'guests', 'dates', 'location', 'vibe', 'formality', 'priorities', 'culture', 'musts', 'review']
    const idx = order.indexOf(step)
    setStep(order[Math.max(0, idx - 1)])
  }

  async function submit() {
    setSubmitting(true)
    const res = await fetch('/api/quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId: 'onboarding-v1', answers }),
    })
    setSubmitting(false)
    if (res.ok) router.push('/plan')
  }

  function Chip({ active, onClick, children, ariaLabel }: { active: boolean; onClick: () => void; children: React.ReactNode; ariaLabel?: string }) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        aria-pressed={active}
        className={`rounded-full px-3 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-600] ${
          active ? 'bg-[--ink-900] text-[--paper-50]' : 'border border-[--ink-300] text-[--ink-800]'
        }`}
      >
        {children}
      </button>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* HUD: Budget Bar & Baseline estimate */}
      <div className="sticky top-14 z-10 rounded-2xl border border-[--ink-200] bg-[--paper-50]/80 p-4 backdrop-blur">
        <div className="flex items-center justify-between text-sm text-[--ink-700]">
          <div>Redline</div>
          <div>${Math.round(answers.budget / 1_000)}k</div>
        </div>
        <input
          type="range"
          min={10000}
          max={100000}
          step={500}
          value={answers.budget}
          onChange={(e) => setAnswers((a) => ({ ...a, budget: parseInt(e.target.value) }))}
          aria-label="Budget redline"
          className="mt-2 w-full"
        />
        <div className="mt-2 flex items-center justify-between text-xs text-[--ink-700]">
          <div>Baseline est. total</div>
          <div>${Math.round(fees.total / 1000)}k</div>
        </div>
      </div>

      {/* Steps */}
      {step === 'welcome' && (
        <section className="mt-6">
          <h1 className="font-serif text-2xl text-[--ink-900]">Welcome — we’ll do the heavy lifting.</h1>
          <p className="mt-1 text-[--ink-700]">You approve the big moments. Skip anytime — we can guess for now.</p>
          <div className="mt-6 space-y-6">
            <div>
              <div className="mb-2 text-sm text-[--ink-700]">Who’s planning?</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { k: 'couple', label: 'Couple' },
                  { k: 'proxy', label: 'Planner friend' },
                  { k: 'parent', label: 'Parent/Guardian' },
                  { k: 'other', label: 'Other' },
                ].map((c) => (
                  <Chip key={c.k} active={answers.who === (c.k as any)} onClick={() => setAnswers((a) => ({ ...a, who: c.k as any }))}>
                    {c.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 text-sm text-[--ink-700]">How far along are you?</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { k: 'new', label: 'Just starting' },
                  { k: 'shortlist', label: 'Shortlist venues' },
                  { k: 'some_vendors', label: 'Some vendors booked' },
                  { k: 'most_booked', label: 'Most things booked' },
                ].map((c) => (
                  <Chip key={c.k} active={answers.stage === (c.k as any)} onClick={() => setAnswers((a) => ({ ...a, stage: c.k as any }))}>
                    {c.label}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3">
            <button onClick={next} className="rounded-full bg-[--ink-900] px-5 py-2 text-[--paper-50]">Start</button>
          </div>
        </section>
      )}

      {step === 'budget' && (
        <section className="mt-6">
          <h2 className="font-serif text-xl text-[--ink-900]">Budget Redline</h2>
          <p className="mt-1 text-sm text-[--ink-700]">We’ll protect this number and warn before anything exceeds it.</p>
          <div className="mt-6">
            <div className="mb-2 text-sm text-[--ink-700]">Flexibility</div>
            <div className="flex flex-wrap gap-2">
              {[
                { k: 'under_only', label: 'Keep me under' },
                { k: 'plus5', label: 'Up to +5% okay' },
                { k: 'plus10', label: 'Up to +10% okay' },
              ].map((c) => (
                <Chip key={c.k} active={answers.budgetFlex === (c.k as any)} onClick={() => setAnswers((a) => ({ ...a, budgetFlex: c.k as any }))}>
                  {c.label}
                </Chip>
              ))}
            </div>
          </div>
          <div className="mt-8 flex justify-between">
            <button onClick={back} className="rounded-full border border-[--ink-300] px-4 py-2">Back</button>
            <div className="flex gap-2">
              <button onClick={next} className="rounded-full border border-[--ink-300] px-4 py-2">Skip</button>
              <button onClick={next} className="rounded-full bg-[--ink-900] px-5 py-2 text-[--paper-50]">Next</button>
            </div>
          </div>
        </section>
      )}

      {step === 'guests' && (
        <section className="mt-6">
          <h2 className="font-serif text-xl text-[--ink-900]">Guests</h2>
          <div className="mt-4">
            <div className="mb-2 text-sm text-[--ink-700]">Estimated count</div>
            <div className="flex items-center gap-2">
              <button className="rounded-full border border-[--ink-300] px-3 py-1" onClick={() => setAnswers((a) => ({ ...a, guests: Math.max(10, a.guests - 10) }))} aria-label="Decrease guests">-</button>
              <div className="w-16 text-center text-[--ink-900]">{answers.guests}</div>
              <button className="rounded-full border border-[--ink-300] px-3 py-1" onClick={() => setAnswers((a) => ({ ...a, guests: Math.min(300, a.guests + 10) }))} aria-label="Increase guests">+</button>
              <div className="ml-3 flex gap-2">
                {[50, 100, 150, 200].map((n) => (
                  <Chip key={n} active={answers.guests === n} onClick={() => setAnswers((a) => ({ ...a, guests: n }))}>{n}</Chip>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-2 text-sm text-[--ink-700]">Kids & pets?</div>
            <div className="flex gap-2">
              <Chip
                active={answers.kidsPets.includes('kids')}
                onClick={() => setAnswers((a) => ({ ...a, kidsPets: a.kidsPets.includes('kids') ? a.kidsPets.filter((x) => x !== 'kids') : [...a.kidsPets, 'kids'] }))}
              >
                Kids attending
              </Chip>
              <Chip
                active={answers.kidsPets.includes('pets')}
                onClick={() => setAnswers((a) => ({ ...a, kidsPets: a.kidsPets.includes('pets') ? a.kidsPets.filter((x) => x !== 'pets') : [...a.kidsPets, 'pets'] }))}
              >
                Pets in ceremony
              </Chip>
            </div>
          </div>
          <div className="mt-8 flex justify-between">
            <button onClick={back} className="rounded-full border border-[--ink-300] px-4 py-2">Back</button>
            <div className="flex gap-2">
              <button onClick={next} className="rounded-full border border-[--ink-300] px-4 py-2">Skip</button>
              <button onClick={next} className="rounded-full bg-[--ink-900] px-5 py-2 text-[--paper-50]">Next</button>
            </div>
          </div>
        </section>
      )}

      {step === 'dates' && (
        <section className="mt-6">
          <h2 className="font-serif text-xl text-[--ink-900]">Dates & flexibility</h2>
          <div className="mt-4">
            <div className="mb-2 text-sm text-[--ink-700]">Ideal month</div>
            <div className="flex flex-wrap gap-2">
              {[1, 4, 7, 10].map((m) => (
                <Chip key={m} active={answers.dateMonth === m} onClick={() => setAnswers((a) => ({ ...a, dateMonth: m }))}>{`Q${((m - 1) / 3 + 1) | 0}`}</Chip>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-2 text-sm text-[--ink-700]">Flexibility</div>
            <div className="flex gap-2">
              {(['fixed', 'window', 'flex'] as const).map((v) => (
                <Chip key={v} active={answers.dateFlex === v} onClick={() => setAnswers((a) => ({ ...a, dateFlex: v }))}>
                  {v === 'window' ? 'Date window' : v === 'flex' ? 'Weekday/weekend flexible' : 'Fixed date'}
                </Chip>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-2 text-sm text-[--ink-700]">Ceremony start</div>
            <div className="flex gap-2">
              {(['day', 'sunset', 'evening'] as const).map((v) => (
                <Chip key={v} active={answers.ceremonyTime === v} onClick={() => setAnswers((a) => ({ ...a, ceremonyTime: v }))}>
                  {v === 'day' ? 'Daytime' : v === 'sunset' ? 'Sunset' : 'Evening'}
                </Chip>
              ))}
            </div>
          </div>
          <div className="mt-8 flex justify-between">
            <button onClick={back} className="rounded-full border border-[--ink-300] px-4 py-2">Back</button>
            <div className="flex gap-2">
              <button onClick={next} className="rounded-full border border-[--ink-300] px-4 py-2">Skip</button>
              <button onClick={next} className="rounded-full bg-[--ink-900] px-5 py-2 text-[--paper-50]">Next</button>
            </div>
          </div>
        </section>
      )}

      {step === 'location' && (
        <section className="mt-6">
          <h2 className="font-serif text-xl text-[--ink-900]">Location radius</h2>
          <div className="mt-4">
            <div className="mb-2 text-sm text-[--ink-700]">Where should we focus?</div>
            <div className="flex flex-wrap gap-2">
              {[
                { k: 'sf', label: 'San Francisco' },
                { k: 'eastbay', label: 'East Bay' },
                { k: 'northbay', label: 'North Bay' },
                { k: 'peninsula', label: 'Peninsula/South Bay' },
                { k: 'any', label: 'Open to anywhere nearby' },
              ].map((r) => (
                <Chip
                  key={r.k}
                  active={answers.regions.includes(r.k as any)}
                  onClick={() =>
                    setAnswers((a) => ({
                      ...a,
                      regions: a.regions.includes(r.k as any) ? a.regions.filter((x) => x !== (r.k as any)) : [...a.regions, r.k as any],
                    }))
                  }
                >
                  {r.label}
                </Chip>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-2 text-sm text-[--ink-700]">Travel & lodging</div>
            <div className="flex gap-2">
              <Chip active={!!answers.shuttle} onClick={() => setAnswers((a) => ({ ...a, shuttle: !a.shuttle }))}>Shuttle/transport</Chip>
              <Chip active={!!answers.hotelBlock} onClick={() => setAnswers((a) => ({ ...a, hotelBlock: !a.hotelBlock }))}>Hotel block</Chip>
            </div>
          </div>
          <div className="mt-8 flex justify-between">
            <button onClick={back} className="rounded-full border border-[--ink-300] px-4 py-2">Back</button>
            <div className="flex gap-2">
              <button onClick={next} className="rounded-full border border-[--ink-300] px-4 py-2">Skip</button>
              <button onClick={next} className="rounded-full bg-[--ink-900] px-5 py-2 text-[--paper-50]">Next</button>
            </div>
          </div>
        </section>
      )}

      {step === 'vibe' && (
        <section className="mt-6">
          <h2 className="font-serif text-xl text-[--ink-900]">Vibe & atmosphere</h2>
          <div className="mt-4">
            <div className="mb-2 text-sm text-[--ink-700]">Choose up to 3</div>
            <div className="flex flex-wrap gap-2">
              {(['garden', 'industrial', 'historic', 'modern', 'coastal', 'rustic', 'glam', 'boho'] as const).map((v) => (
                <Chip
                  key={v}
                  active={answers.vibe.includes(v)}
                  onClick={() =>
                    setAnswers((a) => ({
                      ...a,
                      vibe: a.vibe.includes(v) ? a.vibe.filter((x) => x !== v) : a.vibe.length < 3 ? [...a.vibe, v] : a.vibe,
                    }))
                  }
                >
                  {v}
                </Chip>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-2 text-sm text-[--ink-700]">Color palette</div>
            <div className="flex flex-wrap gap-2">
              {(['neutral', 'earth', 'pastel', 'jewel', 'blacktie'] as const).map((p) => (
                <Chip key={p} active={answers.palette === p} onClick={() => setAnswers((a) => ({ ...a, palette: p }))}>
                  {p}
                </Chip>
              ))}
            </div>
          </div>
          <div className="mt-8 flex justify-between">
            <button onClick={back} className="rounded-full border border-[--ink-300] px-4 py-2">Back</button>
            <div className="flex gap-2">
              <button onClick={next} className="rounded-full border border-[--ink-300] px-4 py-2">Skip</button>
              <button onClick={next} className="rounded-full bg-[--ink-900] px-5 py-2 text-[--paper-50]">Next</button>
            </div>
          </div>
        </section>
      )}

      {step === 'formality' && (
        <section className="mt-6">
          <h2 className="font-serif text-xl text-[--ink-900]">Formality & layout</h2>
          <div className="mt-4">
            <div className="mb-2 text-sm text-[--ink-700]">Formality</div>
            <div className="flex gap-2">
              {(['casual', 'semi', 'blacktie'] as const).map((f) => (
                <Chip key={f} active={answers.formality === f} onClick={() => setAnswers((a) => ({ ...a, formality: f }))}>
                  {f === 'semi' ? 'Semi-formal' : f === 'blacktie' ? 'Black-tie' : 'Casual'}
                </Chip>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-2 text-sm text-[--ink-700]">Ceremony + reception layout</div>
            <div className="flex flex-wrap gap-2">
              {([
                { k: 'full', l: 'Ceremony + seated dinner + dancing' },
                { k: 'cocktail', l: 'Ceremony + cocktail-style reception' },
                { k: 'ceremony_only', l: 'Ceremony only' },
                { k: 'reception_only', l: 'Reception only' },
              ] as const).map((o) => (
                <Chip key={o.k} active={answers.layout === o.k} onClick={() => setAnswers((a) => ({ ...a, layout: o.k }))}>
                  {o.l}
                </Chip>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-2 text-sm text-[--ink-700]">Seating style</div>
            <div className="flex gap-2">
              {(['rounds', 'long', 'mixed'] as const).map((s) => (
                <Chip key={s} active={answers.seating === s} onClick={() => setAnswers((a) => ({ ...a, seating: s }))}>
                  {s === 'long' ? 'Long farm tables' : s === 'mixed' ? 'Mixed' : 'Rounds'}
                </Chip>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-2 text-sm text-[--ink-700]">Rain plan comfort</div>
            <div className="flex gap-2">
              {(['indoor', 'tent', 'outdoor'] as const).map((r) => (
                <Chip key={r} active={answers.rainPlan === r} onClick={() => setAnswers((a) => ({ ...a, rainPlan: r }))}>
                  {r === 'indoor' ? 'Prefer indoor backup' : r === 'tent' ? 'Tent okay' : 'Risk it for outdoor'}
                </Chip>
              ))}
            </div>
          </div>
          <div className="mt-8 flex justify-between">
            <button onClick={back} className="rounded-full border border-[--ink-300] px-4 py-2">Back</button>
            <div className="flex gap-2">
              <button onClick={next} className="rounded-full border border-[--ink-300] px-4 py-2">Skip</button>
              <button onClick={next} className="rounded-full bg-[--ink-900] px-5 py-2 text-[--paper-50]">Next</button>
            </div>
          </div>
        </section>
      )}

      {step === 'priorities' && (
        <section className="mt-6">
          <h2 className="font-serif text-xl text-[--ink-900]">Priorities (Top 3)</h2>
          <div className="mt-4">
            <div className="mb-2 text-sm text-[--ink-700]">Pick your top 3</div>
            <div className="flex flex-wrap gap-2">
              {(['venue', 'photo', 'food', 'music', 'flowers', 'logistics', 'budget', 'guest', 'culture'] as const).map((p) => (
                <Chip
                  key={p}
                  active={answers.priorities.includes(p)}
                  onClick={() =>
                    setAnswers((a) => ({
                      ...a,
                      priorities: a.priorities.includes(p) ? a.priorities.filter((x) => x !== p) : a.priorities.length < 3 ? [...a.priorities, p] : a.priorities,
                    }))
                  }
                >
                  {p}
                </Chip>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-2 text-sm text-[--ink-700]">If we need trade‑offs…</div>
            <div className="flex gap-2">
              {(['budget', 'venue', 'quality'] as const).map((o) => (
                <Chip key={o} active={answers.optimize === o} onClick={() => setAnswers((a) => ({ ...a, optimize: o }))}>
                  {o === 'budget' ? 'Stay under budget' : o === 'venue' ? 'Lock the venue/date' : 'Best vendor quality'}
                </Chip>
              ))}
            </div>
          </div>
          <div className="mt-8 flex justify-between">
            <button onClick={back} className="rounded-full border border-[--ink-300] px-4 py-2">Back</button>
            <div className="flex gap-2">
              <button onClick={next} className="rounded-full border border-[--ink-300] px-4 py-2">Skip</button>
              <button onClick={next} className="rounded-full bg-[--ink-900] px-5 py-2 text-[--paper-50]">Next</button>
            </div>
          </div>
        </section>
      )}

      {step === 'culture' && (
        <section className="mt-6">
          <h2 className="font-serif text-xl text-[--ink-900]">Cultural, religious, and accessibility</h2>
          <div className="mt-4">
            <div className="mb-2 text-sm text-[--ink-700]">Traditions</div>
            <div className="flex flex-wrap gap-2">
              {['jewish', 'hindu', 'tea', 'catholic', 'persian', 'korean', 'lgbtq', 'other', 'none'].map((t) => (
                <Chip
                  key={t}
                  active={answers.traditions.includes(t)}
                  onClick={() =>
                    setAnswers((a) => ({
                      ...a,
                      traditions: a.traditions.includes(t) ? a.traditions.filter((x) => x !== t) : [...a.traditions, t],
                    }))
                  }
                >
                  {t}
                </Chip>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-2 text-sm text-[--ink-700]">Accessibility & inclusion</div>
            <div className="flex flex-wrap gap-2">
              {['stepfree', 'asl', 'quiet', 'allgender', 'diet_vegan', 'diet_kosher', 'diet_halal', 'diet_allergies', 'lowscent'].map((a) => (
                <Chip
                  key={a}
                  active={answers.accessibility.includes(a)}
                  onClick={() =>
                    setAnswers((s) => ({
                      ...s,
                      accessibility: s.accessibility.includes(a) ? s.accessibility.filter((x) => x !== a) : [...s.accessibility, a],
                    }))
                  }
                >
                  {a.replace('diet_', 'diet: ')}
                </Chip>
              ))}
            </div>
          </div>
          <div className="mt-8 flex justify-between">
            <button onClick={back} className="rounded-full border border-[--ink-300] px-4 py-2">Back</button>
            <div className="flex gap-2">
              <button onClick={next} className="rounded-full border border-[--ink-300] px-4 py-2">Skip</button>
              <button onClick={next} className="rounded-full bg-[--ink-900] px-5 py-2 text-[--paper-50]">Next</button>
            </div>
          </div>
        </section>
      )}

      {step === 'musts' && (
        <section className="mt-6">
          <h2 className="font-serif text-xl text-[--ink-900]">Must‑haves / No‑gos</h2>
          <div className="mt-4">
            <div className="mb-2 text-sm text-[--ink-700]">Must‑haves</div>
            <div className="flex flex-wrap gap-2">
              {['band', 'goldenhour', 'champagne', 'sparkler', 'pets'].map((m) => (
                <Chip
                  key={m}
                  active={!!answers.mustChips && answers.mustChips.includes(m)}
                  onClick={() =>
                    setAnswers((a) => ({
                      ...a,
                      mustChips: a.mustChips?.includes(m) ? a.mustChips?.filter((x) => x !== m) : [...(a.mustChips || []), m],
                    }))
                  }
                >
                  {m === 'band' ? 'Live band' : m === 'goldenhour' ? 'Golden hour photos' : m === 'champagne' ? 'Champagne tower' : m === 'sparkler' ? 'Sparkler exit' : 'Pets in ceremony'}
                </Chip>
              ))}
            </div>
            <input
              aria-label="Must‑haves"
              className="mt-2 w-full rounded-xl border border-[--ink-300] p-2"
              placeholder="Short notes"
              value={answers.musts}
              onChange={(e) => setAnswers((a) => ({ ...a, musts: e.target.value }))}
            />
          </div>
          <div className="mt-4">
            <div className="mb-2 text-sm text-[--ink-700]">Hard no‑gos</div>
            <div className="flex flex-wrap gap-2">
              {['no_church', 'no_assigned', 'no_kids_after_8', 'no_loud_djs', 'no_foam'].map((n) => (
                <Chip
                  key={n}
                  active={!!answers.nogoChips && answers.nogoChips.includes(n)}
                  onClick={() =>
                    setAnswers((a) => ({
                      ...a,
                      nogoChips: a.nogoChips?.includes(n) ? a.nogoChips?.filter((x) => x !== n) : [...(a.nogoChips || []), n],
                    }))
                  }
                >
                  {n.replaceAll('_', ' ')}
                </Chip>
              ))}
            </div>
            <input
              aria-label="No‑gos"
              className="mt-2 w-full rounded-xl border border-[--ink-300] p-2"
              placeholder="Short notes"
              value={answers.nogos}
              onChange={(e) => setAnswers((a) => ({ ...a, nogos: e.target.value }))}
            />
          </div>
          <div className="mt-8 flex justify-between">
            <button onClick={back} className="rounded-full border border-[--ink-300] px-4 py-2">Back</button>
            <div className="flex gap-2">
              <button onClick={next} className="rounded-full border border-[--ink-300] px-4 py-2">Skip</button>
              <button onClick={next} className="rounded-full bg-[--ink-900] px-5 py-2 text-[--paper-50]">Next</button>
            </div>
          </div>
        </section>
      )}

      {step === 'review' && (
        <section className="mt-6">
          <h2 className="font-serif text-xl text-[--ink-900]">Review & consent</h2>
          <div className="mt-4 rounded-2xl border border-[--ink-200] p-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Budget redline</div>
              <div className="text-right">${Math.round(answers.budget / 1000)}k</div>
              <div>Guests</div>
              <div className="text-right">{answers.guests}</div>
              <div>Date flex</div>
              <div className="text-right">{answers.dateFlex}</div>
              <div>Regions</div>
              <div className="text-right">{answers.regions.join(', ')}</div>
              <div>Vibes</div>
              <div className="text-right">{answers.vibe.join(', ') || '—'}</div>
              <div>Top priorities</div>
              <div className="text-right">{answers.priorities.join(', ') || '—'}</div>
            </div>
            <p className="mt-3 text-xs text-[--ink-600]">Consent: Use my answers to generate a Plan Preview and soft‑hold vendors.</p>
          </div>
          <div className="mt-6 flex justify-between">
            <button onClick={back} className="rounded-full border border-[--ink-300] px-4 py-2">Back</button>
            <button onClick={submit} disabled={submitting} className="rounded-full bg-[--ink-900] px-5 py-2 text-[--paper-50] disabled:opacity-50">
              Generate my 5‑minute preview
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
