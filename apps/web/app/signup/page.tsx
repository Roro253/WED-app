import Link from 'next/link'

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-serif text-2xl text-[--ink-900]">Create your account</h1>
      <p className="mt-2 text-[--ink-700]">Email + password and OAuth sign‑in — coming soon.</p>

      <div className="mt-6 space-y-3 rounded-2xl border border-[--ink-200] p-4">
        <label className="block text-sm text-[--ink-700]">Email</label>
        <input className="w-full rounded-xl border border-[--ink-300] p-2" placeholder="you@example.com" disabled aria-disabled />
        <label className="mt-3 block text-sm text-[--ink-700]">Password</label>
        <input className="w-full rounded-xl border border-[--ink-300] p-2" type="password" placeholder="••••••••" disabled aria-disabled />
        <button className="mt-4 w-full cursor-not-allowed rounded-full bg-[--ink-900] px-5 py-2 text-[--paper-50] opacity-60" aria-disabled>
          Sign up (coming soon)
        </button>
        <p className="mt-2 text-xs text-[--ink-700]">We’ll add email verification and OAuth here once keys are connected.</p>
      </div>

      <div className="mt-4 text-sm text-[--ink-700]">
        Already have an account? <Link href="/login" className="underline">Log in</Link>
      </div>

      <div className="mt-6 rounded-xl border border-[--ink-200] p-4 text-sm text-[--ink-800]">
        Just exploring? <Link href="/start" className="underline">Continue without an account</Link>
      </div>
    </div>
  )
}

