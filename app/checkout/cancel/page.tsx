import Link from "next/link"
import { XCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CheckoutCancelPage() {
  return (
    <div className="flex min-h-screen items-center justify-center pb-16 pt-32 sm:pt-36">
      <div className="max-w-lg mx-auto px-4 text-center">
        <XCircle className="w-24 h-24 text-electric-red mx-auto mb-6" />
        <h1 className="font-display font-bold text-4xl text-foreground mb-4">Payment Cancelled</h1>
        <p className="text-foreground/60 mb-8">No worries! Your cart has been saved. Try again when you&apos;re ready.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="glow" asChild>
            <Link href="/cart"><ArrowLeft className="w-4 h-4 mr-1" /> Back to Cart</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
