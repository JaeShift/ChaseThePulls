"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { X, Check, Loader2 } from "lucide-react"

interface Selection {
  x: number
  y: number
  width: number
  height: number
}

interface ImageObjectSelectorProps {
  imageUrl: string
  onConfirm: (selection: Selection) => Promise<void>
  onClose: () => void
}

export function ImageObjectSelector({ imageUrl, onConfirm, onClose }: ImageObjectSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [start, setStart] = useState<{ x: number; y: number } | null>(null)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [processing, setProcessing] = useState(false)

  /** Convert a mouse event position to a 0–1 fraction within the container */
  function toFraction(e: React.MouseEvent | MouseEvent) {
    if (!containerRef.current) return { x: 0, y: 0 }
    const rect = containerRef.current.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    }
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const pos = toFraction(e)
    setStart(pos)
    setSelection(null)
    setDragging(true)
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging || !start) return
      const pos = toFraction(e)
      const x = Math.min(start.x, pos.x)
      const y = Math.min(start.y, pos.y)
      const width = Math.abs(pos.x - start.x)
      const height = Math.abs(pos.y - start.y)
      setSelection({ x, y, width, height })
    },
    [dragging, start]
  )

  const handleMouseUp = useCallback(() => {
    setDragging(false)
  }, [])

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
      return () => {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [dragging, handleMouseMove, handleMouseUp])

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const handleConfirm = async () => {
    if (!selection || selection.width < 0.02 || selection.height < 0.02) return
    setProcessing(true)
    try {
      await onConfirm(selection)
    } finally {
      setProcessing(false)
    }
  }

  const selectionStyle = selection
    ? {
        left:   `${selection.x * 100}%`,
        top:    `${selection.y * 100}%`,
        width:  `${selection.width * 100}%`,
        height: `${selection.height * 100}%`,
      }
    : null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative flex flex-col gap-4 rounded-2xl border border-surface-border bg-surface p-5 shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground text-lg">Select Object to Keep</h2>
            <p className="text-sm text-foreground/50 mt-0.5">
              Click and drag a rectangle around the object. Everything outside will become white.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-foreground/60 hover:bg-surface2 hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Image + selection canvas */}
        <div
          ref={containerRef}
          className="relative select-none rounded-xl overflow-hidden border border-surface-border bg-white cursor-crosshair"
          style={{ aspectRatio: "auto", maxHeight: "60vh" }}
          onMouseDown={handleMouseDown}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Select object"
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
          />

          {/* Dark overlay outside selection */}
          {selectionStyle && (
            <>
              {/* top */}
              <div className="absolute inset-x-0 top-0 bg-black/50 pointer-events-none" style={{ height: selectionStyle.top }} />
              {/* bottom */}
              <div className="absolute inset-x-0 bottom-0 bg-black/50 pointer-events-none" style={{ top: `calc(${selectionStyle.top} + ${selectionStyle.height})` }} />
              {/* left */}
              <div className="absolute bg-black/50 pointer-events-none" style={{ top: selectionStyle.top, height: selectionStyle.height, left: 0, width: selectionStyle.left }} />
              {/* right */}
              <div className="absolute bg-black/50 pointer-events-none" style={{ top: selectionStyle.top, height: selectionStyle.height, left: `calc(${selectionStyle.left} + ${selectionStyle.width})`, right: 0 }} />
              {/* selection border */}
              <div
                className="absolute border-2 border-white pointer-events-none"
                style={{ ...selectionStyle, boxShadow: "0 0 0 1px rgba(0,0,0,0.5)" }}
              />
            </>
          )}

          {!selectionStyle && !dragging && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-white/60 text-sm bg-black/40 rounded-lg px-3 py-1.5">
                Click and drag to select
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="rounded-xl border border-surface-border px-4 py-2 text-sm text-foreground/70 hover:bg-surface2 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selection || selection.width < 0.02 || selection.height < 0.02 || processing}
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-40"
          >
            {processing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
            ) : (
              <><Check className="h-4 w-4" /> Apply White Background</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
