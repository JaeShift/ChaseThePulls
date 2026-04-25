export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"
import { Package, ShoppingBag, DollarSign, Users, ArrowRight, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function AdminDashboard() {
  let productCount = 0, orderCount = 0, userCount = 0, revenue = 0
  let recentOrders: Awaited<ReturnType<typeof prisma.order.findMany<{ include: { items: { include: { product: { select: { name: true } } } } } }>>> = []

  try {
    const [pc, oc, uc, revenueData, ro] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { not: "CANCELLED" } },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { items: { include: { product: { select: { name: true } } } } },
      }),
    ])
    productCount = pc
    orderCount = oc
    userCount = uc
    revenue = revenueData._sum.total ?? 0
    recentOrders = ro
  } catch {
    // DB unavailable – show zeros
  }

  const stats = [
    { label: "Total Products", value: productCount.toString(), icon: Package, color: "#6366F1", href: "/admin/products" },
    { label: "Total Orders", value: orderCount.toString(), icon: ShoppingBag, color: "#00D4FF", href: "/admin/orders" },
    { label: "Total Revenue", value: formatPrice(revenue), icon: DollarSign, color: "#10B981", href: "/admin/orders" },
    { label: "Total Customers", value: userCount.toString(), icon: Users, color: "#8B5CF6", href: "#" },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-4xl text-foreground mb-2">Dashboard</h1>
        <p className="text-foreground/50">Welcome back, Admin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, href }) => (
          <Link
            key={label}
            href={href}
            className="group rounded-2xl border border-surface-border bg-surface p-6 hover:border-opacity-70 transition-all duration-200"
            style={{ borderColor: `${color}20` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: `${color}15`, border: `1px solid ${color}30` }}
              >
                <Icon className="w-6 h-6" style={{ color }} />
              </div>
              <TrendingUp className="w-4 h-4 text-foreground/20 group-hover:text-foreground/40 transition-colors" />
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
            <p className="text-sm text-foreground/50">{label}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-surface-border bg-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            <Button variant="glow" className="w-full justify-start" asChild>
              <Link href="/admin/products/new">
                <Package className="w-4 h-4 mr-2" /> Add New Product
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/admin/orders">
                <ShoppingBag className="w-4 h-4 mr-2" /> View All Orders
              </Link>
            </Button>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="rounded-2xl border border-surface-border bg-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-accent hover:text-accent-light transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-foreground/40 text-sm">No orders yet</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                  <div>
                    <p className="text-sm font-mono text-foreground">#{order.id.slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-foreground/40">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-accent">{formatPrice(order.total)}</p>
                    <p className="text-xs text-foreground/40">{order.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
