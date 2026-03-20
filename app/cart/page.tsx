"use client"

import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Lock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useCart } from "@/context/CartContext"
import { formatPrice } from "@/lib/utils"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

export default function CartPage() {
  const { cart, isLoading, removeItem, updateQuantity, subtotal, itemCount, clearCart } = useCart()
  const { data: session } = useSession()
  const router = useRouter()

  const TAX_RATE = 0.08
  const tax = subtotal * TAX_RATE
  const shipping = subtotal > 50 ? 0 : 6.99
  const total = subtotal + tax + shipping

  const handleCheckout = async () => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems: cart?.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          email: session?.user?.email,
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast({ title: "Error", description: "Failed to initiate checkout.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Checkout failed. Please try again.", variant: "destructive" })
    }
  }

  if (isLoading && !cart) {
    return (
      <div className="pt-24 pb-16 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
            </div>
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-display font-bold text-4xl text-white mb-2">Your Cart</h1>
        <p className="text-white/50 mb-8">
          {itemCount === 0 ? "Your cart is empty" : `${itemCount} ${itemCount === 1 ? "item" : "items"}`}
        </p>

        {itemCount === 0 ? (
          <div className="text-center py-24">
            <div className="w-24 h-24 rounded-full bg-surface2 border border-surface-border flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-gold/30" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Nothing here yet</h2>
            <p className="text-white/50 mb-6">Add some packs to start your collection</p>
            <Button variant="glow" size="lg" asChild>
              <Link href="/shop">Browse Shop <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence mode="popLayout">
                {cart?.items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, margin: 0 }}
                    className="flex gap-4 p-4 rounded-2xl border border-surface-border bg-surface"
                  >
                    {/* Image */}
                    <div className="relative w-24 h-28 rounded-xl overflow-hidden bg-surface2 flex-shrink-0 border border-surface-border">
                      {item.product.images[0] ? (
                        <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="96px" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs text-center">No Image</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/shop/${item.product.slug}`} className="font-semibold text-white hover:text-gold transition-colors line-clamp-2">
                        {item.product.name}
                      </Link>
                      {item.product.set && (
                        <p className="text-xs text-white/40 mt-1">{item.product.set}</p>
                      )}
                      <p className="text-gold font-bold mt-1">{formatPrice(item.product.price)}</p>

                      <div className="flex items-center justify-between mt-3">
                        {/* Qty controls */}
                        <div className="flex items-center rounded-lg border border-surface-border overflow-hidden">
                          <button
                            onClick={() => {
                              if (item.quantity === 1) removeItem(item.id)
                              else updateQuantity(item.id, item.quantity - 1)
                            }}
                            className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-gold hover:bg-gold/10 transition-colors text-lg"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-10 text-center text-sm font-medium text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-gold hover:bg-gold/10 transition-colors disabled:opacity-30"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-white">
                            {formatPrice(item.product.price * item.quantity)}
                          </span>
                          <button onClick={() => removeItem(item.id)} className="text-white/30 hover:text-electric-red transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <div className="flex justify-between pt-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/shop"><ArrowRight className="w-4 h-4 mr-1 rotate-180" />Continue Shopping</Link>
                </Button>
                <Button variant="outline" size="sm" onClick={() => clearCart()}>
                  Clear Cart
                </Button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-4">
                <h2 className="font-display font-bold text-xl text-white">Order Summary</h2>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Subtotal</span>
                    <span className="text-white">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Shipping</span>
                    <span className={shipping === 0 ? "text-electric-green" : "text-white"}>
                      {shipping === 0 ? "Free" : formatPrice(shipping)}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-white/40">
                      Free shipping on orders over $50
                    </p>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Estimated Tax</span>
                    <span className="text-white">{formatPrice(tax)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span className="text-white">Total</span>
                  <span className="text-gold">{formatPrice(total)}</span>
                </div>

                <Button variant="glow" size="lg" className="w-full" onClick={handleCheckout}>
                  <Lock className="w-4 h-4 mr-2" /> Secure Checkout
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-white/30">
                  <Lock className="w-3 h-3" />
                  <span>Secured by Stripe</span>
                </div>

                {/* Accepted payment methods */}
                <div className="flex items-center justify-center gap-2 pt-2">
                  {["VISA", "MC", "AMEX", "DISCOVER"].map((card) => (
                    <span key={card} className="px-2 py-0.5 rounded text-xs text-white/30 border border-surface-border font-mono">
                      {card}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


