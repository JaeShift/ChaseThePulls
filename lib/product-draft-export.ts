import { mkdir, writeFile } from "fs/promises"
import path from "path"
import type { DraftProductInput } from "@/lib/validations"
import { CATEGORY_LABELS, type ProductCategory } from "@/types"

const PRODUCTS_ROOT = "C:\\Users\\rylee\\OneDrive\\Desktop\\Products"
const MAX_IMAGE_BYTES = 15 * 1024 * 1024

const CATEGORY_FOLDER_NAMES: Record<ProductCategory, string> = {
  BOOSTER_PACK: "booster-packs",
  BOOSTER_BOX: "booster-boxes",
  BOOSTER_BUNDLE: "booster-bundles",
  STARTER_STRUCTURE_DECK: "starter-structure-decks",
  COLLECTION_BOX: "collection-boxes",
  ACCESSORIES: "accessories",
  ETB: "collector-boxes",
  BLISTER: "blister-packs",
  UPC: "premium-collections",
  SPC: "special-collections",
  TIN: "tins",
  BOXED_SET: "boxed-sets",
  CARD_BINDER: "binders",
  TOP_LOADER: "top-loaders",
  CARD_SLEEVES: "card-sleeves",
  PLAYMAT: "playmats",
  DECK_BOX: "deck-boxes",
}

export type DraftExportResult = {
  folderPath: string
  downloadedImages: string[]
  failedImages: string[]
}

function sanitizePathSegment(value: string) {
  return value
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120)
}

function imageExtensionFrom(url: string, contentType: string | null) {
  const byType = contentType?.toLowerCase().split(";")[0]
  if (byType === "image/jpeg") return ".jpg"
  if (byType === "image/png") return ".png"
  if (byType === "image/webp") return ".webp"
  if (byType === "image/gif") return ".gif"
  if (byType === "image/avif") return ".avif"

  try {
    const ext = path.extname(new URL(url).pathname)
    return ext || ".jpg"
  } catch {
    return ".jpg"
  }
}

function detailsTextForDraft(draft: DraftProductInput) {
  return [
    `Product Name: ${draft.name?.trim() || "Untitled Draft"}`,
    `Product Type: ${CATEGORY_LABELS[draft.category]}`,
    `Set Name: ${draft.set?.trim() || ""}`,
    `Source URL: ${draft.sourceUrl || ""}`,
    `Price: ${typeof draft.price === "number" ? draft.price : ""}`,
    `Compare-at Price: ${typeof draft.comparePrice === "number" ? draft.comparePrice : ""}`,
    "",
    "Details:",
    draft.details?.trim() || "",
    "",
  ].join("\r\n")
}

async function downloadReferenceImage(url: string, folderPath: string, index: number) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: {
      accept: "image/avif,image/webp,image/png,image/jpeg,image/gif,*/*",
      "user-agent": "Mozilla/5.0 (compatible; ChaseThePullsDraftExporter/1.0)",
    },
  })

  if (!response.ok) {
    throw new Error(`Image returned HTTP ${response.status}`)
  }

  const contentType = response.headers.get("content-type")
  if (contentType && !contentType.toLowerCase().startsWith("image/")) {
    throw new Error("URL did not return an image")
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0)
  if (contentLength > MAX_IMAGE_BYTES) {
    throw new Error("Image is too large")
  }

  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("Image is too large")
  }

  const filename = `reference-${String(index + 1).padStart(2, "0")}${imageExtensionFrom(
    url,
    contentType
  )}`
  const filePath = path.join(folderPath, filename)
  await writeFile(filePath, bytes)
  return filePath
}

function variantImageUrls(draft: DraftProductInput) {
  return new Set(draft.referenceImageVariants.flatMap((variant) => variant.images))
}

export async function exportDraftProductToLocalFolder(
  draft: DraftProductInput
): Promise<DraftExportResult> {
  const categoryFolder = CATEGORY_FOLDER_NAMES[draft.category]
  const productFolderName = sanitizePathSegment(draft.name || "Untitled Draft") || "Untitled Draft"
  const folderPath = path.join(PRODUCTS_ROOT, categoryFolder, productFolderName)

  await mkdir(folderPath, { recursive: true })
  await writeFile(path.join(folderPath, "details.txt"), detailsTextForDraft(draft), "utf8")

  const downloadedImages: string[] = []
  const failedImages: string[] = []
  const groupedImageUrls = variantImageUrls(draft)

  for (const [index, imageUrl] of draft.referenceImages.entries()) {
    if (groupedImageUrls.has(imageUrl)) continue
    try {
      downloadedImages.push(await downloadReferenceImage(imageUrl, folderPath, index))
    } catch {
      failedImages.push(imageUrl)
    }
  }

  for (const variant of draft.referenceImageVariants) {
    const variantFolderName = sanitizePathSegment(variant.name) || "Variant"
    const variantFolderPath = path.join(folderPath, variantFolderName)
    await mkdir(variantFolderPath, { recursive: true })

    for (const [index, imageUrl] of variant.images.entries()) {
      try {
        downloadedImages.push(await downloadReferenceImage(imageUrl, variantFolderPath, index))
      } catch {
        failedImages.push(imageUrl)
      }
    }
  }

  return { folderPath, downloadedImages, failedImages }
}
