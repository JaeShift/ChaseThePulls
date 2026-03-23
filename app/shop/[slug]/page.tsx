export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { formatPrice } from "@/lib/utils"
import { subtabLabel } from "@/lib/game-subtabs"
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  CATEGORY_BG,
  GAME_LABELS,
  GAME_COLORS,
  GAME_BG,
} from "@/types"
import { AddToCartButton } from "@/components/shop/AddToCartButton"
import { HolographicCard } from "@/components/animations/HolographicCard"
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/animations/ScrollReveal"
import { ProductCard } from "@/components/shop/ProductCard"
import { Badge } from "@/components/ui/badge"
import {
  ChevronRight,
  Package,
  Shield,
  Truck,
  RotateCcw,
  Star,
} from "lucide-react"
import type { Metadata } from "next"

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

async function getProduct(slug: string) {
  try {
    return await prisma.product.findUnique({ where: { slug } })
  } catch {
    return null
  }
}

async function getRelatedProducts(game: string, excludeSlug: string) {
  try {
    return await prisma.product.findMany({
      where: { game: game as never, slug: { not: excludeSlug }, stock: { gt: 0 } },
      take: 4,
      orderBy: { createdAt: "desc" },
    })
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return { title: "Product Not Found" }
  return {
    title: product.name,
    description: product.description?.slice(0, 160) ?? `Shop ${product.name} at Chase The Pulls`,
    openGraph: {
      title: product.name,
      images: product.images[0] ? [product.images[0]] : [],
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) notFound()

  const related = await getRelatedProducts(product.game, product.slug)
  const color =
    GAME_COLORS[product.game as keyof typeof GAME_COLORS] ??
    CATEGORY_COLORS[product.category as keyof typeof CATEGORY_COLORS] ??
    "#FFD700"
  const bg =
    GAME_BG[product.game as keyof typeof GAME_BG] ??
    CATEGORY_BG[product.category as keyof typeof CATEGORY_BG] ??
    "rgba(255,215,0,0.05)"
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : null

  const gameBadgeFg = product.game === "POKEMON" ? "#080C14" : "#F8FAFF"

  return (
    <div className="min-h-screen pt-20 pb-16">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-sm text-white/40">
          <Link href="/" className="hover:text-gold transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/shop" className="hover:text-gold transition-colors">Shop</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/shop?game=${product.game}`} className="hover:text-gold transition-colors">
            {GAME_LABELS[product.game as keyof typeof GAME_LABELS]}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white/60 truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {/* Image Gallery */}
          <div className="space-y-4">
            <HolographicCard className="rounded-2xl" intensity={1.5}>
              <div
                className="relative aspect-[3/4] rounded-2xl overflow-hidden border"
                style={{ borderColor: `${color}25`, background: bg }}
              >
                {/* Badges */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                  {product.stock === 0 && (
                    <Badge variant="secondary" className="bg-white/10 text-white/60 border-white/10">
                      Sold Out
                    </Badge>
                  )}
                  {product.featured && (
                    <Badge className="bg-gold/20 text-gold border-gold/30">
                      <Star className="w-3 h-3 mr-1 fill-gold" /> Featured
                    </Badge>
                  )}
                </div>
                {discount && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-electric-red/20 text-electric-red border-electric-red/30">
                      -{discount}% OFF
                    </Badge>
                  </div>
                )}

                {product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-contain p-6"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Package className="w-24 h-24 text-white/10" />
                  </div>
                )}
              </div>
            </HolographicCard>

            {/* Thumbnail strip */}
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.slice(0, 5).map((img, i) => (
                  <div
                    key={i}
                    className="relative w-16 h-20 rounded-lg overflow-hidden border-2 border-gold/30 hover:border-gold transition-colors cursor-pointer"
                    style={{ background: bg }}
                  >
                    <Image src={img} alt={`View ${i + 1}`} fill className="object-contain p-1" sizes="64px" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col gap-6">
            {/* Game, type & set */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="px-3 py-1 rounded-full text-sm font-semibold"
                style={{
                  background: color,
                  color: gameBadgeFg,
                  border: `1px solid ${color}`,
                  boxShadow: `0 0 20px ${color}35`,
                }}
              >
                {GAME_LABELS[product.game as keyof typeof GAME_LABELS]}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium border border-surface-border text-white/70 bg-surface2/80">
                {subtabLabel(product.game, product.subcategory)}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium border border-surface-border text-white/55 bg-surface2/50">
                {CATEGORY_LABELS[product.category as keyof typeof CATEGORY_LABELS]}
              </span>
              {product.set && (
                <span className="px-3 py-1 rounded-full text-sm text-white/50 border border-surface-border">
                  {product.set}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="font-display font-bold text-3xl md:text-4xl text-white leading-tight">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold" style={{ color }}>
                {formatPrice(product.price)}
              </span>
              {product.comparePrice && product.comparePrice > product.price && (
                <>
                  <span className="text-xl text-white/40 line-through">
                    {formatPrice(product.comparePrice)}
                  </span>
                  {discount && (
                    <Badge className="bg-electric-red/10 text-electric-red border-electric-red/30">
                      Save {discount}%
                    </Badge>
                  )}
                </>
              )}
            </div>

            {/* Stock indicator */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full animate-pulse ${
                  product.stock === 0
                    ? "bg-electric-red"
                    : product.stock <= 5
                    ? "bg-yellow-400"
                    : "bg-electric-green"
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  product.stock === 0
                    ? "text-electric-red"
                    : product.stock <= 5
                    ? "text-yellow-400"
                    : "text-electric-green"
                }`}
              >
                {product.stock === 0
                  ? "Out of Stock"
                  : product.stock <= 5
                  ? `Only ${product.stock} left in stock!`
                  : "In Stock"}
              </span>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-white/60 leading-relaxed">{product.description}</p>
            )}

            {/* More details (long-form) */}
            {product.details && (
              <div className="rounded-xl border border-surface-border bg-surface2/40 p-4">
                <h2 className="text-sm font-semibold text-white/80 mb-2">Details</h2>
                <div className="text-white/55 text-sm leading-relaxed whitespace-pre-wrap">{product.details}</div>
              </div>
            )}

            {/* Add to Cart */}
            <AddToCartButton product={product} />

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-surface-border">
              {[
                { icon: Shield, label: "100% Authentic", sub: "Guaranteed genuine" },
                { icon: Truck, label: "Fast Shipping", sub: "Ships within 24 hours" },
                { icon: RotateCcw, label: "Easy Returns", sub: "30-day return policy" },
                { icon: Package, label: "Secure Packaging", sub: "Cards arrive perfect" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-xs text-white/40">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <ScrollReveal>
            <div className="border-t border-surface-border pt-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-display font-bold text-3xl text-white">
                  You Might <span className="text-gold">Also Like</span>
                </h2>
                <Link
                  href={`/shop?game=${product.game}`}
                  className="text-sm text-gold hover:text-gold-light transition-colors"
                >
                  View All →
                </Link>
              </div>
              <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {related.map((p) => (
                  <StaggerItem key={p.id}>
                    <ProductCard product={p as any} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </ScrollReveal>
        )}
      </div>
    </div>
  )
}
