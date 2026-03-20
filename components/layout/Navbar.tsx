"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { ShoppingCart, User, Menu, X, Zap, LogOut, Settings, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/context/CartContext"
import { motion, AnimatePresence } from "framer-motion"

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

  const navLinks = [
    { href: "/shop", label: "Shop" },
    { href: "/shop?category=ETB", label: "ETBs" },
    { href: "/shop?category=BOOSTER_PACK", label: "Booster Packs" },
    { href: "/shop?category=UPC", label: "UPCs" },
  ]

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-background/95 backdrop-blur-md border-b border-surface-border shadow-lg shadow-black/30"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center shadow-lg shadow-gold/30 group-hover:shadow-gold/50 transition-all duration-300">
                  <Zap className="w-5 h-5 text-background fill-background" />
                </div>
                <div className="absolute inset-0 rounded-lg bg-gold blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
              </div>
              <span
                className="font-display font-bold text-xl tracking-widest text-white group-hover:text-gold transition-colors duration-300"
                style={{ letterSpacing: "0.15em" }}
              >
                CHASE<span className="text-gold">THE</span>PULLS
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-white/70 hover:text-gold transition-colors duration-200 rounded-lg hover:bg-gold/5"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* Cart */}
              <button
                onClick={openCart}
                className="relative p-2 text-white/70 hover:text-gold transition-colors duration-200 rounded-lg hover:bg-gold/5"
                aria-label="Open cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gold text-background text-xs font-bold flex items-center justify-center"
                  >
                    {itemCount > 9 ? "9+" : itemCount}
                  </motion.span>
                )}
              </button>

              {/* User Menu */}
              {session ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-2 text-white/70 hover:text-gold transition-colors duration-200 rounded-lg hover:bg-gold/5"
                  >
                    {session.user?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={session.user.image}
                        alt={session.user.name ?? "User"}
                        className="w-7 h-7 rounded-full border border-surface-border"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-surface2 border border-surface-border flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-surface-border bg-surface shadow-xl shadow-black/50 py-1"
                      >
                        <div className="px-4 py-2 border-b border-surface-border">
                          <p className="text-sm font-medium text-white truncate">{session.user?.name}</p>
                          <p className="text-xs text-white/50 truncate">{session.user?.email}</p>
                        </div>
                        <Link
                          href="/account"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-gold hover:bg-gold/5 transition-colors"
                        >
                          <Package className="w-4 h-4" />
                          My Orders
                        </Link>
                        {(session.user as { role?: string })?.role === "ADMIN" && (
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-gold hover:bg-gold/5 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            Admin Panel
                          </Link>
                        )}
                        <button
                          onClick={() => { setUserMenuOpen(false); signOut() }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-white/70 hover:text-electric-red hover:bg-electric-red/5 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button variant="glow" size="sm" asChild>
                    <Link href="/register">Sign Up</Link>
                  </Button>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                className="md:hidden p-2 text-white/70 hover:text-gold transition-colors rounded-lg"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
              className="md:hidden border-t border-surface-border bg-background/98 backdrop-blur-md"
            >
              <div className="px-4 py-4 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 text-sm font-medium text-white/70 hover:text-gold hover:bg-gold/5 rounded-lg transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                {!session && (
                  <div className="flex gap-2 pt-2 border-t border-surface-border mt-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href="/login" onClick={() => setMobileOpen(false)}>Sign In</Link>
                    </Button>
                    <Button variant="glow" size="sm" className="flex-1" asChild>
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
