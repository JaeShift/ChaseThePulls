"use client"

import { useState } from "react"
import Image from "next/image"
import { Package } from "lucide-react"
import { HolographicCard } from "@/components/animations/HolographicCard"
import { AdminImageResizer } from "@/components/admin/AdminImageResizer"
import { getProductImageZoom } from "@/lib/product-image-adjustments"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"

interface ProductImageGalleryProps {
  productId: string
  initialImages: string[]
  color: string
  stock: number
  featured: boolean
  discount: number | null
}

export function ProductImageGallery({
  productId,
  initialImages,
  color,
  stock,
  featured,
  discount,
}: ProductImageGalleryProps) {
  const [images, setImages] = useState<string[]>(initialImages)
  const [activeIndex, setActiveIndex] = useState(0)

  const activeImage = images[activeIndex] ?? images[0]
  const zoom = getProductImageZoom(activeImage ?? "")

  return (
    <div className="space-y-4">
      <HolographicCard className="rounded-2xl" disabled>
        <div
          className="relative z-[15] aspect-[3/4] rounded-2xl border overflow-hidden"
          style={{ borderColor: `${color}25`, background: "#ffffff" }}
        >
          {/* Badges */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            {stock === 0 && (
              <Badge variant="secondary" className="bg-white/10 text-foreground/60 border-white/10">
                Sold Out
              </Badge>
            )}
            {featured && (
              <Badge className="bg-accent/20 text-accent border-accent/30">
                <Star className="w-3 h-3 mr-1 fill-accent" /> Featured
              </Badge>
            )}
          </div>
          {discount && (
            <div className="absolute top-4 right-4 z-10">
              <Badge className="bg-electric-red/20 text-electric-red border-electric-red/30">
                -{discount}% OFF
              </Badge>
            </div>
          )}

          {activeImage ? (
            <Image
              key={activeImage}
              src={activeImage}
              alt="Product image"
              fill
              className="z-[1] object-contain [object-position:center_60%]"
              style={{ transform: `scale(${zoom})` }}
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="w-24 h-24 text-foreground/10" />
            </div>
          )}

          <AdminImageResizer
            productId={productId}
            images={images}
            activeIndex={activeIndex}
            onUpdate={setImages}
          />
        </div>
      </HolographicCard>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.slice(0, 5).map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative w-16 h-20 rounded-lg overflow-hidden border-2 transition-colors cursor-pointer flex-shrink-0 ${
                i === activeIndex
                  ? "border-accent"
                  : "border-accent/30 hover:border-accent/70"
              }`}
              style={{ background: "#ffffff" }}
            >
              <Image src={img} alt={`View ${i + 1}`} fill className="object-contain p-1" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
