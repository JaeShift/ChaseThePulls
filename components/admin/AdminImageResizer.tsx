"use client"

import { useState, useTransition, useEffect } from "react"
import { useSession } from "next-auth/react"
import { ZoomIn, ZoomOut, Save, Check, Layers } from "lucide-react"
import {
  getProductImageZoom,
  updateProductImageZoom,
  setProductImageZoom,
  PRODUCT_IMAGE_ZOOM_MAX,
} from "@/lib/product-image-adjustments"

interface AdminImageResizerProps {
  productId: string
  images: string[]
  activeIndex: number
  /** Called with the updated images array so the parent can re-render */
  onUpdate: (images: string[]) => void
}

export function AdminImageResizer({ productId, images, activeIndex, onUpdate }: AdminImageResizerProps) {
  const { data: session } = useSession()
  const [localImages, setLocalImages] = useState<string[]>(images)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Keep local copy in sync when the parent updates images (e.g. after save)
  useEffect(() => {
    setLocalImages(images)
  }, [images])

  if (session?.user?.role !== "ADMIN") return null

  const zoom = getProductImageZoom(localImages[activeIndex] ?? localImages[0] ?? "")

  function adjust(direction: 1 | -1) {
    const updated = localImages.map((img, i) =>
      i === activeIndex ? updateProductImageZoom(img, direction) : img
    )
    setLocalImages(updated)
    onUpdate(updated)
    setSaved(false)
  }

  function zoomAll() {
    const updated = localImages.map((img) => setProductImageZoom(img, zoom))
    setLocalImages(updated)
    onUpdate(updated)
    setSaved(false)
  }

  function save() {
    startTransition(async () => {
      await fetch("/api/admin/product-image-zoom", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, images: localImages }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[20] flex items-center gap-1 rounded-full border border-white/20 bg-black/70 px-3 py-1.5 backdrop-blur-sm shadow-lg whitespace-nowrap">
      <button
        type="button"
        onClick={() => adjust(-1)}
        className="rounded-full p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
        title="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
      </button>

      <span className="text-center text-sm font-semibold text-white select-none leading-none">
        <span>{zoom.toFixed(1)}</span>
        <span className="text-white/40 font-normal"> / {PRODUCT_IMAGE_ZOOM_MAX}</span>
      </span>

      <button
        type="button"
        onClick={() => adjust(1)}
        className="rounded-full p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
        title="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
      </button>

      <div className="mx-1 h-4 w-px bg-white/20" />

      {localImages.length > 1 && (
        <>
          <button
            type="button"
            onClick={zoomAll}
            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            title="Apply this zoom to all photos"
          >
            <Layers className="h-3.5 w-3.5" />
            Zoom All
          </button>
          <div className="mx-1 h-4 w-px bg-white/20" />
        </>
      )}

      <button
        type="button"
        onClick={save}
        disabled={isPending || saved}
        className="rounded-full p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
        title="Save"
      >
        {saved ? <Check className="h-4 w-4 text-green-400" /> : <Save className="h-4 w-4" />}
      </button>
    </div>
  )
}
