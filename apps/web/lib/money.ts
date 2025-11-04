export function formatCents(cents: number, opts: Intl.NumberFormatOptions = {}) {
  const dollars = cents / 100
  return dollars.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    ...opts,
  })
}

export function sumCents(values: number[]) {
  return values.reduce((a, b) => a + b, 0)
}

export function withFees(params: {
  subtotal: number
  taxPct: number
  servicePct: number
  gratuityPct: number
}) {
  const { subtotal, taxPct, servicePct, gratuityPct } = params
  const tax = Math.round(subtotal * taxPct)
  const service = Math.round(subtotal * servicePct)
  const gratuity = Math.round(subtotal * gratuityPct)
  const total = subtotal + tax + service + gratuity
  return { subtotal, tax, service, gratuity, total }
}

