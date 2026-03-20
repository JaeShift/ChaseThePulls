"use client"

import { SessionProvider } from "next-auth/react"
import { CartProvider } from "@/context/CartContext"
import { Toaster } from "@/components/ui/toaster"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        {children}
        <Toaster />
      </CartProvider>
    </SessionProvider>
  )
}


