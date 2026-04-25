"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ShoppingCart, Star, Zap } from "lucide-react"
import { motion } from "framer-motion"
import { HolographicCard } from "@/components/animations/HolographicCard"
import { PackReveal } from "@/components/animations/PackReveal"
import { GameLogo } from "@/components/shop/GameLogo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCart } from "@/context/CartContext"
import { toast } from "@/components/ui/use-toast"
import { formatPrice, getDiscountPercent } from "@/lib/utils"
import { subtabLabel } from "@/lib/game-subtabs"
import { CATEGORY_LABELS, GAME_LABELS, GAME_COLORS, GAME_LOGO_BALANCE, type Product } from "@/types"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, isLoading } = useCart()
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  const [burst, setBurst] = useState(false)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (product.stock === 0) return
    setAdding(true)
    try {
      await addItem(product.id)
      setAdded(true)
      setBurst(true)
      toast({
        title: "Added to cart!",
        description: `${product.name} has been added to your cart.`,
        variant: "success",
      })
      setTimeout(() => setAdded(false), 2000)
      setTimeout(() => setBurst(false), 700)
    } catch {
      toast({ title: "Error", description: "Failed to add item.", variant: "destructive" })
    } finally {
      setAdding(false)
    }
  }

  const discount = product.comparePrice
    ? getDiscountPercent(product.price, product.comparePrice)
    : null

  const gameColor = GAME_COLORS[product.game]

  return (
    <HolographicCard className="rounded-2xl group">
      <PackReveal active={burst} color={gameColor} />
      <Link href={`/shop/${product.slug}`}>
        <div className="rounded-2xl border border-surface-border bg-surface overflow-hidden transition-all duration-300 group-hover:border-opacity-50"
          style={{
            borderColor: `${gameColor}35`,
          }}
        >
          {/* Image container */}
          <div className="relative aspect-[3/4] overflow-hidden bg-surface2">
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Zap
                    className="w-16 h-16 mx-auto mb-2"
                    style={{ color: gameColor, opacity: 0.3 }}
                  />
                  <p className="text-foreground/20 text-xs">No Image</p>
                </div>
              </div>
            )}

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {product.featured && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-accent/90 text-white">
                  <Star className="w-3 h-3 fill-slate-900" /> Featured
                </span>
              )}
              {discount && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-electric-red/90 text-white">
                  -{discount}%
                </span>
              )}
            </div>

            {/* Game franchise mark — logo only, no background container */}
            <div className="absolute top-2.5 right-2.5 z-[1] h-3.5 w-14 sm:w-[4.5rem] pointer-events-none" title={GAME_LABELS[product.game]}>
              <GameLogo
                game={product.game}
                balance={
                  product.game === "POKEMON" || product.game === "ONE_PIECE"
                    ? GAME_LOGO_BALANCE[product.game]
                    : 1
                }
                heightClassName="h-3.5"
                widthClassName="w-14 sm:w-[4.5rem]"
                className="[filter:drop-shadow(0_1px_4px_rgba(0,0,0,0.7))]"
                sizes="64px"
              />
            </div>

            {/* Quick add button - appears on hover */}
            <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
              <Button
                variant="glow"
                size="sm"
                className="w-full"
                onClick={handleAddToCart}
                disabled={product.stock === 0 || adding || isLoading}
              >
                {adding ? (
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 border border-background/50 border-t-background rounded-full animate-spin" />
                    Adding...
                  </span>
                ) : added ? (
                  <span className="flex items-center gap-2">✓ Added!</span>
                ) : product.stock === 0 ? (
                  "Out of Stock"
                ) : (
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" /> Add to Cart
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Card info */}
          <div className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-foreground/35 mb-0.5 truncate">
              {subtabLabel(product.game, product.subcategory)} · {CATEGORY_LABELS[product.category]}
            </p>
            {product.set && (
              <p className="text-xs text-foreground/40 mb-1 truncate">{product.set}</p>
            )}
            <h3 className="font-semibold text-foreground text-sm leading-tight mb-2 line-clamp-2 group-hover:text-accent transition-colors duration-200">
              {product.name}
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold" style={{ color: gameColor }}>
                  {formatPrice(product.price)}
                </span>
                {product.comparePrice && (
                  <span className="text-sm text-foreground/40 line-through">
                    {formatPrice(product.comparePrice)}
                  </span>
                )}
              </div>
              {/* Stock indicator */}
              {product.stock > 0 && product.stock <= 5 ? (
                <span className="text-xs text-electric-red font-medium">
                  Only {product.stock} left
                </span>
              ) : product.stock === 0 ? (
                <span className="text-xs text-foreground/40">Out of Stock</span>
              ) : (
                <span className="text-xs text-electric-green font-medium">In Stock</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </HolographicCard>
  )
}
