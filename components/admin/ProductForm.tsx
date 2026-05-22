"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Upload,
  X,
  Loader2,
  AlertCircle,
  ExternalLink,
  Copy,
  FlipHorizontal,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Scissors,
  Eraser,
  ChevronDown,
  Check,
  Link2,
} from "lucide-react"
import { ImageObjectSelector } from "@/components/admin/ImageObjectSelector"
import { ImageShadowEraser } from "@/components/admin/ImageShadowEraser"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { productSchema, type ProductInput } from "@/lib/validations"
import { amazonMediaImageKey, slugify } from "@/lib/utils"
import { getProductImageZoom, updateProductImageZoom, PRODUCT_IMAGE_ZOOM_MAX } from "@/lib/product-image-adjustments"
import { IMPORT_LINK_SOURCE_OPTIONS, type ImportLinkSource } from "@/lib/import-link-source"
import { SUBTABS_BY_GAME } from "@/lib/game-subtabs"
import { CATEGORY_LABELS, GAME_LABELS, type ProductGame } from "@/types"
import type { DraftProduct, Product } from "@/types"

interface ProductFormProps {
  product?: Product
  draft?: DraftProduct
  draftId?: string
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
  "CARD_BINDER",
  "TOP_LOADER",
  "CARD_SLEEVES",
  "PLAYMAT",
  "DECK_BOX",
] as const

const GAMES: ProductGame[] = ["MAGIC_THE_GATHERING", "POKEMON", "ONE_PIECE", "YUGIOH"]

/** Instant local preview — avoids waiting on FileReader (large files felt “broken”). */
function previewUrlForFile(file: File): string {
  return URL.createObjectURL(file)
}

type PendingRow = { id: string; preview: string; status: "uploading" | "failed" }

type ImageState = { remotes: string[]; pending: PendingRow[] }
type ReferenceImageVariant = { name: string; images: string[] }
type UploadImageSource = { kind: "file"; file: File } | { kind: "url"; url: string }

type ScrapedProductDraft = Partial<
  Pick<
    ProductInput,
    "name" | "details" | "price" | "comparePrice" | "sourceUrl" | "referenceImages"
  >
> & { browserScrapeWarning?: string; referenceImageVariants?: ReferenceImageVariant[] }

type DraftSaveResponse = {
  error?: string
  duplicateDraft?: { id: string; name?: string | null }
  export?: { folderPath?: string; failedImages?: string[] }
}

type ProductCategoryValue = (typeof CATEGORIES)[number]

type BatchDraftItem = {
  id: string
  url: string
  name: string
  price: string
  details: string
  category: ProductCategoryValue
  referenceImages: string[]
  referenceImageVariants: ReferenceImageVariant[]
  status?: "ready" | "failed"
  error?: string
}

function productUrlsFromText(value: string): string[] {
  const urls = Array.from(value.matchAll(/https?:\/\/\S+/gi))
    .map((match) => match[0].replace(/[),.;\]]+$/g, ""))
    .filter(Boolean)

  return Array.from(new Set(urls))
}

