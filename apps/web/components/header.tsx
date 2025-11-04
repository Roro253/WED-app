"use client"
import Link from 'next/link'

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[--ink-100] bg-[--paper-50]/80 backdrop-blur supports-[backdrop-filter]:bg-[--paper-50]/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4">
        <Link href="/" className="font-serif text-lg text-[--ink-900]" aria-label="Autopilot home">
          autopilot
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-[--ink-700] md:flex">
          <Link href="/about" className="hover:underline">How it works</Link>
          <Link href="/pricing" className="hover:underline">Pricing</Link>
          <Link href="/vendors" className="hover:underline">Explore venues</Link>
          <a href="/#reviews" className="hover:underline">Reviews</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/signup?next=/start" className="rounded-full bg-[--ink-900] px-4 py-1.5 text-[--paper-50] hover:bg-[--ink-800]" aria-label="Start planning">
            Start planning
          </Link>
        </div>
      </div>
    </header>
  )
}
