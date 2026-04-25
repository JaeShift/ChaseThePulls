import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="relative inline-block mb-8">
          <span className="font-display font-black text-[10rem] leading-none text-surface2 select-none">404</span>
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="w-20 h-20 text-accent animate-pulse" />
          </div>
        </div>
        <h1 className="font-display font-bold text-3xl text-foreground mb-4">Page Not Found</h1>
        <p className="text-foreground/50 mb-8 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="glow" asChild>
            <Link href="/">Go Home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/shop">Browse Shop</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}


