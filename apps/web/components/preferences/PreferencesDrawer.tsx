"use client"
import { useEffect, useRef, useState } from 'react'

export default function PreferencesDrawer({ onClose }: { onClose: () => void }) {
  const [budget, setBudget] = useState(27500)
  const [guests, setGuests] = useState(100)
  const [vibe, setVibe] = useState<string[]>([])
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const saveTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Prefill from plan
    ;(async () => {
      const res = await fetch('/api/plan', { cache: 'no-store' })
      const data = await res.json()
      const sum = data?.plan?.summary || {}
      if (data?.plan?.redlineCents) setBudget(Math.round(data.plan.redlineCents / 100))
      if (sum?.guests) setGuests(sum.guests)
      if (Array.isArray(sum?.vibe)) setVibe(sum.vibe)
    })()
  }, [])

  function toggleVibe(t: string) {
    setVibe((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : prev.length < 3 ? [...prev, t] : prev))
  }

  async function save() {
    try {
      setSaving('saving')
      const answers = { budget, guests, vibe }
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: 'onboarding-v1', answers }),
      })
      setSaving(res.ok ? 'saved' : 'error')
      setTimeout(() => setSaving('idle'), 1200)
    } catch {
      setSaving('error')
      setTimeout(() => setSaving('idle'), 1500)
    }
  }

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(save, 350)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budget, guests, vibe])

  return (
    <div role="dialog" aria-modal="true" aria-label="Preferences" className="fixed inset-0 z-50 grid grid-cols-[1fr,360px] bg-black/30">
      <div onClick={onClose} aria-hidden />
      <div className="h-full overflow-auto border-l border-[--ink-200] bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-[--ink-900]">Preferences</h2>
          <button onClick={onClose} className="rounded-full border border-[--ink-300] px-3 py-1 text-sm text-[--ink-900] hover:bg-[--paper-100]">Close</button>
        </div>

        <div className="mt-5 space-y-5">
          <div>
            <label className="block text-sm text-[--ink-700]">Budget redline</label>
            <div className="mt-2 flex items-center gap-3">
              <input type="range" min={10000} max={100000} step={500} value={budget} onChange={(e) => setBudget(parseInt(e.target.value))} className="w-full" aria-label="Budget slider" />
              <div className="w-20 text-right text-sm text-[--ink-900]">${Math.round(budget / 1000)}k</div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[--ink-700]">Guests</label>
            <div className="mt-2 flex items-center gap-2">
              <button className="rounded-full border border-[--ink-300] px-3 py-1" onClick={() => setGuests((g) => Math.max(10, g - 10))} aria-label="Decrease guests">-</button>
              <div className="w-16 text-center text-[--ink-900]">{guests}</div>
              <button className="rounded-full border border-[--ink-300] px-3 py-1" onClick={() => setGuests((g) => Math.min(300, g + 10))} aria-label="Increase guests">+</button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[--ink-700]">Vibe (up to 3)</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {['garden', 'industrial', 'historic', 'modern', 'coastal', 'rustic', 'glam', 'boho'].map((t) => (
                <button
                  key={t}
                  onClick={() => toggleVibe(t)}
                  aria-pressed={vibe.includes(t)}
                  className={`rounded-full px-3 py-1 text-sm ${vibe.includes(t) ? 'bg-[--ink-900] text-[--paper-50]' : 'border border-[--ink-300] text-[--ink-800]'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div aria-live="polite" className="text-xs text-[--ink-700]">
            {saving === 'saving' && 'Saving…'}
            {saving === 'saved' && 'Saved'}
            {saving === 'error' && 'Network error — retrying'}
          </div>
        </div>
      </div>
    </div>
  )
}