function localId(prefix: string) {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random()}`
}

function isImageFile(file: File) {
  return (
    file.type.startsWith("image/") ||
    /\.(avif|gif|jpe?g|png|webp)$/i.test(file.name)
  )
}

function imageUrlsFromDrop(dataTransfer: DataTransfer) {
  const values = [
    dataTransfer.getData("text/uri-list"),
    dataTransfer.getData("text/plain"),
  ]

  const html = dataTransfer.getData("text/html")
  const srcMatches = Array.from(html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)).map(
    (match) => match[1]
  )

  return Array.from(
    new Set(
      [...values, ...srcMatches]
        .flatMap((value) => value.split(/\r?\n/))
        .map((value) => value.trim())
        .filter((value) => /^https:\/\/.+\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i.test(value))
    )
  )
}

function batchDraftImages(item: BatchDraftItem): string[] {
  return Array.from(
    new Set([
      ...item.referenceImages,
      ...item.referenceImageVariants.flatMap((variant) => variant.images),
    ])
  )
}

function inferProductCategoryFromName(value: string): ProductCategoryValue | undefined {
  const name = value.toLowerCase()

  if (/\b(top[\s-]?loader|toploader)\b/.test(name)) return "TOP_LOADER"
  if (/\b(binder|album|portfolio)\b/.test(name)) return "CARD_BINDER"
  if (/\b(sleeve|sleeves|card sleeves)\b/.test(name)) return "CARD_SLEEVES"
  if (/\b(playmat|play mat|mat)\b/.test(name)) return "PLAYMAT"
  if (/\b(deck box|deckbox)\b/.test(name)) return "DECK_BOX"
  if (/\b(etb|elite trainer box)\b/.test(name)) return "ETB"
  if (/\b(booster box)\b/.test(name)) return "BOOSTER_BOX"
  if (/\b(booster bundle)\b/.test(name)) return "BOOSTER_BUNDLE"
  if (/\b(booster pack|pack)\b/.test(name)) return "BOOSTER_PACK"
  if (/\b(starter deck|structure deck)\b/.test(name)) return "STARTER_STRUCTURE_DECK"
  if (/\b(collection box|collector box)\b/.test(name)) return "COLLECTION_BOX"
  if (/\b(blister)\b/.test(name)) return "BLISTER"
  if (/\b(upc|ultra premium collection)\b/.test(name)) return "UPC"
  if (/\b(spc|special collection)\b/.test(name)) return "SPC"
  if (/\b(tin)\b/.test(name)) return "TIN"
  if (/\b(boxed set|box set)\b/.test(name)) return "BOXED_SET"
  if (/\b(accessory|accessories)\b/.test(name)) return "ACCESSORIES"

  return undefined
}

function subcategoryForProductCategory(category: ProductCategoryValue): ProductInput["subcategory"] {
  if (["ACCESSORIES", "CARD_BINDER", "TOP_LOADER", "CARD_SLEEVES", "PLAYMAT", "DECK_BOX"].includes(category)) {
    return "ACCESSORIES"
  }
  return "TRADING_CARD_GAME"
}

function toggleCloudinaryHorizontalFlip(url: string): string | null {
  try {
    const parsed = new URL(url)
    const uploadSegment = "/upload/"
    const uploadIndex = parsed.pathname.indexOf(uploadSegment)

    if (!parsed.hostname.endsWith("cloudinary.com") || uploadIndex === -1) {
      return null
    }

    const beforeUpload = parsed.pathname.slice(0, uploadIndex + uploadSegment.length)
    const afterUpload = parsed.pathname.slice(uploadIndex + uploadSegment.length)
    const parts = afterUpload.split("/")
    const flipIndex = parts.indexOf("a_hflip")

    if (flipIndex >= 0) {
      parts.splice(flipIndex, 1)
    } else {
      const versionIndex = parts.findIndex((part) => /^v\d+$/.test(part))
      parts.splice(versionIndex >= 0 ? versionIndex : 0, 0, "a_hflip")
    }

    parsed.pathname = `${beforeUpload}${parts.filter(Boolean).join("/")}`
    return parsed.toString()
  } catch {
    return null
  }
}

function isAmazonProductUrl(value: string | null | undefined): boolean {
  if (!value) return false
  try {
    const hostname = new URL(value).hostname.toLowerCase()
    return hostname === "amazon.com" || hostname.endsWith(".amazon.com")
  } catch {
    return false
  }
}

export function ProductForm({ product, draft, draftId, mode }: ProductFormProps) {
  const router = useRouter()
  const record = product ?? draft
  const [imageState, setImageState] = useState<ImageState>(() => ({
    remotes: record?.images ?? [],
    pending: [],
  }))
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draftSaving, setDraftSaving] = useState(false)
  const [importUrl, setImportUrl] = useState(record?.sourceUrl ?? "")
  const [importLinkSource, setImportLinkSource] = useState<ImportLinkSource>("amazon")
  const [importing, setImporting] = useState(false)
  const [rewritingDetails, setRewritingDetails] = useState(false)
  const [batchDrafting, setBatchDrafting] = useState(false)
  const [batchDraftItems, setBatchDraftItems] = useState<BatchDraftItem[]>([])
  const [importError, setImportError] = useState<string | null>(null)
  const [categoryManuallyChanged, setCategoryManuallyChanged] = useState(false)
  const [shadowingImageIndex, setShadowingImageIndex] = useState<number | null>(null)
  const [eraserImageIndex, setEraserImageIndex] = useState<number | null>(null)
  const [cropImageIndex, setCropImageIndex] = useState<number | null>(null)
  const [referenceImageVariants, setReferenceImageVariants] = useState<ReferenceImageVariant[]>(
    () => (Array.isArray(draft?.referenceImageVariants) ? draft.referenceImageVariants : [])
  )
  const [draggingImages, setDraggingImages] = useState(false)
  const [importOpen, setImportOpen] = useState(true)
  const [infoOpen, setInfoOpen] = useState(true)
  const [imagesOpen, setImagesOpen] = useState(true)
  const [refPhotosOpen, setRefPhotosOpen] = useState(true)
  const [importSummary, setImportSummary] = useState<{
    name: string
    hasPrice: boolean
    refPhotos: number
  } | null>(null)
  const [autoDetectedSource, setAutoDetectedSource] = useState(false)
  const importUrlRef = useRef<HTMLTextAreaElement | null>(null)

  const { register, handleSubmit, getValues, setValue, watch, formState: { errors } } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: record?.name ?? "",
      slug: record?.slug ?? "",
      description: record?.description ?? "",
      details: record?.details ?? "",
      price: record?.price ?? 0,
      comparePrice: record?.comparePrice ?? null,
      category: record?.category ?? "BOOSTER_PACK",
      game: record?.game ?? "POKEMON",
      subcategory: record?.subcategory ?? "TRADING_CARD_GAME",
      stock: record?.stock ?? 0,
      featured: record?.featured ?? false,
      set: record?.set ?? "",
      images: record?.images ?? [],
      sourceUrl: record?.sourceUrl ?? null,
      referenceImages: record?.referenceImages ?? [],
    },
  })

  const { remotes: images, pending: pendingUploads } = imageState

  useLayoutEffect(() => {
    setValue("images", imageState.remotes, { shouldValidate: false, shouldDirty: true })
  }, [imageState.remotes, setValue])

  const name = watch("name")
  const selectedCategory = (watch("category") ?? "BOOSTER_PACK") as ProductCategoryValue
  const imagePreviewClassName = "absolute inset-0 h-full w-full object-contain"
  const selectedGame = (watch("game") ?? "POKEMON") as ProductGame
  const subtabOptions = SUBTABS_BY_GAME[selectedGame]
  const referenceImages = watch("referenceImages") ?? []
  const sourceUrl = watch("sourceUrl")
  const isAmazonSource = isAmazonProductUrl(sourceUrl)
  const variantImageCount = referenceImageVariants.reduce(
    (total, variant) => total + variant.images.length,
    0
  )
  const groupedReferenceUrls = new Set(referenceImageVariants.flatMap((variant) => variant.images))
  const groupedAmazonKeys = new Set(
    referenceImageVariants
      .flatMap((variant) => variant.images.map(amazonMediaImageKey))
      .filter((k): k is string => !!k)
  )
  const ungroupedReferenceImages = referenceImages.filter((img) => {
    if (groupedReferenceUrls.has(img)) return false
    const key = amazonMediaImageKey(img)
    if (key && groupedAmazonKeys.has(key)) return false
    return true
  })
  const displayReferenceImageVariants =
    isAmazonSource && referenceImageVariants.length > 0 && ungroupedReferenceImages.length > 0
      ? referenceImageVariants.map((variant, index) =>
          index === 0
            ? {
                ...variant,
                images: Array.from(new Set([...variant.images, ...ungroupedReferenceImages])),
              }
            : variant
        )
      : referenceImageVariants
  const displayVariantImageCount = displayReferenceImageVariants.reduce(
    (total, variant) => total + variant.images.length,
    0
  )
  const displayUngroupedReferenceImages =
    isAmazonSource && displayVariantImageCount > 0 ? [] : ungroupedReferenceImages

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setValue("name", val)
    if (mode === "create") {
      setValue("slug", slugify(val))
    }
    if (!categoryManuallyChanged) {
      const inferredCategory = inferProductCategoryFromName(val)
      if (inferredCategory) {
        setValue("category", inferredCategory, { shouldDirty: true, shouldValidate: true })
        setValue("subcategory", subcategoryForProductCategory(inferredCategory), {
          shouldDirty: true,
          shouldValidate: true,
        })
      }
    }
  }

  const rewriteDetailsWithAi = async () => {
    const details = getValues("details")?.trim()
    if (!details) {
      toast({
        title: "No details to rewrite",
        description: "Import or enter product details first.",
        variant: "destructive",
      })
      return
    }

    setRewritingDetails(true)
    try {
      const res = await fetch("/api/admin/rewrite-product-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: getValues("name"),
          details,
        }),
      })
      const data = (await res.json()) as { details?: string; error?: string }

      if (!res.ok || !data.details) {
        const message = data.error ?? "Could not rewrite the product details."
        toast({ title: "Rewrite failed", description: message, variant: "destructive" })
        return
      }

      setValue("details", data.details, { shouldDirty: true, shouldValidate: true })
      toast({
        title: "Details rewritten",
        description: "Review the new wording before publishing or drafting.",
        variant: "success",
      })
    } catch {
      toast({
        title: "Rewrite failed",
        description: "Network error while rewriting product details.",
        variant: "destructive",
      })
    } finally {
      setRewritingDetails(false)
    }
  }

  const uploadImageSources = async (sources: UploadImageSource[]) => {
    if (!sources.length) {
      toast({
        title: "No images found",
        description: "Drop or select image files, or drop a direct image URL.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      for (const source of sources) {
        const id =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `pending-${Date.now()}-${Math.random()}`

        const preview = source.kind === "file" ? previewUrlForFile(source.file) : source.url
        setImageState((prev) => ({
          ...prev,
          pending: [...prev.pending, { id, preview, status: "uploading" }],
        }))

        try {
          const formData = new FormData()
          if (source.kind === "file") {
            formData.append("file", source.file)
          } else {
            formData.append("imageUrl", source.url)
          }
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

  const uploadImageFiles = async (files: File[]) => {
    await uploadImageSources(files.filter(isImageFile).map((file) => ({ kind: "file", file })))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const list = input.files
    if (!list?.length) return
    /** Copy before clearing — FileList is live; `input.value = ""` empties it. */
    const files = Array.from(list)
    input.value = ""
    await uploadImageFiles(files)
  }

  const handleImageDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggingImages(false)

    if (uploading) return

    const imageFiles = Array.from(e.dataTransfer.files).filter(isImageFile)

    // Prefer File objects when present — browsers often populate both File + URL
    // representations for the same dragged image, which would cause duplicate uploads.
    const droppedSources: UploadImageSource[] = imageFiles.length > 0
      ? imageFiles.map((file) => ({ kind: "file" as const, file }))
      : imageUrlsFromDrop(e.dataTransfer).map((url) => ({ kind: "url" as const, url }))

    await uploadImageSources(droppedSources)
  }

  const removeImage = (index: number) => {
    setImageState((prev) => ({
      ...prev,
      remotes: prev.remotes.filter((_, i) => i !== index),
    }))
  }

  const flipImageHorizontally = (index: number) => {
    setImageState((prev) => {
      const currentUrl = prev.remotes[index]
      if (!currentUrl) return prev

      const flippedUrl = toggleCloudinaryHorizontalFlip(currentUrl)
      if (!flippedUrl) {
        toast({
          title: "Could not flip image",
          description: "Only uploaded Cloudinary product images can be flipped.",
          variant: "destructive",
        })
        return prev
      }

      return {
        ...prev,
        remotes: prev.remotes.map((img, i) => (i === index ? flippedUrl : img)),
      }
    })
  }

  const zoomImage = (index: number, direction: 1 | -1) => {
    setImageState((prev) => {
      const currentUrl = prev.remotes[index]
      if (!currentUrl) return prev

      const zoomedUrl = updateProductImageZoom(currentUrl, direction)

      return {
        ...prev,
        remotes: prev.remotes.map((img, i) => (i === index ? zoomedUrl : img)),
      }
    })
  }

  const addObjectShadow = async (index: number) => {
    const currentUrl = imageState.remotes[index]
    if (!currentUrl) return

    setShadowingImageIndex(index)
    try {
      const res = await fetch("/api/admin/product-image-shadow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: currentUrl }),
      })
      const data = (await res.json()) as { url?: string; error?: string }

      if (!res.ok || !data.url) {
        toast({
          title: "Could not add object shadow",
          description: data.error ?? "Try another photo with a plain white background.",
          variant: "destructive",
        })
        return
      }

      setImageState((prev) => ({
        ...prev,
        remotes: prev.remotes.map((img, i) => (i === index ? data.url! : img)),
      }))
      toast({
        title: "Object shadow added",
        description: "The product image was rebuilt and uploaded with a shadow behind the object.",
        variant: "success",
      })
    } catch {
      toast({
        title: "Could not add object shadow",
        description: "Network error while processing the image.",
        variant: "destructive",
      })
    } finally {
      setShadowingImageIndex(null)
    }
  }

  const cropImageToSelection = async (
    selection: { x: number; y: number; width: number; height: number }
  ) => {
    if (cropImageIndex === null) return
    const currentUrl = imageState.remotes[cropImageIndex]
    if (!currentUrl) return

    const res = await fetch("/api/admin/product-image-crop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: currentUrl, selection }),
    })
    const data = (await res.json()) as { url?: string; error?: string }

    if (!res.ok || !data.url) {
      toast({
        title: "Crop failed",
        description: data.error ?? "Could not process the image.",
        variant: "destructive",
      })
      return
    }

    setImageState((prev) => ({
      ...prev,
      remotes: prev.remotes.map((img, i) => (i === cropImageIndex ? data.url! : img)),
    }))
    toast({ title: "Image cropped", description: "Background replaced with white.", variant: "success" })
    setCropImageIndex(null)
  }

  const applyErasedImage = async (editedImageUrl: string) => {
    if (eraserImageIndex === null) return

    setImageState((prev) => ({
      ...prev,
      remotes: prev.remotes.map((img, i) => (i === eraserImageIndex ? editedImageUrl : img)),
    }))
    toast({
      title: "Shadow erased",
      description: "The edited product image was saved.",
      variant: "success",
    })
    setEraserImageIndex(null)
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

  const batchItemFromDraft = (url: string, draft: ScrapedProductDraft): BatchDraftItem => {
    const name = draft.name?.trim() || "Untitled product"
    return {
      id: localId("batch-draft"),
      url: draft.sourceUrl ?? url,
      name,
      price: typeof draft.price === "number" && draft.price > 0 ? String(draft.price) : "",
      details: draft.details ?? "",
      category: inferProductCategoryFromName(name) ?? "ACCESSORIES",
      referenceImages: draft.referenceImages ?? [],
      referenceImageVariants: draft.referenceImageVariants ?? [],
      status: "ready",
    }
  }

  const importBatchDraftItems = async (urls: string[]) => {
    const items: BatchDraftItem[] = []

    for (const url of urls) {
      try {
        const res = await fetch("/api/admin/scrape-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, source: importLinkSource }),
        })
        const data = (await res.json()) as { draft?: ScrapedProductDraft; error?: string }

        if (!res.ok || !data.draft) {
          items.push({
            id: localId("batch-draft-error"),
            url,
            name: "Import failed",
            price: "",
            details: "",
            category: "ACCESSORIES",
            referenceImages: [],
            referenceImageVariants: [],
            status: "failed",
            error: data.error ?? "Could not import product details.",
          })
          continue
        }

        items.push(batchItemFromDraft(url, data.draft))
      } catch {
        items.push({
          id: localId("batch-draft-error"),
          url,
          name: "Import failed",
          price: "",
          details: "",
          category: "ACCESSORIES",
          referenceImages: [],
          referenceImageVariants: [],
          status: "failed",
          error: "Network error while importing product details.",
        })
      }
    }

    return items
  }

  const updateBatchDraftItem = (id: string, updates: Partial<BatchDraftItem>) => {
    setBatchDraftItems((items) => items.map((item) => (item.id === id ? { ...item, ...updates } : item)))
  }

  const removeBatchDraftItem = (id: string) => {
    setBatchDraftItems((items) => items.filter((item) => item.id !== id))
  }

  const removeBatchDraftImage = (itemId: string, imageUrl: string) => {
    setBatchDraftItems((items) =>
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              referenceImages: item.referenceImages.filter((img) => img !== imageUrl),
              referenceImageVariants: item.referenceImageVariants
                .map((variant) => ({
                  ...variant,
                  images: variant.images.filter((img) => img !== imageUrl),
                }))
                .filter((variant) => variant.images.length > 0),
            }
          : item
      )
    )
  }

  const handleImportFromUrl = async () => {
    const url = importUrl.trim()
    if (!url) {
      setImportError("Paste a product URL first.")
      return
    }

    const urls = productUrlsFromText(importUrl)
    if (urls.length > 1) {
      setImporting(true)
      setImportError(null)
      try {
        const items = await importBatchDraftItems(urls)
        setBatchDraftItems(items)
        const failed = items.filter((item) => item.status === "failed").length
        toast({
          title: "Batch products imported",
          description: `${items.length - failed} ready to review, ${failed} failed.`,
          variant: failed ? "destructive" : "success",
        })
      } finally {
        setImporting(false)
      }
      return
    }

    setImporting(true)
    setImportError(null)
    try {
      const res = await fetch("/api/admin/scrape-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, source: importLinkSource }),
      })
      const data = (await res.json()) as { draft?: ScrapedProductDraft; error?: string }

      if (!res.ok || !data.draft) {
        const message = data.error ?? "Could not import product details from that URL."
        setImportError(message)
        toast({ title: "Import failed", description: message, variant: "destructive" })
        return
      }

      const draft = data.draft
      if (draft.name) {
        setValue("name", draft.name, { shouldDirty: true, shouldValidate: true })
        if (mode === "create") {
          setValue("slug", slugify(draft.name), { shouldDirty: true, shouldValidate: true })
        }
        if (!categoryManuallyChanged) {
          const inferredCategory = inferProductCategoryFromName(draft.name)
          if (inferredCategory) {
            setValue("category", inferredCategory, { shouldDirty: true, shouldValidate: true })
            setValue("subcategory", subcategoryForProductCategory(inferredCategory), {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        }
      }
      if (draft.details) {
        setValue("details", draft.details, { shouldDirty: true, shouldValidate: true })
      }
      if (typeof draft.price === "number") {
        setValue("price", draft.price, { shouldDirty: true, shouldValidate: true })
      }
      if (typeof draft.comparePrice === "number") {
        setValue("comparePrice", draft.comparePrice, { shouldDirty: true, shouldValidate: true })
      }
      setValue("sourceUrl", draft.sourceUrl ?? url, { shouldDirty: true, shouldValidate: true })
      setValue("referenceImages", draft.referenceImages ?? [], {
        shouldDirty: true,
        shouldValidate: true,
      })
      setReferenceImageVariants(draft.referenceImageVariants ?? [])

      const refPhotoCount = (draft.referenceImages?.length ?? 0) +
        (draft.referenceImageVariants?.reduce((n, v) => n + v.images.length, 0) ?? 0)
      setImportSummary({
        name: draft.name?.trim() || "",
        hasPrice: typeof draft.price === "number" && draft.price > 0,
        refPhotos: refPhotoCount,
      })

      // Collapse import, expand images; keep info open
      setImportOpen(false)
      setImagesOpen(true)
      setInfoOpen(true)
      if (refPhotoCount > 0) setRefPhotosOpen(true)

      if (draft.browserScrapeWarning) {
        toast({ title: "Import warning", description: draft.browserScrapeWarning, variant: "destructive" })
      }
    } catch {
      const message = "Network error while importing product details."
      setImportError(message)
      toast({ title: "Import failed", description: message, variant: "destructive" })
    } finally {
      setImporting(false)
    }
  }

  const draftFromImportedUrl = async (url: string) => {
    const scrapeRes = await fetch("/api/admin/scrape-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, source: importLinkSource }),
    })
    const scrapeData = (await scrapeRes.json()) as { draft?: ScrapedProductDraft; error?: string }
    if (!scrapeRes.ok || !scrapeData.draft) {
      return { status: "failed" as const, message: scrapeData.error ?? "Could not import product details." }
    }

    const draft = scrapeData.draft
    const name = draft.name?.trim() || "Untitled product"
    const category = inferProductCategoryFromName(name) ?? "ACCESSORIES"
    const payload = {
      name,
      slug: slugify(name),
      description: "",
      details: draft.details ?? "",
      price: typeof draft.price === "number" && draft.price > 0 ? draft.price : undefined,
      comparePrice:
        typeof draft.comparePrice === "number" && draft.comparePrice > 0 ? draft.comparePrice : undefined,
      images: [],
      sourceUrl: draft.sourceUrl ?? url,
      referenceImages: draft.referenceImages ?? [],
      referenceImageVariants: draft.referenceImageVariants ?? [],
      category,
      game: "POKEMON" as const,
      subcategory: subcategoryForProductCategory(category),
      stock: undefined,
      featured: false,
      set: "",
    }

    const draftRes = await fetch("/api/admin/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const draftData = (await draftRes.json()) as DraftSaveResponse

    if (draftRes.status === 409) {
      return { status: "duplicate" as const, message: draftData.error ?? "Draft already exists." }
    }

    if (!draftRes.ok) {
      return { status: "failed" as const, message: draftData.error ?? "Failed to save draft." }
    }

    return { status: "saved" as const, message: name }
  }

  const saveBatchDraftItem = async (item: BatchDraftItem) => {
    if (item.status === "failed") return { status: "failed" as const, message: item.error ?? "Import failed." }

    const name = item.name.trim() || "Untitled product"
    const price = Number(item.price)
    const payload = {
      name,
      slug: slugify(name),
      description: "",
      details: item.details,
      price: Number.isFinite(price) && price > 0 ? price : undefined,
      comparePrice: undefined,
      images: [],
      sourceUrl: item.url,
      referenceImages: item.referenceImages,
      referenceImageVariants: item.referenceImageVariants,
      category: item.category,
      game: "POKEMON" as const,
      subcategory: subcategoryForProductCategory(item.category),
      stock: undefined,
      featured: false,
      set: "",
    }

    const draftRes = await fetch("/api/admin/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const draftData = (await draftRes.json()) as DraftSaveResponse

    if (draftRes.status === 409) {
      return { status: "duplicate" as const, message: draftData.error ?? "Draft already exists." }
    }

    if (!draftRes.ok) {
      return { status: "failed" as const, message: draftData.error ?? "Failed to save draft." }
    }

    return { status: "saved" as const, message: name }
  }

  const draftAllLinks = async () => {
    const urls = productUrlsFromText(importUrl)
    if (!urls.length && !batchDraftItems.length) {
      setImportError("Paste one or more product URLs first.")
      toast({ title: "No links found", description: "Paste one or more product URLs first.", variant: "destructive" })
      return
    }

    setBatchDrafting(true)
    setImportError(null)

    let saved = 0
    let duplicates = 0
    let failed = 0

    try {
      const items = batchDraftItems.length ? batchDraftItems : await importBatchDraftItems(urls)
      if (!batchDraftItems.length) setBatchDraftItems(items)

      for (const item of items) {
        try {
          const result = await saveBatchDraftItem(item)
          if (result.status === "saved") saved += 1
          if (result.status === "duplicate") duplicates += 1
          if (result.status === "failed") failed += 1
        } catch {
          failed += 1
        }
      }

      toast({
        title: "Batch draft complete",
        description: `${saved} saved, ${duplicates} skipped duplicate, ${failed} failed.`,
        variant: failed ? "destructive" : "success",
      })
      router.refresh()
    } finally {
      setBatchDrafting(false)
    }
  }

  const removeReferenceImage = (index: number) => {
    setValue(
      "referenceImages",
      referenceImages.filter((_, i) => i !== index),
      { shouldDirty: true, shouldValidate: true }
    )
  }

  const removeReferenceImageUrl = (imageUrl: string) => {
    setValue(
      "referenceImages",
      referenceImages.filter((img) => img !== imageUrl),
      { shouldDirty: true, shouldValidate: true }
    )
    setReferenceImageVariants((variants) =>
      variants
        .map((variant) => ({
          ...variant,
          images: variant.images.filter((img) => img !== imageUrl),
        }))
        .filter((variant) => variant.images.length > 0)
    )
  }

  const copyImportUrl = async () => {
    const url = importUrl.trim()
    if (!url) {
      toast({ title: "Nothing to copy", description: "Paste a product URL first.", variant: "destructive" })
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      toast({ title: "Link copied", description: "Product URL copied to clipboard.", variant: "success" })
    } catch {
      toast({ title: "Copy failed", description: "Could not copy the product URL.", variant: "destructive" })
    }
  }

  const draftPayload = () => {
    const data = getValues()
    return {
      ...data,
      description: "",
      price: data.price > 0 ? data.price : undefined,
      comparePrice: data.comparePrice && data.comparePrice > 0 ? data.comparePrice : undefined,
      images: imageState.remotes,
      sourceUrl: data.sourceUrl?.trim() || null,
      referenceImages: data.referenceImages ?? [],
      referenceImageVariants,
    }
  }

  const saveDraft = async () => {
    setDraftSaving(true)
    try {
      const url = draftId ? `/api/admin/drafts/${draftId}` : "/api/admin/drafts"
      const method = draftId ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftPayload()),
      })
      const data = (await res.json()) as {
        error?: string
        duplicateDraft?: { id: string; name?: string | null }
        export?: { folderPath?: string; failedImages?: string[] }
      }

      if (!res.ok) {
        toast({
          title: res.status === 409 ? "Draft already exists" : "Error",
          description:
            data.error ??
            (res.status === 409
              ? "This exact product is already saved in drafts."
              : "Failed to save draft."),
          variant: "destructive",
        })
        return
      }

      const failedCount = data.export?.failedImages?.length ?? 0
      toast({
        title: draftId ? "Draft updated" : "Draft saved",
        description: failedCount
          ? `Saved to drafts, but ${failedCount} reference image(s) could not be copied.`
          : `Saved to drafts and exported to ${data.export?.folderPath ?? "your Products folder"}.`,
        variant: "success",
      })
      router.push("/admin/drafts")
      router.refresh()
    } finally {
      setDraftSaving(false)
    }
  }

  const onSubmit = async (data: ProductInput) => {
    setSaving(true)
    try {
      const url = mode === "edit" ? `/api/products/${product?.id}` : "/api/products"
      const method = mode === "edit" ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          description: "",
          images: imageState.remotes,
          sourceUrl: data.sourceUrl?.trim() || null,
          referenceImages: data.referenceImages ?? [],
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast({ title: "Error", description: err.error ?? "Failed to save product.", variant: "destructive" })
        return
      }

      if (draftId) {
        await fetch(`/api/admin/drafts/${draftId}`, { method: "DELETE" })
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
      <input type="hidden" {...register("sourceUrl")} />

      <div className="rounded-2xl border border-surface-border bg-surface overflow-hidden">
        <button
          type="button"
          onClick={() => setImportOpen((o) => !o)}
          data-section-toggle="import"
          className="w-full flex items-center justify-between gap-3 px-6 py-4 text-left hover:bg-surface2/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-accent flex-shrink-0" />
            <span className="font-semibold text-foreground">Import Product Details</span>
            {importSummary && !importOpen && (
              <span className="ml-1 flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <Check className="h-2.5 w-2.5" />
                imported
              </span>
            )}
          </div>
          <ChevronDown
            className={`h-4 w-4 text-foreground/40 flex-shrink-0 transition-transform duration-200 ${importOpen ? "rotate-180" : ""}`}
          />
        </button>
        <div className={`${importOpen ? "block" : "hidden"} px-6 pb-6 space-y-4`}>
          <p className="text-sm text-foreground/45">
            Choose <strong className="text-foreground/60">Amazon</strong> or{" "}
            <strong className="text-foreground/60">Ultra PRO / Ultra Gaming</strong>, then paste product URLs
            from that site only. Imported text and reference photos are drafts only.
          </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="space-y-1.5 w-full shrink-0 sm:w-56">
            <div className="flex items-center gap-2">
              <Label htmlFor="import-link-source">Import from site</Label>
              {autoDetectedSource && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <Check className="h-2.5 w-2.5" />
                  auto
                </span>
              )}
            </div>
            <Select
              value={importLinkSource}
              onValueChange={(v) => {
                setImportLinkSource(v as ImportLinkSource)
                setAutoDetectedSource(false)
              }}
              disabled={importing || batchDrafting}
            >
              <SelectTrigger id="import-link-source">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMPORT_LINK_SOURCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            ref={importUrlRef}
            id="import-url-textarea"
            value={importUrl}
            onChange={(e) => {
              setImportUrl(e.target.value)
              const urls = productUrlsFromText(e.target.value)
              if (urls.length > 0) {
                if (isUltraProUrl(urls[0])) {
                  setImportLinkSource("ultrapro")
                  setAutoDetectedSource(true)
                } else if (isAmazonProductUrl(urls[0])) {
                  setImportLinkSource("amazon")
                  setAutoDetectedSource(true)
                } else {
                  setAutoDetectedSource(false)
                }
              } else {
                setAutoDetectedSource(false)
              }
            }}
            placeholder="https://example.com/products/product-name"
            rows={2}
            className="min-w-0 flex-1"
          />
          <Button type="button" variant="outline" onClick={handleImportFromUrl} disabled={importing || batchDrafting}>
            {importing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing...
              </span>
            ) : (
              "Import from URL"
            )}
          </Button>
          <Button type="button" variant="outline" onClick={draftAllLinks} disabled={importing || batchDrafting}>
            {batchDrafting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Drafting...
              </span>
            ) : (
              "Draft All Links"
            )}
          </Button>
          <Button type="button" variant="outline" onClick={copyImportUrl}>
            <Copy className="h-4 w-4" />
            Copy
          </Button>
        </div>

        {importError ? (
          <div
            role="alert"
            className="flex gap-2 rounded-xl border border-electric-red/30 bg-electric-red/10 p-3 text-sm text-foreground"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-electric-red" />
            <p>{importError}</p>
          </div>
        ) : null}

        {batchDraftItems.length > 0 ? (
          <div className="max-w-7xl space-y-3 rounded-2xl border border-surface-border bg-surface2/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Batch Draft Products</h3>
                <p className="text-xs text-foreground/45">
                  Review each product before clicking Draft All Links.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setBatchDraftItems([])}>
                Clear
              </Button>
            </div>

            <div className="space-y-4">
              {batchDraftItems.map((item, index) => (
                <div
                  key={item.id}
                  className="max-w-6xl rounded-xl border border-surface-border bg-surface p-4 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground/45">Product {index + 1}</p>
                      <p className="truncate text-xs text-foreground/40">{item.url}</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeBatchDraftItem(item.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {item.status === "failed" ? (
                    <div className="rounded-lg border border-electric-red/30 bg-electric-red/10 p-3 text-sm text-foreground">
                      {item.error ?? "Could not import this product."}
                    </div>
                  ) : (
                    <>
                      {batchDraftImages(item).length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <Label>Reference Photos</Label>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-foreground/40">
                                {batchDraftImages(item).length} photo{batchDraftImages(item).length === 1 ? "" : "s"}
                              </span>
                              {batchDraftImages(item).length > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setBatchDraftItems((prev) =>
                                      prev.map((d) =>
                                        d === item
                                          ? { ...d, referenceImages: [], referenceImageVariants: [] }
                                          : d
                                      )
                                    )
                                  }
                                  className="rounded border border-electric-red/30 bg-electric-red/10 px-2 py-0.5 text-xs font-medium text-electric-red hover:bg-electric-red/20 transition-colors"
                                >
                                  Delete All
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="grid max-w-4xl grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                            {batchDraftImages(item)
                              .slice(0, 8)
                              .map((img, imageIndex) => (
                                <div
                                  key={`${item.id}-${img}-${imageIndex}`}
                                  className="group relative aspect-square overflow-hidden rounded-lg border border-surface-border bg-surface2"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeBatchDraftImage(item.id, img)}
                          className="absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-foreground/80 opacity-100 lg:opacity-0 lg:transition-opacity hover:text-electric-red lg:group-hover:opacity-100"
                          aria-label="Remove reference image"
                        >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                          </div>
                          {batchDraftImages(item).length > 8 ? (
                            <p className="text-xs text-foreground/40">
                              +{batchDraftImages(item).length - 8} more saved with this draft.
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <p className="rounded-lg border border-surface-border bg-surface2/60 p-3 text-xs text-foreground/45">
                          No reference photos found for this product.
                        </p>
                      )}

                      <div className="grid max-w-4xl gap-3 md:grid-cols-[1fr_160px]">
                        <div className="space-y-1.5">
                          <Label>Product Name</Label>
                          <Input
                            value={item.name}
                            onChange={(e) => {
                              const nextName = e.target.value
                              updateBatchDraftItem(item.id, {
                                name: nextName,
                                category: inferProductCategoryFromName(nextName) ?? item.category,
                              })
                            }}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Price ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.price}
                            onChange={(e) => updateBatchDraftItem(item.id, { price: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="max-w-4xl space-y-1.5">
                        <Label>Product type</Label>
                        <Select
                          value={item.category}
                          onValueChange={(value) =>
                            updateBatchDraftItem(item.id, { category: value as ProductCategoryValue })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {CATEGORY_LABELS[cat]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="max-w-4xl space-y-1.5">
                        <Label>Details</Label>
                        <Textarea
                          rows={5}
                          value={item.details}
                          onChange={(e) => updateBatchDraftItem(item.id, { details: e.target.value })}
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="default"
                className="bg-blue-600 text-white hover:bg-blue-500"
                onClick={draftAllLinks}
                disabled={batchDrafting || importing}
              >
                {batchDrafting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Drafting...
                  </span>
                ) : (
                  "Draft All Links"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => setBatchDraftItems([])}>
                Cancel Bulk
              </Button>
            </div>
          </div>
        ) : null}
        </div>{/* end collapsible import content */}
      </div>

      {/* Post-import summary banner */}
      {importSummary && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/8 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 space-y-1">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              Import complete
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground/60">
              {importSummary.name && (
                <span>
                  <span className="font-medium text-foreground/80">{importSummary.name}</span>
                </span>
              )}
              <span>{importSummary.hasPrice ? "✓ Price found" : "⚠ No price — enter manually"}</span>
              <span>
                {importSummary.refPhotos > 0
                  ? `✓ ${importSummary.refPhotos} reference photo${importSummary.refPhotos === 1 ? "" : "s"}`
                  : "⚠ No reference photos found"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                const el = document.querySelector("[data-section='actions']")
                el?.scrollIntoView({ behavior: "smooth", block: "center" })
              }}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
            >
              Jump to Save
            </button>
            <button
              type="button"
              onClick={() => setImportSummary(null)}
              className="rounded-full p-1 text-foreground/40 hover:text-foreground transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {batchDraftItems.length === 0 ? (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-surface-border bg-surface overflow-hidden">
            <button
              type="button"
              onClick={() => setInfoOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-3 px-6 py-4 text-left hover:bg-surface2/50 transition-colors"
            >
              <span className="font-semibold text-foreground">Product Information</span>
              <ChevronDown
                className={`h-4 w-4 text-foreground/40 flex-shrink-0 transition-transform duration-200 ${infoOpen ? "rotate-180" : ""}`}
              />
            </button>
            <div className={`${infoOpen ? "block" : "hidden"} px-6 pb-6 space-y-4`}>
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
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Label>Details</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={rewriteDetailsWithAi}
                  disabled={rewritingDetails}
                >
                  {rewritingDetails ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Rewriting...
                    </span>
                  ) : (
                    "Rewrite with AI"
                  )}
                </Button>
              </div>
              <p className="text-xs text-foreground/40 -mt-0.5 mb-1">
                Product page copy: specs, what&apos;s in the box, size, materials, care, etc.
              </p>
              <Textarea
                placeholder="Product details shown on the storefront..."
                rows={8}
                className="min-h-[180px] font-mono text-sm"
                {...register("details")}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Set Name</Label>
              <Input placeholder="e.g., Prismatic Evolutions" {...register("set")} />
            </div>

            <div className="space-y-1.5">
              <Label>Product type</Label>
              <Select
                value={selectedCategory}
                onValueChange={(val) => {
                  const category = val as ProductCategoryValue
                  setCategoryManuallyChanged(true)
                  setValue("category", category as ProductInput["category"], {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                  setValue("subcategory", subcategoryForProductCategory(category), {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }}
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
            </div>{/* end collapsible info content */}
          </div>

          {/* Images */}
          <div className="rounded-2xl border border-surface-border bg-surface overflow-hidden">
            <button
              type="button"
              onClick={() => setImagesOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-3 px-6 py-4 text-left hover:bg-surface2/50 transition-colors"
            >
              <span className="font-semibold text-foreground">Product Images</span>
              <ChevronDown
                className={`h-4 w-4 text-foreground/40 flex-shrink-0 transition-transform duration-200 ${imagesOpen ? "rotate-180" : ""}`}
              />
            </button>
            <div className={`${imagesOpen ? "block" : "hidden"} px-6 pb-6 space-y-4`}>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 min-w-0">
              {images.map((img, i) => (
                <div
                  key={`img-${i}-${img.slice(-32)}`}
                  className="relative aspect-[3/4] min-h-[140px] min-w-0 w-full rounded-xl border border-surface-border bg-white group overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt=""
                    className={`${imagePreviewClassName} z-[1]`}
                    style={{ transform: `scale(${(getProductImageZoom(img) * 1.3).toFixed(3)})` }}
                  />
                  <div className="absolute top-2 left-2 z-10 flex gap-1 opacity-100 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => flipImageHorizontally(i)}
                      className="flex h-9 w-9 lg:h-7 lg:w-7 items-center justify-center rounded-full bg-background/90 text-foreground/80 hover:text-accent"
                      aria-label="Flip image horizontally"
                      title="Flip horizontally"
                    >
                      <FlipHorizontal className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => zoomImage(i, 1)}
                      className="flex h-9 w-9 lg:h-7 lg:w-7 items-center justify-center rounded-full bg-background/90 text-foreground/80 hover:text-accent"
                      aria-label="Zoom image in"
                      title="Zoom in"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => zoomImage(i, -1)}
                      className="flex h-9 w-9 lg:h-7 lg:w-7 items-center justify-center rounded-full bg-background/90 text-foreground/80 hover:text-accent"
                      aria-label="Zoom image out"
                      title="Zoom out"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => addObjectShadow(i)}
                      disabled={shadowingImageIndex !== null}
                      className="flex h-9 w-9 lg:h-7 lg:w-7 items-center justify-center rounded-full bg-background/90 text-foreground/80 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Add shadow to object"
                      title="Add object shadow"
                    >
                      {shadowingImageIndex === i ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEraserImageIndex(i)}
                      disabled={shadowingImageIndex !== null}
                      className="flex h-9 w-9 lg:h-7 lg:w-7 items-center justify-center rounded-full bg-background/90 text-foreground/80 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Erase shadow only"
                      title="Erase gray shadow only (product protected)"
                    >
                      <Eraser className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCropImageIndex(i)}
                      disabled={shadowingImageIndex !== null}
                      className="flex h-9 w-9 lg:h-7 lg:w-7 items-center justify-center rounded-full bg-background/90 text-foreground/80 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Select object to keep"
                      title="Select object (white out rest)"
                    >
                      <Scissors className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-2 right-2 w-9 h-9 lg:w-7 lg:h-7 rounded-full bg-background/90 flex items-center justify-center text-foreground/80 hover:text-electric-red opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:transition-opacity z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-xs bg-accent/90 text-white font-medium z-10">
                      Main
                    </span>
                  )}
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-xs bg-black/60 text-white font-mono z-10 select-none">
                    {getProductImageZoom(img).toFixed(1)}<span className="opacity-50">/{PRODUCT_IMAGE_ZOOM_MAX}</span>
                  </span>
                </div>
              ))}

              {pendingUploads.map(({ id, preview, status }) => (
                <div
                  key={id}
                  className={`relative aspect-[3/4] min-h-[140px] min-w-0 w-full rounded-xl overflow-hidden border bg-white ring-1 ${
                    status === "failed"
                      ? "border-electric-red/50 ring-electric-red/20"
                      : "border-accent/40 ring-accent/20"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt=""
                    className={imagePreviewClassName}
                  />
                  {status === "uploading" && (
                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/80 to-transparent py-3 pt-8">
                      <Loader2 className="h-5 w-5 shrink-0 animate-spin text-accent" />
                      <span className="text-[11px] font-medium text-foreground/90">Uploading…</span>
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
                        className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-foreground/90 hover:bg-white/20"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Upload button */}
              <label
                onDragEnter={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (!uploading) setDraggingImages(true)
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (!uploading) setDraggingImages(true)
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setDraggingImages(false)
                }}
                onDrop={handleImageDrop}
                className={`aspect-[3/4] min-w-0 w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group ${
                  draggingImages
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-surface-border text-foreground/40 hover:border-accent/50 hover:text-accent"
                }`}
              >
                <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading} />
                {uploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-accent" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 mb-2" />
                    <span className="text-xs text-center px-2">
                      {draggingImages ? "Drop images here" : "Upload or drop images"}
                    </span>
                  </>
                )}
              </label>
            </div>
            {errors.images && <p className="text-xs text-electric-red">{errors.images.message as string}</p>}
            </div>{/* end collapsible images content */}
          </div>

          {(sourceUrl || referenceImages.length > 0 || variantImageCount > 0) && (
            <div className="rounded-2xl border border-surface-border bg-surface overflow-hidden">
              <button
                type="button"
                onClick={() => setRefPhotosOpen((o) => !o)}
                className="w-full flex items-center justify-between gap-3 px-6 py-4 text-left hover:bg-surface2/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground">Reference Photos</span>
                  {(referenceImages.length > 0 || variantImageCount > 0) && (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                      {referenceImages.length + variantImageCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {referenceImages.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setValue("referenceImages", [], { shouldDirty: true })
                      }}
                      className="rounded-lg border border-electric-red/30 bg-electric-red/10 px-2 py-1 text-xs font-medium text-electric-red hover:bg-electric-red/20 transition-colors"
                    >
                      Delete All
                    </button>
                  )}
                  <ChevronDown
                    className={`h-4 w-4 text-foreground/40 transition-transform duration-200 ${refPhotosOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </button>
              <div className={`${refPhotosOpen ? "block" : "hidden"} px-6 pb-6 space-y-4`}>
              <p className="text-sm text-foreground/45">
                For admin reference only. These are not used as storefront product images.
              </p>

              {sourceUrl ? (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-light"
                >
                  View source product page
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}

              {variantImageCount > 0 ? (
                <div className="space-y-5">
                  {displayUngroupedReferenceImages.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-foreground/80">Main Gallery</h3>
                        <span className="text-xs text-foreground/40">
                          {displayUngroupedReferenceImages.length} reference photo
                          {displayUngroupedReferenceImages.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 min-w-0">
                        {displayUngroupedReferenceImages.map((img, i) => (
                          <div
                            key={`main-gallery-${img}-${i}`}
                            className="group relative aspect-[3/4] min-h-[140px] min-w-0 w-full rounded-xl overflow-hidden border border-surface-border bg-surface2"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img} alt="" className={imagePreviewClassName} />
                            <button
                              type="button"
                              onClick={() => removeReferenceImageUrl(img)}
                              className="absolute top-2 right-2 z-10 flex h-9 w-9 lg:h-7 lg:w-7 items-center justify-center rounded-full bg-background/90 text-foreground/80 opacity-100 lg:opacity-0 lg:transition-opacity hover:text-electric-red lg:group-hover:opacity-100"
                          aria-label="Remove reference image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <span className="absolute bottom-2 left-2 rounded bg-background/90 px-2 py-0.5 text-xs font-medium text-foreground/70">
                          Main Gallery
                        </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {displayReferenceImageVariants.map((variant) => (
                    <div key={variant.name} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-foreground/80">{variant.name}</h3>
                        <span className="text-xs text-foreground/40">
                          {variant.images.length} reference photo{variant.images.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 min-w-0">
                        {variant.images.map((img, i) => (
                          <div
                            key={`${variant.name}-${img}-${i}`}
                            className="group relative aspect-[3/4] min-h-[140px] min-w-0 w-full rounded-xl overflow-hidden border border-surface-border bg-surface2"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img} alt="" className={imagePreviewClassName} />
                            <button
                              type="button"
                              onClick={() => removeReferenceImageUrl(img)}
                              className="absolute top-2 right-2 z-10 flex h-9 w-9 lg:h-7 lg:w-7 items-center justify-center rounded-full bg-background/90 text-foreground/80 opacity-100 lg:opacity-0 lg:transition-opacity hover:text-electric-red lg:group-hover:opacity-100"
                              aria-label="Remove reference image"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <span className="absolute bottom-2 left-2 rounded bg-background/90 px-2 py-0.5 text-xs font-medium text-foreground/70">
                              {variant.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : referenceImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 min-w-0">
                  {referenceImages.map((img, i) => (
                    <div
                      key={`${img}-${i}`}
                      className="relative aspect-[3/4] min-h-[140px] min-w-0 w-full rounded-xl overflow-hidden border border-surface-border bg-surface2 group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className={imagePreviewClassName} />
                      <button
                        type="button"
                        onClick={() => removeReferenceImage(i)}
                        className="absolute top-2 right-2 w-9 h-9 lg:w-7 lg:h-7 rounded-full bg-background/90 flex items-center justify-center text-foreground/80 hover:text-electric-red opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:transition-opacity z-10"
                        aria-label="Remove reference image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <span className="absolute bottom-2 left-2 rounded bg-background/90 px-2 py-0.5 text-xs font-medium text-foreground/70">
                        Reference
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-surface-border bg-surface2/60 p-3 text-sm text-foreground/45">
                  No reference photos were found on the source page. Some sites hide product images
                  behind scripts that cannot be read from the page HTML.
                </p>
              )}
              </div>{/* end collapsible ref photos content */}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Pricing */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-4">
            <h2 className="font-semibold text-foreground">Pricing</h2>
            <div className="space-y-1.5">
              <Label>Price ($)</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" {...register("price")} />
              {errors.price && <p className="text-xs text-electric-red">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Compare-at Price ($) <span className="text-foreground/40">(optional)</span></Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" {...register("comparePrice")} />
            </div>
          </div>

          {/* Category & Stock */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-4">
            <h2 className="font-semibold text-foreground">Organization</h2>
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
              <Label>Stock Quantity</Label>
              <Input type="number" min="0" placeholder="0" {...register("stock")} />
              {errors.stock && <p className="text-xs text-electric-red">{errors.stock.message}</p>}
            </div>

            <div className="flex items-center gap-3">
              <input
                id="featured"
                type="checkbox"
                className="w-4 h-4 rounded border-surface-border bg-surface accent-accent"
                {...register("featured")}
              />
              <Label htmlFor="featured">Featured product</Label>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2" data-section="actions">
            {(mode === "create" || draftId) && (
              <Button
                type="button"
                variant="default"
                size="lg"
                className="w-full bg-blue-600 text-white hover:bg-blue-500"
                disabled={draftSaving || saving}
                onClick={saveDraft}
              >
                {draftSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving draft...
                  </span>
                ) : (
                  "Draft Product"
                )}
              </Button>
            )}
            <Button
              type="submit"
              variant="default"
              size="lg"
              className="w-full bg-emerald-600 text-white hover:bg-emerald-500"
              disabled={saving}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === "edit" ? "Saving..." : "Publishing..."}
                </span>
              ) : (
                mode === "edit" ? "Save Changes" : "Publish Product"
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
      ) : null}
      {cropImageIndex !== null && imageState.remotes[cropImageIndex] && (
        <ImageObjectSelector
          imageUrl={imageState.remotes[cropImageIndex]}
          onConfirm={cropImageToSelection}
          onClose={() => setCropImageIndex(null)}
        />
      )}
      {eraserImageIndex !== null && imageState.remotes[eraserImageIndex] && (
        <ImageShadowEraser
          imageUrl={imageState.remotes[eraserImageIndex]}
          onConfirm={applyErasedImage}
          onClose={() => setEraserImageIndex(null)}
        />
      )}

      {/* Floating mobile bottom action bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-surface-border bg-background/95 backdrop-blur-sm safe-area-bottom">
        <div className="flex gap-2 px-4 py-3">
          {(mode === "create" || draftId) && (
            <Button
              type="button"
              variant="default"
              size="lg"
              className="flex-1 bg-blue-600 text-white hover:bg-blue-500"
              disabled={draftSaving || saving}
              onClick={saveDraft}
            >
              {draftSaving ? (
                <span className="flex items-center gap-2 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Draft"
              )}
            </Button>
          )}
          <Button
            type="submit"
            variant="default"
            size="lg"
            className={`bg-emerald-600 text-white hover:bg-emerald-500 ${(mode === "create" || draftId) ? "flex-1" : "w-full"}`}
            disabled={saving}
          >
            {saving ? (
              <span className="flex items-center gap-2 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                {mode === "edit" ? "Saving..." : "Publishing..."}
              </span>
            ) : (
              mode === "edit" ? "Save Changes" : "Publish"
            )}
          </Button>
        </div>
      </div>
      {/* Spacer so the floating bar doesn't cover form content on mobile */}
      <div className="h-20 lg:hidden" aria-hidden="true" />
    </form>
  )
}
