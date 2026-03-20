"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, Zap } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/context/CartContext"
import { formatPrice } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export function CartDrawer() {
  const { cart, isOpen, closeCart, removeItem, updateQuantity, subtotal, itemCount } = useCart()

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md p-0">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-surface-border">
          <SheetTitle className="flex items-center gap-2 font-display tracking-wider text-white">
            <ShoppingCart className="w-5 h-5 text-gold" />
            Cart
            {itemCount > 0 && (
              <span className="ml-auto text-sm font-normal text-white/60">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!cart?.items.length ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-20 h-20 rounded-full bg-surface2 border border-surface-border flex items-center justify-center mb-4">
                <Zap className="w-10 h-10 text-gold/30" />
              </div>
              <p className="text-white/60 font-medium mb-2">Your cart is empty</p>
              <p className="text-white/30 text-sm mb-6">Add some packs to get started!</p>
              <Button variant="glow" size="sm" onClick={closeCart} asChild>
                <Link href="/shop">
                  Browse Shop <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-4 p-3 rounded-xl border border-surface-border bg-surface2/50 group"
                  >
                    {/* Product image */}
                    <div className="relative w-20 h-24 rounded-lg overflow-hidden bg-surface flex-shrink-0">
                      {item.product.images[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Zap className="w-8 h-8 text-gold/30" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/shop/${item.product.slug}`}
                        onClick={closeCart}
                        className="text-sm font-medium text-white hover:text-gold transition-colors line-clamp-2"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-gold font-semibold mt-1">
                        {formatPrice(item.product.price)}
                      </p>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center rounded-lg border border-surface-border overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="w-7 h-7 flex items-center justify-center text-white/60 hover:text-gold hover:bg-gold/10 transition-colors disabled:opacity-30"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="w-7 h-7 flex items-center justify-center text-white/60 hover:text-gold hover:bg-gold/10 transition-colors disabled:opacity-30"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-white/30 hover:text-electric-red transition-colors ml-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        {cart?.items.length ? (
          <div className="border-t border-surface-border px-6 py-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Subtotal</span>
                <span className="text-white font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Shipping</span>
                <span className="text-electric-green text-sm font-medium">Calculated at checkout</span>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span className="text-white">Total</span>
              <span className="text-gold text-lg">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="glow" size="lg" className="w-full" asChild>
                <Link href="/cart" onClick={closeCart}>
                  View Cart & Checkout <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={closeCart}>
                Continue Shopping
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
