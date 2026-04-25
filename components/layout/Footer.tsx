import Link from "next/link"
import { Instagram, Mail, Music2, Play, Twitter, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Footer() {
  const currentYear = new Date().getFullYear()

  const shop = [
    { label: "Trading Cards", href: "/shop?subcategory=TRADING_CARD_GAME" },
    { label: "Plush", href: "/shop?subcategory=PLUSH" },
    { label: "Clothing", href: "/shop?subcategory=CLOTHING" },
    { label: "Accessories", href: "/shop?category=ACCESSORIES" },
    { label: "Funko", href: "/shop?subcategory=FUNKO" },
  ]

  const help = [
    { label: "Contact Us", href: "mailto:support@chasethepulls.com" },
    { label: "Shipping", href: "/shipping" },
    { label: "Returns & Refunds", href: "/returns" },
    { label: "FAQ", href: "/faq" },
  ]

  const account = [
    { label: "Sign In", href: "/login" },
    { label: "Create Account", href: "/register" },
    { label: "Order History", href: "/account/orders" },
    { label: "Wishlist", href: "/account" },
  ]

  return (
    <footer className="relative mt-20 overflow-hidden border-t border-surface-border">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(109,93,246,0.2),transparent_32%),linear-gradient(180deg,#080B18_0%,#050713_100%)]"
        aria-hidden
      />
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 overflow-hidden rounded-2xl border border-surface-border bg-surface/75 shadow-2xl shadow-black/25">
          <div className="grid gap-6 bg-[radial-gradient(circle_at_90%_20%,rgba(109,93,246,0.35),transparent_36%)] p-6 sm:p-8 lg:grid-cols-[0.75fr_1fr] lg:items-center">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">Stay in the loop</h2>
              <p className="mt-1.5 max-w-md text-sm leading-relaxed text-foreground/55">
                Get updates on new releases, restocks, and exclusive offers.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <label className="sr-only" htmlFor="newsletter-email">Email address</label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="Enter your email"
                className="h-12 min-w-0 flex-1 rounded-xl border border-surface-border bg-background/70 px-4 text-sm text-foreground placeholder:text-foreground/35 focus:border-accent"
              />
              <Button type="button" variant="glow" size="lg" className="rounded-xl">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 border-b border-surface-border pb-8 md:grid-cols-[1.3fr_0.7fr_0.7fr_0.7fr_0.7fr]">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="group mb-4 flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 rounded-lg bg-accent/40 blur-md transition-all duration-300 group-hover:bg-accent/60" />
                <div className="relative flex h-7 w-7 items-center justify-center rounded-lg border border-accent/40 bg-accent">
                  <Zap className="h-4 w-4 fill-white text-white" />
                </div>
              </div>
              <span className="font-display text-base font-bold uppercase tracking-[0.2em] text-foreground transition-colors duration-300 group-hover:text-accent-light">
                CHASETHEPULLS
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-foreground/45">
              Your one-stop shop for sealed trading cards and accessories. Authentic products,
              fast shipping, and collector-approved care.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-display text-xs font-semibold uppercase tracking-widest text-foreground">
              Shop
            </h3>
            <ul className="space-y-2.5">
              {shop.map((c) => (
                <li key={c.href}>
                  <Link
                    href={c.href}
                    className="text-sm text-foreground/45 transition-colors duration-200 hover:text-accent-light"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-display text-xs font-semibold uppercase tracking-widest text-foreground">
              Help
            </h3>
            <ul className="space-y-2.5">
              {help.map((c) => (
                <li key={c.href}>
                  <Link
                    href={c.href}
                    className="text-sm text-foreground/45 transition-colors duration-200 hover:text-accent-light"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-display text-xs font-semibold uppercase tracking-widest text-foreground">
              Account
            </h3>
            <ul className="space-y-2.5">
              {account.map((c) => (
                <li key={c.href}>
                  <Link
                    href={c.href}
                    className="text-sm text-foreground/45 transition-colors duration-200 hover:text-accent-light"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-display text-xs font-semibold uppercase tracking-widest text-foreground">
              Follow Us
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { icon: Twitter, label: "Twitter / X" },
                { icon: Instagram, label: "Instagram" },
                { icon: Music2, label: "TikTok" },
                { icon: Play, label: "YouTube" },
                { icon: Mail, label: "Email" },
              ].map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href={label === "Email" ? "mailto:support@chasethepulls.com" : "#"}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-surface-border bg-surface2/70 text-foreground/55 transition-all duration-200 hover:border-accent/50 hover:bg-accent/15 hover:text-accent-light"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-6 sm:flex-row">
          <p className="text-xs text-foreground/35">
            © {currentYear} Chase The Pulls. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-xs text-foreground/35 transition-colors hover:text-accent-light">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-xs text-foreground/35 transition-colors hover:text-accent-light">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
