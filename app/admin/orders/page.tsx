export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { formatPrice } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { UpdateOrderStatus } from "@/components/admin/UpdateOrderStatus"

const STATUS_VARIANTS: Record<string, "default" | "success" | "destructive" | "secondary" | "cyan" | "purple" | "pink" | "outline"> = {
  PENDING: "default",
  PROCESSING: "purple",
  SHIPPED: "cyan",
  DELIVERED: "success",
  CANCELLED: "destructive",
}

export default async function AdminOrdersPage() {
  let orders: Awaited<ReturnType<typeof prisma.order.findMany<{ include: { items: { include: { product: { select: { name: true } } } }; user: { select: { name: true; email: true } } } }>>> = []
  try {
    orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: { product: { select: { name: true } } },
        },
        user: { select: { name: true, email: true } },
      },
    })
  } catch {
    // DB unavailable
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-4xl text-white mb-1">Orders</h1>
        <p className="text-white/50">{orders.length} orders total</p>
      </div>

      <div className="rounded-2xl border border-surface-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left p-4 text-sm font-medium text-white/50">Order</th>
                <th className="text-left p-4 text-sm font-medium text-white/50">Customer</th>
                <th className="text-left p-4 text-sm font-medium text-white/50">Items</th>
                <th className="text-right p-4 text-sm font-medium text-white/50">Total</th>
                <th className="text-center p-4 text-sm font-medium text-white/50">Status</th>
                <th className="text-center p-4 text-sm font-medium text-white/50">Date</th>
                <th className="text-right p-4 text-sm font-medium text-white/50">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-white/40">No orders yet</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-surface-border hover:bg-surface2/50 transition-colors">
                    <td className="p-4">
                      <p className="font-mono text-sm text-gold">#{order.id.slice(-8).toUpperCase()}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-white">{order.user?.name ?? order.email}</p>
                      <p className="text-xs text-white/40">{order.email}</p>
                    </td>
                    <td className="p-4">
                      <div className="space-y-0.5">
                        {order.items.map((item) => (
                          <p key={item.id} className="text-xs text-white/60">
                            {item.product.name} × {item.quantity}
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-gold">{formatPrice(order.total)}</span>
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant={STATUS_VARIANTS[order.status] ?? "secondary"}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-xs text-white/50">
                        {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <UpdateOrderStatus orderId={order.id} currentStatus={order.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
