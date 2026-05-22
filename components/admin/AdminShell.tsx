"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, LayoutDashboard, Menu, Package, ShoppingBag, X, Zap } from "lucide-react"

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/drafts", label: "Drafts", icon: FileText },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Close drawer on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  const SidebarContent = () => (
    <>
      <div className="p-5 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <p className="font-display font-bold text-sm text-foreground tracking-wider">ADMIN</p>
            <p className="text-xs text-foreground/40">Chase The Pulls</p>
          </div>
        </div>
      </div>
      <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-accent/10 text-accent"
                  : "text-foreground/60 hover:text-accent hover:bg-accent/5"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-surface-border">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-foreground/40 hover:text-accent transition-colors"
        >
          ← Back to Store
        </Link>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen pt-28 sm:pt-32 lg:pt-36">
      {/* Desktop sidebar — fixed, always visible on lg+ */}
      <aside className="hidden lg:flex lg:flex-col w-64 border-r border-surface-border bg-surface fixed top-52 left-0 bottom-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile drawer backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-surface border-r border-surface-border shadow-2xl shadow-black/50 transition-transform duration-300 ease-in-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-1">
          <span className="text-xs font-medium text-foreground/40 uppercase tracking-widest">
            Navigation
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full p-2 text-foreground/60 hover:bg-surface2 hover:text-foreground transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 min-h-full min-w-0">
        {/* Mobile top bar with hamburger */}
        <div className="lg:hidden sticky top-28 sm:top-32 z-30 flex items-center gap-3 px-4 py-3 border-b border-surface-border bg-background/95 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-surface-border bg-surface text-foreground/70 hover:text-accent hover:border-accent/40 transition-colors flex-shrink-0"
            aria-label="Open admin menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-foreground/70 tracking-wide">Admin</span>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
