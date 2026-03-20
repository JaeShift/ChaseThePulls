"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { CheckCircle, Package, ArrowRight, Zap } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useCart } from "@/context/CartContext"
import { useSearchParams } from "next/navigation"

export default function CheckoutSuccessPage() {
  const { clearCart } = useCart()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const cleared = useRef(false)

  useEffect(() => {
    if (!cleared.current) {
      cleared.current = true
      clearCart()
    }
  }, [clearCart])

  return (
    <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
      <div className="max-w-lg mx-auto px-4 text-center">
        {/* Success animation */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="relative w-28 h-28 mx-auto mb-8"
        >
          {/* Outer ring */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="absolute inset-0 rounded-full border-4 border-electric-green/20"
          />
          {/* Glow */}
          <div className="absolute inset-0 rounded-full bg-electric-green/10 blur-xl" />
          {/* Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <CheckCircle className="w-20 h-20 text-electric-green" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <h1 className="font-display font-bold text-4xl text-white">
            Order Confirmed!
          </h1>
          <p className="text-white/60 text-lg">
            Thank you for your purchase! You&apos;ll receive a confirmation email shortly.
          </p>

          {sessionId && (
            <div className="inline-block px-4 py-2 rounded-lg bg-surface border border-surface-border">
              <p className="text-xs text-white/40">Order Reference</p>
              <p className="text-gold font-mono text-sm">{sessionId.slice(-12).toUpperCase()}</p>
            </div>
          )}

          {/* What's next */}
          <div className="mt-8 p-6 rounded-2xl border border-surface-border bg-surface text-left space-y-4">
            <h2 className="font-semibold text-white mb-3">What happens next?</h2>
            {[
              { icon: CheckCircle, text: "Order confirmation email sent to your inbox" },
              { icon: Package, text: "Your order will be packed and shipped within 24-48 hours" },
              { icon: Zap, text: "Tracking information will be emailed once shipped" },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-3">
                <Icon className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                <p className="text-white/60 text-sm">{text}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button variant="glow" size="lg" className="flex-1" asChild>
              <Link href="/account/orders">
                <Package className="w-4 h-4 mr-2" /> View My Orders
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="flex-1" asChild>
              <Link href="/shop">
                Continue Shopping <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
