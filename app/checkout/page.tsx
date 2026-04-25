"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Lock, ArrowRight, ShoppingCart, Package } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatPrice } from "@/lib/utils"
import { useSession } from "next-auth/react"

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, itemCount, subtotal } = useCart()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const TAX_RATE = 0.08
  const tax = subtotal * TAX_RATE
  const shipping = subtotal > 50 ? 0 : 6.99
  const total = subtotal + tax + shipping

  const handleCheckout = async () => {
    if (!cart || itemCount === 0) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session?.user?.email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Failed to start checkout. Please try again.")
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (itemCount === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 pt-32 sm:pt-36">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-surface border border-surface-border flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-10 h-10 text-foreground/20" />
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground mb-3">Your cart is empty</h1>
          <p className="text-foreground/50 mb-6">Add some products to your cart first.</p>
          <Button variant="glow" asChild>
            <Link href="/shop">Browse Shop</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 pb-16 pt-32 sm:px-6 sm:pt-36 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display font-bold text-4xl text-foreground mb-2">Review Order</h1>
        <p className="text-foreground/50 mb-10">Double-check your items before heading to Stripe.</p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-3 space-y-3">
            {cart?.items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 p-4 rounded-2xl border border-surface-border bg-surface"
              >
                <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-surface2 flex-shrink-0 border border-surface-border">
                  {item.product.images[0] ? (
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-contain p-1"
                      sizes="64px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="w-6 h-6 text-foreground/20" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground line-clamp-2 text-sm">{item.product.name}</p>
                  {item.product.set && (
                    <p className="text-xs text-foreground/40 mt-0.5">{item.product.set}</p>
                  )}
                  <p className="text-xs text-foreground/50 mt-1">Qty: {item.quantity}</p>
                </div>
                <p className="font-bold text-accent text-sm flex-shrink-0">
                  {formatPrice(item.product.price * item.quantity)}
                </p>
              </motion.div>
            ))}

            <div className="pt-2">
              <Link href="/cart" className="text-sm text-accent hover:text-accent-light transition-colors">
                ← Edit Cart
              </Link>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-surface-border bg-surface p-6 sticky top-24 space-y-4">
              <h2 className="font-display font-bold text-xl text-foreground">Order Total</h2>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/60">Subtotal</span>
                  <span className="text-foreground">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/60">Shipping</span>
                  <span className={shipping === 0 ? "text-electric-green" : "text-foreground"}>
                    {shipping === 0 ? "FREE" : formatPrice(shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/60">Est. Tax (8%)</span>
                  <span className="text-foreground">{formatPrice(tax)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-lg">
                <span className="text-foreground">Total</span>
                <span className="text-accent">{formatPrice(total)}</span>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-electric-red text-sm p-3 bg-electric-red/10 rounded-lg border border-electric-red/20"
                >
                  {error}
                </motion.p>
              )}

              <Button
                variant="glow"
                size="lg"
                className="w-full"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-background/50 border-t-background rounded-full animate-spin" />
                    Redirecting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Proceed to Secure Checkout
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>

              <p className="text-center text-xs text-foreground/30 flex items-center justify-center gap-1.5">
                <Lock className="w-3 h-3" />
                Secured by Stripe. We never store your card details.
              </p>

              <div className="flex items-center justify-center gap-2 pt-1">
                {["VISA", "MC", "AMEX", "DISCOVER"].map((card) => (
                  <span key={card} className="px-2 py-0.5 rounded text-xs text-foreground/30 border border-surface-border font-mono">
                    {card}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
