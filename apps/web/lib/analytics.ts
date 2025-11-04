export type EventName =
  | 'decision_opened'
  | 'decision_approved'
  | 'swap_opened'
  | 'swap_applied'
  | 'redline_intercepted'
  | 'optimize_to_budget'

export function track(event: EventName, payload: Record<string, any> = {}) {
  if (process.env.NEXT_PUBLIC_APP_ENV === 'dev') {
    // eslint-disable-next-line no-console
    console.log(`[event] ${event}`, payload)
  }
}

