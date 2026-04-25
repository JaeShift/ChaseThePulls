"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { ShoppingCart, User, Menu, X, Zap, LogOut, Settings, Package, Search, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/context/CartContext"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"

const CATEGORY_QUICK_LINKS: { href: string; label: string }[] = [
  { href: "/shop?subcategory=TRADING_CARD_GAME", label: "Trading cards" },
  { href: "/shop?subcategory=PLUSH", label: "Plush" },
  { href: "/shop?subcategory=CLOTHING", label: "Clothing" },
  { href: "/shop?category=ACCESSORIES", label: "Accessories" },
  { href: "/shop?subcategory=FUNKO", label: "Funko" },
]

function isGlobalCategoryChipActive(pathname: string, sp: URLSearchParams, href: string) {
  if (pathname !== "/shop") return false
  if (sp.get("game") || sp.get("tcg")) return false
  const target = new URL(href, "https://example.com")
  if (target.searchParams.has("category")) {
    return sp.get("category") === target.searchParams.get("category") && !sp.get("subcategory")
  }
  if (target.searchParams.has("subcategory")) {
    return sp.get("subcategory") === target.searchParams.get("subcategory") && !sp.get("category")
  }
  return false
}

function NavbarCategoryQuicklinks({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (
    <nav
      className={compact ? "w-full" : "w-full"}
      aria-label="Browse by product type"
    >
      <div className={compact ? "py-1" : "py-0"}>
        <ul
          className={cn(
            compact
              ? "grid grid-cols-2 gap-2"
              : "flex items-center justify-center gap-1 xl:gap-2",
          )}
        >
          {CATEGORY_QUICK_LINKS.map(({ href, label }, index) => {
            const active = isGlobalCategoryChipActive(pathname, searchParams, href)
            return (
              <li key={href} className="flex items-center">
                {!compact && index > 0 ? (
                  <span
                    className="mx-1 hidden h-4 w-px shrink-0 bg-foreground/15 xl:mx-2 xl:block"
                    aria-hidden
                  />
                ) : null}
                <Link
                  href={href}
                  className={cn(
                    "shrink-0 rounded-lg font-display font-semibold tracking-tight transition-colors duration-200",
                    compact
                      ? "w-full px-3 py-2 text-sm text-foreground/75 hover:bg-surface2 hover:text-foreground"
                      : "px-2 py-2 text-sm text-foreground/72 hover:text-foreground xl:text-[15px]",
                    active
                      ? "bg-accent/12 text-foreground shadow-[inset_0_-1px_0_rgba(139,124,255,0.75)]"
                      : "",
                  )}
                >
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}

export function Navbar() {
  const { data: session } = useSession()
  const { itemCount, openCart } = useCart()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 border-b transition-all duration-300 ${
          scrolled
            ? "border-surface-border/90 bg-background/95 shadow-2xl shadow-black/35 backdrop-blur-xl"
            : "border-surface-border/50 bg-background/80 backdrop-blur-lg"
        }`}
      >
        <div className="border-b border-surface-border/60 bg-surface/45">
          <div className="mx-auto flex h-7 max-w-7xl items-center justify-center px-4 text-[11px] font-semibold text-foreground/70">
            <Sparkles className="mr-1.5 h-3 w-3 text-accent" aria-hidden />
            Free shipping on orders over $75
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 shrink-0 items-center justify-between gap-4">
            <Link href="/" className="group flex min-w-0 items-center gap-2.5">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-lg bg-accent/50 blur-md opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-accent shadow-lg shadow-accent/25">
                  <Zap className="h-5 w-5 fill-white text-white" />
                </div>
              </div>
              <span
                className="truncate font-display text-lg font-bold tracking-[0.22em] text-foreground transition-colors duration-300 group-hover:text-accent-light sm:text-xl"
              >
                CHASE<span className="text-accent">THE</span>PULLS
              </span>
            </Link>

            <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
              <NavbarCategoryQuicklinks />
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button variant="ghost" size="icon" className="hidden text-foreground/70 hover:text-foreground md:inline-flex" asChild>
                <Link href="/shop" aria-label="Search products">
                  <Search className="h-5 w-5" />
                </Link>
              </Button>

              <button
                onClick={openCart}
                className="relative flex h-10 w-10 items-center justify-center rounded-lg text-foreground/70 transition-colors duration-200 hover:bg-surface2 hover:text-foreground"
                aria-label="Open cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-white shadow-lg shadow-accent/30"
                  >
                    {itemCount > 9 ? "9+" : itemCount}
                  </motion.span>
                )}
              </button>

              {session ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex h-10 items-center gap-2 rounded-lg px-2 text-foreground/70 transition-colors duration-200 hover:bg-surface2 hover:text-foreground"
                    aria-label="Open account menu"
                  >
                    {session.user?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={session.user.image}
                        alt={session.user.name ?? "User"}
                        className="h-8 w-8 rounded-full border border-surface-border"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-surface-border bg-surface2">
                        <User className="h-[18px] w-[18px]" />
                      </div>
                    )}
                  </button>
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-surface-border bg-surface/95 py-1 shadow-2xl shadow-black/60 backdrop-blur-xl"
                      >
                        <div className="border-b border-surface-border px-4 py-2">
                          <p className="truncate text-sm font-medium text-foreground">{session.user?.name}</p>
                          <p className="truncate text-xs text-foreground/50">{session.user?.email}</p>
                        </div>
                        <Link
                          href="/account"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-foreground/70 transition-colors hover:bg-accent/10 hover:text-accent-light"
                        >
                          <Package className="h-4 w-4" />
                          My Orders
                        </Link>
                        {(session.user as { role?: string })?.role === "ADMIN" && (
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-foreground/70 transition-colors hover:bg-accent/10 hover:text-accent-light"
                          >
                            <Settings className="h-4 w-4" />
                            Admin Panel
                          </Link>
                        )}
                        <button
                          onClick={() => { setUserMenuOpen(false); signOut() }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground/70 transition-colors hover:bg-electric-red/10 hover:text-electric-red"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden items-center gap-2 md:flex">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button variant="glow" size="sm" className="shadow-accent/25" asChild>
                    <Link href="/register">Sign Up</Link>
                  </Button>
                </div>
              )}

              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground/70 transition-colors hover:bg-surface2 hover:text-foreground lg:hidden"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-surface-border bg-background/95 shadow-2xl shadow-black/50 backdrop-blur-xl lg:hidden"
            >
              <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4">
                <NavbarCategoryQuicklinks compact />
                <div className="grid grid-cols-2 gap-2 border-t border-surface-border pt-4">
                  <Button variant="outline" size="default" className="justify-center" asChild>
                    <Link href="/shop" onClick={() => setMobileOpen(false)}>Search shop</Link>
                  </Button>
                  <Button variant="accent" size="default" className="justify-center" asChild>
                    <Link href="/shop?subcategory=TRADING_CARD_GAME" onClick={() => setMobileOpen(false)}>Trading cards</Link>
                  </Button>
                </div>
                {!session && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="default" className="flex-1 h-11 text-sm" asChild>
                      <Link href="/login" onClick={() => setMobileOpen(false)}>Sign In</Link>
                    </Button>
                    <Button variant="glow" size="default" className="flex-1 h-11 text-sm" asChild>
                      <Link href="/register" onClick={() => setMobileOpen(false)}>Sign Up</Link>
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Overlay to close user menu */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </>
  )
}
