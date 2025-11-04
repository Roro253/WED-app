import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-serif text-2xl text-[--ink-900]">Log in</h1>
      <p className="mt-2 text-[--ink-700]">Email/password and OAuth — coming soon.</p>

      <div className="mt-6 space-y-3 rounded-2xl border border-[--ink-200] p-4">
        <label className="block text-sm text-[--ink-700]">Email</label>
        <input className="w-full rounded-xl border border-[--ink-300] p-2" placeholder="you@example.com" disabled aria-disabled />
        <label className="mt-3 block text-sm text-[--ink-700]">Password</label>
        <input className="w-full rounded-xl border border-[--ink-300] p-2" type="password" placeholder="••••••••" disabled aria-disabled />
        <button className="mt-4 w-full cursor-not-allowed rounded-full bg-[--ink-900] px-5 py-2 text-[--paper-50] opacity-60" aria-disabled>
          Log in (coming soon)
        </button>
      </div>

      <div className="mt-4 text-sm text-[--ink-700]">
        New here? <Link href="/signup" className="underline">Create an account</Link>
      </div>

      <div className="mt-6 rounded-xl border border-[--ink-200] p-4 text-sm text-[--ink-800]">
        Just exploring? <Link href="/plan" className="underline">Go to your plan</Link>
      </div>
    </div>
  )
}

