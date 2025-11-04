import Link from 'next/link'

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="mt-6 grid items-center gap-8 md:grid-cols-2">
        <div>
          <h1 className="font-serif text-3xl text-[--ink-900]">A planner‑grade wedding plan—built by AI, approved by you.</h1>
          <p className="mt-3 text-lg text-[--ink-700]">We draft the full plan to your style and budget. You approve, swap, and book.</p>
          <div className="mt-6 flex gap-3">
            <Link href="/start" className="rounded-full bg-[--ink-900] px-5 py-2 text-[--paper-50] hover:bg-[--ink-800]">Start planning</Link>
            <Link href="/vendors" className="rounded-full border border-[--ink-300] px-5 py-2 text-[--ink-900] hover:bg-[--paper-100]">Explore venues</Link>
          </div>
        </div>
        <div className="aspect-video w-full rounded-2xl bg-[--ink-100]" aria-label="Hero visual" />
      </section>

      <section>
        <h2 className="mb-4 font-serif text-2xl text-[--ink-900]">How it works</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { t: 'Onboard', d: 'Share vibe, budget, and constraints.' },
            { t: 'Draft Plan', d: 'We assemble your core team.' },
            { t: 'Approve/Swap', d: 'Lock picks or explore alternates.' },
            { t: 'Book', d: 'We finalize details and timing.' },
          ].map((s) => (
            <div key={s.t} className="rounded-2xl border border-[--ink-200] p-4">
              <div className="font-medium text-[--ink-900]">{s.t}</div>
              <p className="mt-1 text-sm text-[--ink-700]">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="reviews">
        <h2 className="mb-4 font-serif text-2xl text-[--ink-900]">Couples love calm planning</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {['“It felt like a planner.”','“Approvals were so easy.”','“We stayed on budget.”'].map((q, i) => (
            <div key={i} className="rounded-2xl border border-[--ink-200] p-4 text-[--ink-800]">{q}</div>
          ))}
        </div>
      </section>
    </div>
  )
}
