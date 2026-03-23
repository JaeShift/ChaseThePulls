import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, Package, ShoppingBag, Settings, Zap } from "lucide-react"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin")
  }
  if (session.user.role !== "ADMIN") {
    redirect("/")
  }

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  ]

  return (
    <div className="min-h-screen flex pt-16">
      {/* Sidebar */}
      <aside className="w-64 border-r border-surface-border bg-surface fixed top-16 left-0 bottom-0 z-30 flex flex-col">
        <div className="p-6 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center">
              <Zap className="w-5 h-5 text-background fill-background" />
            </div>
            <div>
              <p className="font-display font-bold text-sm text-white tracking-wider">ADMIN</p>
              <p className="text-xs text-white/40">Chase The Pulls</p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-1 flex-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-gold hover:bg-gold/5 transition-all duration-200"
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-surface-border">
          <Link href="/" className="flex items-center gap-2 text-sm text-white/40 hover:text-gold transition-colors">
            ← Back to Store
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 min-h-full">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
