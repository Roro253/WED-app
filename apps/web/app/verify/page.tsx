import Link from 'next/link'

export default function VerifyPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-serif text-2xl text-[--ink-900]">Check your email</h1>
      <p className="mt-2 text-[--ink-700]">Email verification is coming soon. We’ll send a link once email provider keys are connected.</p>

      <div className="mt-6 rounded-2xl border border-[--ink-200] p-4 text-[--ink-800]">
        For now, you can <Link href="/start" className="underline">continue to Preferences</Link> or return <Link href="/" className="underline">home</Link>.
      </div>
    </div>
  )
}

