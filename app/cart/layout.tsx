import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Your Cart",
  description: "Review your cart and proceed to secure checkout for your Pokémon TCG products.",
  robots: { index: false, follow: false },
}

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children
}


