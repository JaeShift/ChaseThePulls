import type { Metadata, Viewport } from "next"
import { Inter, Rajdhani } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { Providers } from "@/components/layout/Providers"
import { CartDrawer } from "@/components/shop/CartDrawer"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rajdhani",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Chase The Pulls | Premium Pokémon TCG Cards",
    template: "%s | Chase The Pulls",
  },
  description:
    "Shop premium Pokémon TCG sealed products including Booster Packs, Elite Trainer Boxes, Blister Packs, Booster Bundles, Ultra Premium Collections and Special Collections. Chase The Pulls — where every pack is a new adventure.",
  keywords: [
    "Pokemon cards",
    "Pokemon TCG",
    "booster packs",
    "Elite Trainer Box",
    "Pokemon sealed products",
    "Chase The Pulls",
  ],
  openGraph: {
    title: "Chase The Pulls | Premium Pokémon TCG Cards",
    description: "Shop premium Pokémon TCG sealed products. Chase the thrill, chase the pulls.",
    type: "website",
    siteName: "Chase The Pulls",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: "#FFD700",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${rajdhani.variable}`}>
      <body className="bg-background text-white font-body antialiased">
        <Providers>
          <Navbar />
          <CartDrawer />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
