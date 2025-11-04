export default function Footer() {
  return (
    <footer className="mt-16 border-t border-[--ink-100] bg-[--paper-50] py-10">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 text-sm text-[--ink-700] md:grid-cols-4">
        <div>
          <div className="font-medium text-[--ink-900]">Autopilot</div>
          <p className="mt-2">Your wedding, auto‑planned. You approve.</p>
        </div>
        <div>
          <div className="font-medium text-[--ink-900]">Company</div>
          <ul className="mt-2 space-y-1">
            <li><a href="/about" className="hover:underline">How it works</a></li>
            <li><a href="/pricing" className="hover:underline">Pricing</a></li>
          </ul>
        </div>
        <div>
          <div className="font-medium text-[--ink-900]">Support</div>
          <ul className="mt-2 space-y-1">
            <li><a href="#" aria-disabled className="opacity-70">FAQ (coming)</a></li>
            <li><a href="#" aria-disabled className="opacity-70">Contact</a></li>
          </ul>
        </div>
        <div>
          <div className="font-medium text-[--ink-900]">Legal</div>
          <ul className="mt-2 space-y-1">
            <li><a href="#" aria-disabled className="opacity-70">Terms</a></li>
            <li><a href="#" aria-disabled className="opacity-70">Privacy</a></li>
          </ul>
        </div>
      </div>
    </footer>
  )
}

