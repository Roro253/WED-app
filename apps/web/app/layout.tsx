import type { Metadata } from 'next'
import { Geist, Geist_Mono, Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { BudgetBar } from '@/components/BudgetBar'
import Header from '@/components/header'
import Footer from '@/components/footer'

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
        <Header />
        <div className="mx-auto max-w-6xl px-4">
          <div className="mt-3 hidden md:block">
            {headerPlan ? (
              <BudgetBar total={headerPlan.total} redline={headerPlan.redline} />
            ) : (
              <div className="text-center text-sm text-[--ink-600]">Budget</div>
            )}
          </div>
          <main className="py-6">{children}</main>
        </div>
        <Footer />
      </body>
    </html>
  )
}
