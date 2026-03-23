export const dynamic = "force-dynamic"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuroraBackground } from "@/components/animations/AuroraBackground"
import { ParticleField } from "@/components/animations/ParticleField"
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/animations/ScrollReveal"
import { ProductCard } from "@/components/shop/ProductCard"
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

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts()

  return (
    <AuroraBackground>
      <ParticleField />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Main heading */}
          <h1
            className="font-display font-bold leading-none mb-6 animate-fade-in-up"
            style={{ animationDelay: "0.1s", fontSize: "clamp(3rem, 10vw, 8rem)" }}
          >
            <span className="block text-white">CHASE</span>
            <span
              className="block shimmer-text"
              style={{ fontSize: "clamp(4rem, 12vw, 10rem)" }}
            >
              THE PULLS
            </span>
          </h1>

          <p
            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-3 animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            Your spot for sealed products across Pokémon, Magic: The Gathering, Yu-Gi-Oh!, and One Piece.
            Every pack holds the potential for something legendary.
          </p>
          <p
            className="text-sm text-white/35 max-w-xl mx-auto mb-10 animate-fade-in-up tracking-wide"
            style={{ animationDelay: "0.25s" }}
          >
            Pokémon · Magic · Yu-Gi-Oh! · One Piece
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <Button variant="glow" size="xl" asChild>
              <Link href="/shop">
                Shop Now <ArrowRight className="w-5 h-5 ml-1" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link href="/shop?featured=true">
                Featured Products
              </Link>
            </Button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
          <span className="text-xs tracking-widest">SCROLL</span>
          <div className="w-0.5 h-8 bg-gradient-to-b from-white/30 to-transparent animate-bounce-subtle" />
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <ScrollReveal className="flex items-center justify-between mb-12">
              <div>
                <h2 className="font-display font-bold text-4xl md:text-5xl text-white mb-2">
                  Featured <span className="text-gold">Products</span>
                </h2>
                <p className="text-white/50">Hand-picked by our team</p>
              </div>
              <Button variant="outline" asChild className="hidden md:flex">
                <Link href="/shop">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </ScrollReveal>

            <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map((product) => (
                <StaggerItem key={product.id}>
                  <ProductCard product={product as any} />
                </StaggerItem>
              ))}
            </StaggerContainer>

            <div className="text-center mt-10 md:hidden">
              <Button variant="outline" asChild>
                <Link href="/shop">View All Products</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div
              className="relative rounded-3xl p-12 text-center overflow-hidden border border-gold/20"
              style={{
                background: "linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(0,212,255,0.05) 50%, rgba(139,92,246,0.08) 100%)",
              }}
            >
              {/* Glow effects */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background: "radial-gradient(ellipse at 50% 0%, rgba(255,215,0,0.2) 0%, transparent 60%)",
                }}
              />
              <h2 className="font-display font-bold text-4xl md:text-5xl text-white mb-4 relative z-10">
                Ready to <span className="text-gold">Chase?</span>
              </h2>
              <p className="text-white/60 text-lg mb-8 relative z-10">
                Join thousands of collectors finding their dream pulls.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                <Button variant="glow" size="xl" asChild>
                  <Link href="/shop">Start Shopping</Link>
                </Button>
                <Button variant="outline" size="xl" asChild>
                  <Link href="/register">Create Account</Link>
                </Button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </AuroraBackground>
  )
}
