import type { Metadata } from 'next'
import { Geist, Geist_Mono, Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { BudgetBar } from '@/components/BudgetBar'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })
const inter = Inter({ variable: '--font-inter', subsets: ['latin'] })
const playfair = Playfair_Display({ variable: '--font-playfair', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Autopilot — Wedding Plan',
  description: 'Luxe, calm, autonomous wedding planning',
}

async function getHeaderPlan() {
  try {
    const uid = (await cookies()).get('uid')?.value || 'dev-user'
    const plan = await prisma.plan.findFirst({ where: { userId: uid } })
    if (!plan) return null
    return { total: plan.totalCents, redline: plan.redlineCents }
  } catch {
    return null
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerPlan = await getHeaderPlan()
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${playfair.variable} antialiased`}> 
        <header className="sticky top-0 z-40 border-b border-[--ink-100] bg-[--paper-50]/80 backdrop-blur supports-[backdrop-filter]:bg-[--paper-50]/60">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-6 px-4">
            <Link href="/" className="font-serif text-lg text-[--ink-900]" aria-label="Autopilot home">
              autopilot
            </Link>
            <div className="hidden flex-1 md:block">
              {headerPlan ? (
                <BudgetBar total={headerPlan.total} redline={headerPlan.redline} />
              ) : (
                <div className="text-center text-sm text-[--ink-600]">Budget</div>
              )}
            </div>
            <nav className="flex items-center gap-4 text-sm text-[--ink-700]">
              <Link href="/plan" className="hover:underline">
                Plan
              </Link>
              <Link href="/quiz" className="hover:underline">
                Quiz
              </Link>
              {/* Calm mode (no-op visual toggle for now) */}
              <button type="button" aria-label="Toggle Calm Mode" className="rounded-full border border-[--ink-300] px-3 py-1 hover:bg-[--paper-100]">
                Calm
              </button>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
