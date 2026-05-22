"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Check, Eraser, Loader2, RotateCcw, X } from "lucide-react"

interface ImageShadowEraserProps {
  imageUrl: string
  onConfirm: (editedImageUrl: string) => Promise<void>
  onClose: () => void
}

function pointerPosition(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  }
}

/** Gray shadow on white — not colorful/dark product pixels. */
function isShadowLikePixel(r: number, g: number, b: number, a: number) {
  if (a < 8) return false

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max > 248 && min > 242) return false

  const chroma = max - min
  const lightness = (max + min) / 2

  if (chroma > 26) return false
  if (lightness < 88) return false

  if (chroma <= 22 && lightness >= 118 && lightness <= 246) return true

  return false
}

function eraseShadowAt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number
): boolean {
  const canvas = ctx.canvas
  const r = Math.ceil(radius)
  const left = Math.max(0, Math.floor(x - radius))
  const top = Math.max(0, Math.floor(y - radius))
  const right = Math.min(canvas.width, Math.ceil(x + radius))
  const bottom = Math.min(canvas.height, Math.ceil(y + radius))
  const width = right - left
  const height = bottom - top
  if (width <= 0 || height <= 0) return false

  const imageData = ctx.getImageData(left, top, width, height)
  const data = imageData.data
  const r2 = radius * radius
  let changed = false

  for (let py = 0; py < height; py += 1) {
    for (let px = 0; px < width; px += 1) {
      const cx = left + px
      const cy = top + py
      const dx = cx - x
      const dy = cy - y
      if (dx * dx + dy * dy > r2) continue

      const i = (py * width + px) * 4
      const red = data[i]
      const green = data[i + 1]
      const blue = data[i + 2]
      const alpha = data[i + 3]

      if (!isShadowLikePixel(red, green, blue, alpha)) continue

      data[i] = 255
      data[i + 1] = 255
      data[i + 2] = 255
      data[i + 3] = 255
      changed = true
    }
  }

  if (changed) {
    ctx.putImageData(imageData, left, top)
  }

  return changed
}

export function ImageShadowEraser({ imageUrl, onConfirm, onClose }: ImageShadowEraserProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)

  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [brushSize, setBrushSize] = useState(28)
  const [processing, setProcessing] = useState(false)
  const [hasEdits, setHasEdits] = useState(false)

  const redrawBaseImage = useCallback(() => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image || !image.naturalWidth || !image.naturalHeight) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0)
    setHasEdits(false)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadImage() {
      setLoaded(false)
      setLoadError(null)
      setHasEdits(false)
      imageRef.current = null

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }

      try {
        const res = await fetch("/api/admin/product-image-source", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl }),
        })

        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(data.error ?? "Could not load this image for editing.")
        }

        const blob = await res.blob()
        const objectUrl = URL.createObjectURL(blob)
        objectUrlRef.current = objectUrl

        const image = new Image()
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve()
          image.onerror = () => reject(new Error("Could not decode image."))
          image.src = objectUrl
        })

        if (cancelled) return

        imageRef.current = image
        setLoaded(true)
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Could not load this image for editing.")
        }
      }
    }

    void loadImage()

    return () => {
      cancelled = true
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [imageUrl])

  useEffect(() => {
    if (!loaded) return
    redrawBaseImage()
  }, [loaded, redrawBaseImage])

  const paintStroke = useCallback(
    (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const radius = brushSize / 2
      const distance = Math.hypot(to.x - from.x, to.y - from.y)
      const step = Math.max(2, radius / 2)
      const steps = Math.max(1, Math.ceil(distance / step))
      let changed = false

      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps
        const x = from.x + (to.x - from.x) * t
        const y = from.y + (to.y - from.y) * t
        if (eraseShadowAt(ctx, x, y, radius)) {
          changed = true
        }
      }

      if (changed) {
        setHasEdits(true)
      }
    },
    [brushSize]
  )

  const handlePointerDown = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas || !loaded) return

    drawingRef.current = true
    const point = pointerPosition(canvas, clientX, clientY)
    lastPointRef.current = point
    paintStroke(point, point)
  }

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!drawingRef.current) return

    const canvas = canvasRef.current
    if (!canvas) return

    const point = pointerPosition(canvas, clientX, clientY)
    const last = lastPointRef.current
    if (last) {
      paintStroke(last, point)
    }
    lastPointRef.current = point
  }

  const stopDrawing = () => {
    drawingRef.current = false
    lastPointRef.current = null
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const handleApply = async () => {
    const canvas = canvasRef.current
    if (!canvas || !hasEdits) return

    setProcessing(true)
    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/png")
      })

      if (!blob) {
        throw new Error("Could not export edited image.")
      }

      const formData = new FormData()
      formData.append("file", new File([blob], "product-image-erased.png", { type: "image/png" }))
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = (await res.json()) as { url?: string; error?: string }

      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Upload failed.")
      }

      await onConfirm(data.url)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not save edited image.")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative flex w-full max-w-3xl flex-col gap-4 rounded-2xl border border-surface-border bg-surface p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Erase shadow</h2>
            <p className="mt-0.5 text-sm text-foreground/50">
              Paint over gray shadow only — product colors stay protected. Shadow pixels turn white.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-foreground/60 transition-colors hover:bg-surface2 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-surface-border bg-surface2/60 px-4 py-3">
          <label className="flex items-center gap-2 text-sm text-foreground/70">
            <Eraser className="h-4 w-4 text-accent" />
            Brush size
            <input
              type="range"
              min={8}
              max={96}
              step={2}
              value={brushSize}
              onChange={(event) => setBrushSize(Number(event.target.value))}
              className="w-32 accent-accent"
            />
            <span className="w-8 font-mono text-xs text-foreground/50">{brushSize}</span>
          </label>
          <button
            type="button"
            onClick={redrawBaseImage}
            disabled={!loaded || processing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:bg-surface disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-surface-border bg-white">
          {loadError ? (
            <p className="p-8 text-center text-sm text-electric-red">{loadError}</p>
          ) : null}
          {!loaded && !loadError ? (
            <div className="flex items-center justify-center gap-2 p-16 text-sm text-foreground/50">
              <Loader2 className="h-5 w-5 animate-spin text-accent" />
              Loading image…
            </div>
          ) : null}
          <canvas
            ref={canvasRef}
            className={`mx-auto block max-h-[60vh] w-full cursor-crosshair touch-none ${
              loaded && !loadError ? "block" : "hidden"
            }`}
            onMouseDown={(event) => handlePointerDown(event.clientX, event.clientY)}
            onMouseMove={(event) => handlePointerMove(event.clientX, event.clientY)}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={(event) => {
              event.preventDefault()
              const touch = event.touches[0]
              if (touch) handlePointerDown(touch.clientX, touch.clientY)
            }}
            onTouchMove={(event) => {
              event.preventDefault()
              const touch = event.touches[0]
              if (touch) handlePointerMove(touch.clientX, touch.clientY)
            }}
            onTouchEnd={stopDrawing}
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="rounded-xl border border-surface-border px-4 py-2 text-sm text-foreground/70 transition-colors hover:bg-surface2 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!loaded || !hasEdits || processing}
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-40"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Save changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
