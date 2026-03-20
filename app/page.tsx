export const dynamic = "force-dynamic"

import Link from "next/link"
import { ArrowRight, Zap, Shield, Truck, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuroraBackground } from "@/components/animations/AuroraBackground"
import { ParticleField } from "@/components/animations/ParticleField"
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/animations/ScrollReveal"
import { ProductCard } from "@/components/shop/ProductCard"
import { CategoryCard } from "@/components/shop/CategoryCard"
import { prisma } from "@/lib/prisma"
import { CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_BG, type ProductCategory } from "@/types"

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

const CATEGORIES: { key: ProductCategory; icon: string; desc: string }[] = [
  { key: "BOOSTER_PACK", icon: "⚡", desc: "Single booster packs from the latest sets" },
  { key: "ETB", icon: "🎁", desc: "The ultimate collector's box experience" },
  { key: "BLISTER", icon: "📦", desc: "Promo blisters with exclusive cards" },
  { key: "BOOSTER_BUNDLE", icon: "🎴", desc: "Multiple packs bundled together" },
  { key: "UPC", icon: "👑", desc: "The pinnacle of Pokémon collecting" },
  { key: "SPC", icon: "✨", desc: "Exclusive special collection sets" },
]

const FEATURES = [
  { icon: Shield, title: "100% Authentic", desc: "All products sourced directly from authorized distributors" },
  { icon: Truck, title: "Fast Shipping", desc: "Orders ship within 24 hours in protective packaging" },
  { icon: Star, title: "Best Prices", desc: "Competitive pricing on all sealed Pokémon products" },
  { icon: Zap, title: "New Releases", desc: "First access to new set releases and preorders" },
]

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts()

  return (
    <AuroraBackground>
      <ParticleField />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/30 bg-gold/5 text-gold text-sm font-medium mb-8 animate-fade-in-up">
            <Zap className="w-4 h-4 fill-gold" />
            Premium Pokémon TCG Store
          </div>

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
            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            Your ultimate destination for sealed Pokémon TCG products.
            Every pack holds the potential for something legendary.
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

          {/* Stats */}
          <div
            className="flex items-center justify-center gap-8 mt-16 animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            {[
              { value: "500+", label: "Products" },
              { value: "10k+", label: "Happy Customers" },
              { value: "100%", label: "Authentic" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-display font-bold text-gold">{stat.value}</div>
                <div className="text-xs text-white/40 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
          <span className="text-xs tracking-widest">SCROLL</span>
          <div className="w-0.5 h-8 bg-gradient-to-b from-white/30 to-transparent animate-bounce-subtle" />
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <h2 className="font-display font-bold text-4xl md:text-5xl text-white mb-4">
              Shop By <span className="text-gold">Category</span>
            </h2>
            <p className="text-white/50 text-lg">Find exactly what you're looking for</p>
          </ScrollReveal>

          <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {CATEGORIES.map(({ key, icon, desc }) => {
              const color = CATEGORY_COLORS[key]
              const bg = CATEGORY_BG[key]
              return (
                <StaggerItem key={key}>
                  <CategoryCard
                    href={`/shop?category=${key}`}
                    color={color}
                    bg={bg}
                    icon={icon}
                    label={CATEGORY_LABELS[key]}
                    desc={desc}
                  />
                </StaggerItem>
              )
            })}
          </StaggerContainer>
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

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-surface-border">
        <div className="max-w-7xl mx-auto">
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <StaggerItem key={title}>
                <div className="text-center group">
                  <div className="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-gold/20 group-hover:border-gold/40 transition-all duration-300">
                    <Icon className="w-7 h-7 text-gold" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{title}</h3>
                  <p className="text-white/50 text-sm">{desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

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
