"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShoppingCart, Check, Minus, Plus } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { toast } from "@/components/ui/use-toast"

interface Product {
  id: string
  name: string
  price: number
  images: string[]
  category: string
  stock: number
}

export function AddToCartButton({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const { addItem, isLoading } = useCart()

  const handleAdd = async () => {
    if (product.stock === 0) return

    try {
      await addItem(product.id, quantity)
      setAdded(true)
      toast({
        title: "Added to cart! 🎴",
        description: `${quantity}× ${product.name}`,
      })
      setTimeout(() => setAdded(false), 2000)
    } catch {
      toast({
        title: "Error",
        description: "Failed to add to cart. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (product.stock === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="w-full py-4 rounded-xl text-center font-bold text-white/30 border border-surface-border bg-surface cursor-not-allowed">
          Out of Stock
        </div>
        <p className="text-sm text-white/40 text-center">
          Sign up to get notified when this item is back in stock.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Quantity Selector */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-white/50">Quantity</span>
        <div className="flex items-center rounded-lg border border-surface-border overflow-hidden">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-gold hover:bg-gold/10 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-12 text-center font-bold text-white">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
            disabled={quantity >= product.stock}
            className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-gold hover:bg-gold/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        {product.stock <= 10 && (
          <span className="text-xs text-yellow-400">Only {product.stock} left!</span>
        )}
      </div>

      {/* Add to Cart Button */}
      <motion.button
        onClick={handleAdd}
        disabled={isLoading || added}
        whileTap={{ scale: 0.97 }}
        className="relative w-full py-4 rounded-xl font-bold text-lg overflow-hidden bg-gold text-background shadow-lg shadow-gold/20 hover:bg-gold-light transition-colors disabled:opacity-80"
      >
        <AnimatePresence mode="wait">
          {added ? (
            <motion.span
              key="added"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Added to Cart!
            </motion.span>
          ) : isLoading ? (
            <motion.span
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2"
            >
              <div className="w-4 h-4 border-2 border-background/40 border-t-background rounded-full animate-spin" />
              Adding...
            </motion.span>
          ) : (
            <motion.span
              key="add"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </motion.span>
          )}
        </AnimatePresence>

        {/* Ripple on added */}
        <AnimatePresence>
          {added && (
            <motion.div
              key="ripple"
              initial={{ scale: 0, opacity: 0.4 }}
              animate={{ scale: 4, opacity: 0 }}
              exit={{}}
              className="absolute inset-0 rounded-xl bg-white"
              style={{ originX: 0.5, originY: 0.5 }}
            />
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
