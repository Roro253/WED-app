export default function VendorsPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl text-[--ink-900]">Explore venues</h1>
      <p className="mt-1 text-[--ink-700]">Browse a few featured options. Full browse is coming soon.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {['Garden Loft','Historic Hall','Riverside Pavilion'].map((n) => (
          <div key={n} className="rounded-2xl border border-[--ink-200] p-4">
            <div className="aspect-video w-full rounded-xl bg-[--ink-100]" aria-label="Venue image" />
            <div className="mt-3 font-medium text-[--ink-900]">{n}</div>
            <div className="text-sm text-[--ink-600]">Fit score 90–96%</div>
          </div>
        ))}
      </div>
    </div>
  )
}

