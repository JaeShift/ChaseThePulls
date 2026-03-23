"use client"

import { useLayoutEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Upload, X, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { productSchema, type ProductInput } from "@/lib/validations"
import { slugify } from "@/lib/utils"
import { SUBTABS_BY_GAME } from "@/lib/game-subtabs"
import { CATEGORY_LABELS, GAME_LABELS, type ProductGame } from "@/types"
import type { Product } from "@/types"

interface ProductFormProps {
  product?: Product
  mode: "create" | "edit"
}

const CATEGORIES = [
  "BOOSTER_PACK",
  "BOOSTER_BOX",
  "BOOSTER_BUNDLE",
  "STARTER_STRUCTURE_DECK",
  "COLLECTION_BOX",
  "ACCESSORIES",
  "ETB",
  "BLISTER",
  "UPC",
  "SPC",
  "TIN",
  "BOXED_SET",
] as const

const GAMES: ProductGame[] = ["ONE_PIECE", "MAGIC_THE_GATHERING", "POKEMON", "YUGIOH"]

/** Instant local preview — avoids waiting on FileReader (large files felt “broken”). */
function previewUrlForFile(file: File): string {
  return URL.createObjectURL(file)
}

type PendingRow = { id: string; preview: string; status: "uploading" | "failed" }

type ImageState = { remotes: string[]; pending: PendingRow[] }

export function ProductForm({ product, mode }: ProductFormProps) {
  const router = useRouter()
  const [imageState, setImageState] = useState<ImageState>(() => ({
    remotes: product?.images ?? [],
    pending: [],
  }))
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      description: product?.description ?? "",
      details: product?.details ?? "",
      price: product?.price ?? 0,
      comparePrice: product?.comparePrice ?? null,
      category: product?.category ?? "BOOSTER_PACK",
      game: product?.game ?? "POKEMON",
      subcategory: product?.subcategory ?? "TRADING_CARD_GAME",
      stock: product?.stock ?? 0,
      featured: product?.featured ?? false,
      set: product?.set ?? "",
      images: product?.images ?? [],
    },
  })

  const { remotes: images, pending: pendingUploads } = imageState

  useLayoutEffect(() => {
    setValue("images", imageState.remotes, { shouldValidate: false, shouldDirty: true })
  }, [imageState.remotes, setValue])

  const name = watch("name")
  const selectedGame = (watch("game") ?? "POKEMON") as ProductGame
  const subtabOptions = SUBTABS_BY_GAME[selectedGame]

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setValue("name", val)
    if (mode === "create") {
      setValue("slug", slugify(val))
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const list = input.files
    if (!list?.length) return
    /** Copy before clearing — FileList is live; `input.value = ""` empties it. */
    const files = Array.from(list)
    input.value = ""

    setUploading(true)
    try {
      for (const file of files) {
        const id =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `pending-${Date.now()}-${Math.random()}`

        const preview = previewUrlForFile(file)
        setImageState((prev) => ({
          ...prev,
          pending: [...prev.pending, { id, preview, status: "uploading" }],
        }))

        try {
          const formData = new FormData()
          formData.append("file", file)
          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
            credentials: "same-origin",
          })
          let data: { url?: string; error?: string; hint?: string; code?: string } = {}
          try {
            data = await res.json()
          } catch {
            data = {}
          }

          if (!res.ok) {
            setImageState((prev) => ({
              ...prev,
              pending: prev.pending.map((p) =>
                p.id === id ? { ...p, status: "failed" as const } : p
              ),
            }))
            const detail = [data.error, data.hint].filter(Boolean).join(" — ")
            toast({
              title: data.code === "NOT_ADMIN" ? "Admin required" : "Upload failed",
              description:
                detail ||
                `Server error (${res.status}). See toast details or server terminal.`,
              variant: "destructive",
            })
            continue
          }

          const url = data.url
          if (!url) {
            setImageState((prev) => ({
              ...prev,
              pending: prev.pending.map((p) =>
                p.id === id ? { ...p, status: "failed" as const } : p
              ),
            }))
            toast({
              title: "Upload failed",
              description: "No image URL returned.",
              variant: "destructive",
            })
            continue
          }

          /** One state commit: add remote + drop pending — avoids a frame with neither. */
          setImageState((prev) => {
            const pending = prev.pending.filter((p) => {
              if (p.id !== id) return true
              if (p.preview.startsWith("blob:")) URL.revokeObjectURL(p.preview)
              return false
            })
            return { remotes: [...prev.remotes, url], pending }
          })
        } catch {
          setImageState((prev) => ({
            ...prev,
            pending: prev.pending.map((p) =>
              p.id === id ? { ...p, status: "failed" as const } : p
            ),
          }))
          toast({ title: "Upload failed", description: "Network error.", variant: "destructive" })
        }
      }
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setImageState((prev) => ({
      ...prev,
      remotes: prev.remotes.filter((_, i) => i !== index),
    }))
  }

  const dismissPending = (pendingId: string) => {
    setImageState((prev) => ({
      ...prev,
      pending: prev.pending.filter((p) => {
        if (p.id !== pendingId) return true
        if (p.preview.startsWith("blob:")) URL.revokeObjectURL(p.preview)
        return false
      }),
    }))
  }

  const onSubmit = async (data: ProductInput) => {
    setSaving(true)
    try {
      const url = mode === "edit" ? `/api/products/${product?.id}` : "/api/products"
      const method = mode === "edit" ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, images: imageState.remotes }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast({ title: "Error", description: err.error ?? "Failed to save product.", variant: "destructive" })
        return
      }

      toast({ title: mode === "edit" ? "Product updated!" : "Product created!", variant: "success" })
      router.push("/admin/products")
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-4">
            <h2 className="font-semibold text-white">Product Information</h2>

            <div className="space-y-1.5">
              <Label>Product Name</Label>
              <Input
                placeholder="e.g., Prismatic Evolutions Booster Pack"
                {...register("name")}
                onChange={handleNameChange}
              />
              {errors.name && <p className="text-xs text-electric-red">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Slug (URL)</Label>
              <Input placeholder="e.g., prismatic-evolutions-booster-pack" {...register("slug")} />
              {errors.slug && <p className="text-xs text-electric-red">{errors.slug.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Short summary for cards and search (1–2 sentences)..."
                rows={4}
                {...register("description")}
              />
            </div>

            <div className="space-y-1.5">
              <Label>More details</Label>
              <p className="text-xs text-white/40 -mt-0.5 mb-1">
                Extra info for the product page: specs, what&apos;s in the box, size, materials, care, etc.
              </p>
              <Textarea
                placeholder="Optional — longer text shown below the short description on the storefront..."
                rows={8}
                className="min-h-[180px] font-mono text-sm"
                {...register("details")}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Set Name</Label>
              <Input placeholder="e.g., Prismatic Evolutions" {...register("set")} />
            </div>
          </div>

          {/* Images */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-4">
            <h2 className="font-semibold text-white">Product Images</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 min-w-0">
              {images.map((img, i) => (
                <div
                  key={`img-${i}-${img.slice(-32)}`}
                  className="relative aspect-[3/4] min-h-[140px] min-w-0 w-full rounded-xl overflow-hidden border border-surface-border bg-surface2 group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/90 flex items-center justify-center text-white/80 hover:text-electric-red opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-xs bg-gold/90 text-background font-medium z-10">
                      Main
                    </span>
                  )}
                </div>
              ))}

              {pendingUploads.map(({ id, preview, status }) => (
                <div
                  key={id}
                  className={`relative aspect-[3/4] min-h-[140px] min-w-0 w-full rounded-xl overflow-hidden border bg-surface2 ring-1 ${
                    status === "failed"
                      ? "border-electric-red/50 ring-electric-red/20"
                      : "border-gold/40 ring-gold/20"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  {status === "uploading" && (
                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/80 to-transparent py-3 pt-8">
                      <Loader2 className="h-5 w-5 shrink-0 animate-spin text-gold" />
                      <span className="text-[11px] font-medium text-white/90">Uploading…</span>
                    </div>
                  )}
                  {status === "failed" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-end bg-black/55 p-2 pb-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-electric-red mb-2 text-center px-1">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>Couldn&apos;t upload — fix env or try again</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => dismissPending(id)}
                        className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/90 hover:bg-white/20"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Upload button */}
              <label className="aspect-[3/4] min-w-0 w-full rounded-xl border-2 border-dashed border-surface-border hover:border-gold/50 flex flex-col items-center justify-center cursor-pointer text-white/40 hover:text-gold transition-all duration-200 group">
                <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading} />
                {uploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-gold" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 mb-2" />
                    <span className="text-xs text-center px-2">Upload Image</span>
                  </>
                )}
              </label>
            </div>
            {errors.images && <p className="text-xs text-electric-red">{errors.images.message as string}</p>}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Pricing */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-4">
            <h2 className="font-semibold text-white">Pricing</h2>
            <div className="space-y-1.5">
              <Label>Price ($)</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" {...register("price")} />
              {errors.price && <p className="text-xs text-electric-red">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Compare-at Price ($) <span className="text-white/40">(optional)</span></Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" {...register("comparePrice")} />
            </div>
          </div>

          {/* Category & Stock */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-4">
            <h2 className="font-semibold text-white">Organization</h2>
            <div className="space-y-1.5">
              <Label>Game / franchise</Label>
              <Select
                value={watch("game") ?? "POKEMON"}
                onValueChange={(val) => {
                  setValue("game", val as ProductGame)
                  setValue("subcategory", "TRADING_CARD_GAME")
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select game" />
                </SelectTrigger>
                <SelectContent>
                  {GAMES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {GAME_LABELS[g]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.game && <p className="text-xs text-electric-red">{errors.game.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Shop section</Label>
              <Select
                value={watch("subcategory") ?? "TRADING_CARD_GAME"}
                onValueChange={(val) => setValue("subcategory", val as ProductInput["subcategory"])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {subtabOptions.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subcategory && (
                <p className="text-xs text-electric-red">{errors.subcategory.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Product type</Label>
              <Select
                value={watch("category") ?? "BOOSTER_PACK"}
                onValueChange={(val) => setValue("category", val as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-electric-red">{errors.category.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Stock Quantity</Label>
              <Input type="number" min="0" placeholder="0" {...register("stock")} />
              {errors.stock && <p className="text-xs text-electric-red">{errors.stock.message}</p>}
            </div>

            <div className="flex items-center gap-3">
              <input
                id="featured"
                type="checkbox"
                className="w-4 h-4 rounded border-surface-border bg-surface accent-gold"
                {...register("featured")}
              />
              <Label htmlFor="featured">Featured product</Label>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button type="submit" variant="glow" size="lg" className="w-full" disabled={saving}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === "edit" ? "Saving..." : "Creating..."}
                </span>
              ) : (
                mode === "edit" ? "Save Changes" : "Create Product"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => router.push("/admin/products")}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
