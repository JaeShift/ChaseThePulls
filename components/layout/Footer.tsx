import Link from "next/link"
import { Zap, Mail, Instagram, Twitter } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  const games = [
    { label: "One Piece", href: "/shop?game=ONE_PIECE" },
    { label: "Magic: The Gathering", href: "/shop?game=MAGIC_THE_GATHERING" },
    { label: "Pokémon", href: "/shop?game=POKEMON" },
    { label: "Yu-Gi-Oh!", href: "/shop?game=YUGIOH" },
  ]

  const account = [
    { label: "Shop All", href: "/shop" },
    { label: "My Account", href: "/account" },
    { label: "My Orders", href: "/account/orders" },
    { label: "Cart", href: "/cart" },
  ]

  return (
    <footer className="relative border-t border-surface-border mt-20 overflow-hidden">
      {/* Subtle gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(14, 21, 32, 0.95) 0%, rgba(8, 12, 20, 1) 100%)",
        }}
      />
      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="relative">
                <div className="absolute inset-0 rounded-lg bg-gold/20 blur-md group-hover:bg-gold/30 transition-all duration-300" />
                <div className="relative w-7 h-7 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-gold fill-gold" />
                </div>
              </div>
              <span className="font-display font-bold text-base tracking-widest text-white group-hover:text-gold transition-colors duration-300 uppercase">
                Chase The Pulls
              </span>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed mb-6">
              Authentic sealed trading card products — Pokémon, Magic: The Gathering, Yu-Gi-Oh!,
              One Piece, Lorcana, Gundam, and more. From boosters to premium collections.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="mailto:support@chasethepulls.com"
                aria-label="Email support"
                className="p-2 rounded-lg border border-surface-border text-white/40 hover:text-gold hover:border-gold/40 hover:bg-gold/5 transition-all duration-200"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="p-2 rounded-lg border border-surface-border text-white/40 hover:text-gold hover:border-gold/40 hover:bg-gold/5 transition-all duration-200"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Twitter / X"
                className="p-2 rounded-lg border border-surface-border text-white/40 hover:text-gold hover:border-gold/40 hover:bg-gold/5 transition-all duration-200"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-display font-semibold text-white mb-4 tracking-widest uppercase text-xs">
              Shop by game
            </h3>
            <ul className="space-y-2.5">
              {games.map((c) => (
                <li key={c.href}>
                  <Link
                    href={c.href}
                    className="text-sm text-white/40 hover:text-gold transition-colors duration-200"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="font-display font-semibold text-white mb-4 tracking-widest uppercase text-xs">
              Account
            </h3>
            <ul className="space-y-2.5">
              {account.map((c) => (
                <li key={c.href}>
                  <Link
                    href={c.href}
                    className="text-sm text-white/40 hover:text-gold transition-colors duration-200"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-display font-semibold text-white mb-4 tracking-widest uppercase text-xs">
              Support
            </h3>
            <div className="space-y-2.5">
              <p className="text-sm text-white/40">
                Questions? We&apos;re here to help.
              </p>
              <a
                href="mailto:support@chasethepulls.com"
                className="text-sm text-gold hover:text-gold-light transition-colors duration-200 underline underline-offset-4"
              >
                support@chasethepulls.com
              </a>
              <p className="text-xs text-white/20 mt-4 leading-relaxed">
                Game names, logos, and trademarks belong to their respective owners. Chase The Pulls
                is not affiliated with Wizards of the Coast, The Pokémon Company, Konami, Bandai,
                Disney, Sunrise, or other rights holders.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-surface-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            © {currentYear} Chase The Pulls. All rights reserved.
          </p>
          <div className="flex items-center gap-1">
            <span className="text-xs text-white/30">
              Secure payments powered by
            </span>
            <span className="text-xs font-bold text-gold ml-1">Stripe</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
