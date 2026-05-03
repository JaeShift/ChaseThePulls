export const dynamic = "force-dynamic"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Heart, Layers3, PackageCheck, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StaggerContainer, StaggerItem } from "@/components/animations/ScrollReveal"
import { ProductCard } from "@/components/shop/ProductCard"
import { ShopByGameCards } from "@/components/home/ShopByGameCards"
import { prisma } from "@/lib/prisma"

async function getFeaturedProducts() {
  try {
    return await prisma.product.findMany({
      where: { featured: true, stock: { gt: 0 } },
      take: 8,
      orderBy: { createdAt: "desc" },
    })
  } catch {
    return []
  }
}

const featureCards = [
  {
    icon: PackageCheck,
    title: "New Releases",
    copy: "Get the latest sets and restocks as soon as they drop.",
  },
  {
    icon: Layers3,
    title: "Real Stock",
    copy: "Live inventory counts so you know what's available.",
  },
  {
    icon: ShieldCheck,
    title: "Packaged With Care",
    copy: "Every order is packed securely for collectors.",
  },
  {
    icon: Heart,
    title: "Collector First",
    copy: "Built by collectors, for collectors.",
  },
]

function HeroArtwork() {
  return (
    <div className="relative mx-auto w-full lg:-mr-16 lg:scale-[1.15] lg:origin-right">
      <div className="relative">
        <Image
          src="/images/landingpage.png"
          alt=""
          width={1100}
          height={750}
          priority
          className="block h-auto w-full object-contain"
          sizes="(max-width: 1024px) 100vw, 1100px"
        />
      </div>
    </div>
  )
}

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts()

  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <section className="relative overflow-hidden border-b border-surface-border/70">
        <div
          className="pointer-events-none absolute -top-40 right-[-12%] h-[620px] w-[min(100%,680px)] rounded-full bg-gradient-to-br from-accent/35 via-electric-purple/20 to-transparent blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-[-12rem] top-36 h-96 w-96 rounded-full bg-electric-cyan/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:72px_72px]"
          aria-hidden
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-32 sm:px-6 sm:pb-20 sm:pt-36 lg:grid-cols-[0.7fr_1.3fr] lg:px-8 lg:pb-24 lg:pt-40">
          <div className="max-w-2xl">
            <p className="font-display text-sm font-bold uppercase tracking-[0.24em] text-accent-light">
              Chase The Pulls
            </p>
            <h1 className="mt-4 font-display text-5xl font-bold leading-[0.95] tracking-tight text-foreground text-balance sm:text-6xl lg:text-7xl">
              Sealed trading cards &amp; accessories,
              <span className="block text-accent-light glow-accent">ready to ship.</span>
            </h1>
            <div className="mt-6 h-1 w-24 rounded-full bg-gradient-to-r from-accent via-accent-light to-electric-cyan" aria-hidden />
            <p className="mt-7 max-w-xl text-base leading-relaxed text-foreground/66 sm:text-lg">
              Shop Magic: The Gathering, Pokémon, One Piece, and Yu-Gi-Oh! in one place. New releases
              and staple sealed product with clear photos, stock levels, and secure checkout.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button variant="glow" size="lg" className="justify-center rounded-xl shadow-lg shadow-accent/25" asChild>
                <Link href="/shop">
                  Browse the shop
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="justify-center rounded-xl bg-background/45" asChild>
                <Link href="/shop?featured=true">View featured</Link>
              </Button>
            </div>
          </div>

          <HeroArtwork />
        </div>
      </section>

      <ShopByGameCards />

      <section className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-0 overflow-hidden rounded-2xl border border-surface-border bg-surface/70 shadow-2xl shadow-black/25 sm:grid-cols-2 lg:grid-cols-4">
          {featureCards.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="border-b border-surface-border/70 p-6 sm:border-r sm:last:border-r-0 lg:border-b-0">
              <Icon className="mb-4 h-8 w-8 text-accent-light" aria-hidden />
              <h3 className="font-display text-lg font-bold text-foreground">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/55">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <section className="relative border-b border-surface-border/80 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-surface2/25 to-background"
            aria-hidden
          />
          <div className="relative mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-display text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl">
                  Featured products
                </h2>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-foreground/55 sm:text-base">
                  In-stock items our team highlights — updated as inventory changes.
                </p>
              </div>
              <Button variant="outline" asChild className="w-fit shrink-0 rounded-xl">
                <Link href="/shop">
                  View all products
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="rounded-2xl border border-surface-border/80 bg-surface/60 p-4 shadow-inner shadow-black/30 sm:rounded-3xl sm:p-6 lg:p-8">
              <StaggerContainer className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
                {featuredProducts.map((product) => (
                  <StaggerItem key={product.id}>
                    <ProductCard product={product as any} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
