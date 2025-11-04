"use client"
import { formatCents } from '@/lib/money'

export function BudgetBar({ total, redline }: { total: number; redline: number }) {
  const pct = Math.min(100, Math.round((total / Math.max(1, redline)) * 100))
  const over = total > redline
  return (
    <div className="w-full" aria-label="Budget usage" role="group">
      <div className="flex items-center justify-between text-xs text-[--ink-600]">
        <div>Plan total</div>
        <div className={`${over ? 'text-[--accent-700]' : ''}`}>
          {formatCents(total)} / {formatCents(redline)}
        </div>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-[--ink-100]" aria-hidden>
        <div
          className={`h-2 rounded-full ${over ? 'bg-[--accent-600]' : 'bg-[--ink-800]'} transition-[width] duration-200`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

