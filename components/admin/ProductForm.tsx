"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Upload, X, Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { productSchema, type ProductInput } from "@/lib/validations"
import { slugify } from "@/lib/utils"
import { CATEGORY_LABELS } from "@/types"
import type { Product } from "@/types"

interface ProductFormProps {
  product?: Product
  mode: "create" | "edit"
}

const CATEGORIES = ["BOOSTER_PACK", "ETB", "BLISTER", "BOOSTER_BUNDLE", "UPC", "SPC"] as const

export function ProductForm({ product, mode }: ProductFormProps) {
  const router = useRouter()
  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      description: product?.description ?? "",
      price: product?.price ?? 0,
      comparePrice: product?.comparePrice ?? null,
      category: product?.category ?? "BOOSTER_PACK",
      stock: product?.stock ?? 0,
      featured: product?.featured ?? false,
      set: product?.set ?? "",
      images: product?.images ?? [],
    },
  })

  const name = watch("name")

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setValue("name", val)
    if (mode === "create") {
      setValue("slug", slugify(val))
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)
        const res = await fetch("/api/upload", { method: "POST", body: formData })
        const data = await res.json()
        if (data.url) {
          const newImages = [...images, data.url]
          setImages(newImages)
          setValue("images", newImages)
        }
      }
    } catch {
      toast({ title: "Upload failed", description: "Failed to upload image.", variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    setValue("images", newImages)
  }

  const onSubmit = async (data: ProductInput) => {
    setSaving(true)
    try {
      const url = mode === "edit" ? `/api/products/${product?.id}` : "/api/products"
      const method = mode === "edit" ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, images }),
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
                placeholder="Describe the product..."
                rows={4}
                {...register("description")}
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

            <div className="grid grid-cols-3 gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-surface-border group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center text-white/60 hover:text-electric-red opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-xs bg-gold/90 text-background font-medium">Main</span>
                  )}
                </div>
              ))}

              {/* Upload button */}
              <label className="aspect-[3/4] rounded-xl border-2 border-dashed border-surface-border hover:border-gold/50 flex flex-col items-center justify-center cursor-pointer text-white/40 hover:text-gold transition-all duration-200 group">
                <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading} />
                {uploading ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
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
              <Label>Category</Label>
              <Select
                defaultValue={product?.category ?? "BOOSTER_PACK"}
                onValueChange={(val) => setValue("category", val as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
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
