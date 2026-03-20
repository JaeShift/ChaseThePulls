export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Package, User, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"

export default async function AccountPage() {
  const session = await auth()
  if (!session?.user) redirect("/login?callbackUrl=/account")

  let orderCount = 0
  try {
    orderCount = await prisma.order.count({ where: { userId: session.user.id } })
  } catch {
    // DB unavailable
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
            {session.user.image ? (
              <img src={session.user.image} alt="" className="w-full h-full rounded-2xl object-cover" />
            ) : (
              <User className="w-8 h-8 text-gold" />
            )}
          </div>
          <div>
            <h1 className="font-display font-bold text-3xl text-white">{session.user.name ?? "Trainer"}</h1>
            <p className="text-white/50">{session.user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/account/orders" className="group rounded-2xl border border-surface-border bg-surface p-6 hover:border-gold/30 transition-all duration-200 hover:bg-surface2">
            <Package className="w-8 h-8 text-gold mb-4" />
            <h2 className="font-semibold text-white mb-1">My Orders</h2>
            <p className="text-white/50 text-sm mb-4">{orderCount} {orderCount === 1 ? "order" : "orders"} total</p>
            <span className="flex items-center gap-1 text-gold text-sm font-medium group-hover:gap-2 transition-all">
              View Orders <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
