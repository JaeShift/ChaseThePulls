export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { formatPrice } from "@/lib/utils"
import { Package, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const STATUS_VARIANTS: Record<string, "default" | "success" | "destructive" | "secondary" | "cyan" | "purple" | "pink" | "outline"> = {
  PENDING: "default",
  PROCESSING: "purple",
  SHIPPED: "cyan",
  DELIVERED: "success",
  CANCELLED: "destructive",
}

export default async function OrdersPage() {
  const session = await auth()
  if (!session?.user) redirect("/login?callbackUrl=/account/orders")

  let orders: Awaited<ReturnType<typeof prisma.order.findMany<{ include: { items: { include: { product: { select: { name: true; images: true } } } } } }>>> = []
  try {
    orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        items: {
          include: { product: { select: { name: true, images: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  } catch {
    // DB unavailable
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-display font-bold text-4xl text-white mb-2">My Orders</h1>
          <p className="text-white/50">{orders.length} {orders.length === 1 ? "order" : "orders"} total</p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-24">
            <Package className="w-20 h-20 text-white/20 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No orders yet</h2>
            <p className="text-white/50 mb-6">Start chasing pulls!</p>
            <Button variant="glow" asChild>
              <Link href="/shop">Browse Shop <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-2xl border border-surface-border bg-surface p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div>
                    <p className="text-xs text-white/40 mb-1">Order Number</p>
                    <p className="font-mono font-bold text-gold">#{order.id.slice(-8).toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/40 mb-1">Date</p>
                    <p className="text-sm text-white">{new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                  </div>
                  <div>
                    <Badge variant={STATUS_VARIANTS[order.status] ?? "secondary"}>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/40 mb-1">Total</p>
                    <p className="font-bold text-gold text-lg">{formatPrice(order.total)}</p>
                  </div>
                </div>

                {/* Items preview */}
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 text-sm">
                      <div className="w-10 h-12 rounded-lg bg-surface2 border border-surface-border overflow-hidden flex-shrink-0">
                        {item.product.images[0] && (
                          <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <span className="text-white/70 flex-1 truncate">{item.product.name}</span>
                      <span className="text-white/40">×{item.quantity}</span>
                      <span className="text-white font-medium">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {order.trackingNumber && (
                  <div className="mt-4 pt-4 border-t border-surface-border">
                    <p className="text-sm text-white/50">
                      Tracking: <span className="text-gold font-mono">{order.trackingNumber}</span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

