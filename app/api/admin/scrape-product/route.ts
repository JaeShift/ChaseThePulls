import { NextRequest, NextResponse } from "next/server"
import { lookup } from "dns/promises"
import net from "net"
import { load } from "cheerio"
import { auth } from "@/lib/auth"
import { amazonMediaImageKey } from "@/lib/utils"
import {
  isAmazonUrl,
  scrapeAmazonGalleryWithBrowser,
  scrapeAmazonVariantsWithBrowser,
} from "@/lib/amazon-browser-scraper"
import { isUltraProUrl, parseImportLinkSource, type ImportLinkSource } from "@/lib/import-link-source"

/** Allow Playwright enough time for multi-color Amazon pages (local + compatible hosts). */
export const maxDuration = 180

const MAX_HTML_BYTES = 10 * 1024 * 1024
const MAX_REDIRECTS = 3
const MAX_REFERENCE_IMAGES = 48
const MAX_VARIANTS_TO_FETCH = 10

type JsonLdValue = string | number | boolean | null | JsonLdValue[] | { [key: string]: JsonLdValue }

type ProductDraft = {
  sourceUrl: string
  name?: string
  description?: string
  details?: string
  price?: number
  comparePrice?: number
  referenceImages: string[]
  referenceImageVariants?: ReferenceImageVariant[]
  browserScrapeWarning?: string
}

type ReferenceImageVariant = {
  name: string
  images: string[]
  asin?: string
}

type ParsedImportInput = {
  primaryUrl: string
  variantUrls: { name: string; url: string }[]
}

function isPrivateAddress(address: string) {
  if (net.isIP(address) === 4) {
    const parts = address.split(".").map(Number)
    const [a, b] = parts
    return (
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||
      a === 0
    )
  }

  if (net.isIP(address) === 6) {
    const normalized = address.toLowerCase()
    return (
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80:")
    )
  }

  return true
}

async function assertSafeUrl(url: URL) {
  if (url.protocol !== "https:") {
    throw new Error("Only HTTPS product URLs are supported.")
  }

  const hostname = url.hostname.toLowerCase()
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new Error("Local URLs cannot be scraped.")
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true })
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("This URL resolves to a private or unsupported network address.")
  }
}

async function fetchHtml(rawUrl: string) {
  let current = new URL(rawUrl)

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    await assertSafeUrl(current)

    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent":
          "Mozilla/5.0 (compatible; ChaseThePullsProductImporter/1.0; admin product drafting)",
      },
    })

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location")
      if (!location) throw new Error("The source redirected without a location header.")
      current = new URL(location, current)
      continue
    }

    if (!response.ok) {
      throw new Error(`The source returned HTTP ${response.status}.`)
    }

    const contentType = response.headers.get("content-type") ?? ""
    if (!contentType.includes("text/html")) {
      throw new Error("The source did not return an HTML product page.")
    }

    const contentLength = Number(response.headers.get("content-length") ?? 0)
    if (contentLength > MAX_HTML_BYTES) {
      throw new Error("The source page is too large to import.")
    }

    const html = await response.text()
    if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) {
      throw new Error("The source page is too large to import.")
    }

    return { html, finalUrl: current.toString() }
  }

  throw new Error("The source redirected too many times.")
}

function textFrom(value: unknown): string | undefined {
  if (typeof value === "string") {
    const cleaned = value.replace(/\s+/g, " ").trim()
    return cleaned || undefined
  }
  return undefined
}

function cleanImportLabel(value: string): string | undefined {
  const cleaned = value
    .replace(/[\r\n]+/g, " ")
    .replace(/^[\s:,\-–—|/]+|[\s:,\-–—|/]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
  return cleaned || undefined
}

function cleanImportUrl(value: string): string {
  return value.replace(/[),.;\]]+$/g, "")
}

function parseImportInput(input: string): ParsedImportInput {
  const matches = Array.from(input.matchAll(/https?:\/\/\S+/gi))
  if (!matches.length) throw new Error("Enter a valid product URL.")

  const variantUrls = matches.map((match, index) => {
    const rawUrl = match[0]
    const url = cleanImportUrl(rawUrl)
    const currentEnd = (match.index ?? 0) + rawUrl.length
    const nextStart = matches[index + 1]?.index ?? input.length
    const afterLabel = cleanImportLabel(input.slice(currentEnd, nextStart))
    const lineStart = input.lastIndexOf("\n", match.index ?? 0) + 1
    const beforeLabel = cleanImportLabel(input.slice(lineStart, match.index ?? 0))

    return {
      url,
      name: afterLabel ?? beforeLabel ?? `Variant ${index + 1}`,
    }
  })

  return { primaryUrl: variantUrls[0].url, variantUrls }
}

function numberFrom(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.]/g, ""))
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
  }
  return undefined
}

function absolutizeImageUrl(value: unknown, baseUrl: string): string {
  const url = textFrom(value)
  if (!url || url.startsWith("data:") || url.startsWith("blob:")) return ""

  try {
    return new URL(url, baseUrl).toString()
  } catch {
    return ""
  }
}

function firstSrcsetUrl(value: unknown): string | undefined {
  const srcset = textFrom(value)
  if (!srcset) return undefined
  return srcset
    .split(",")
    .map((entry) => entry.trim().split(/\s+/)[0])
    .find(Boolean)
}

function normalizeAmazonImageUrl(url: string): string {
  return url.replace(/\._[^/.]+_\.(jpe?g|png|webp)(\?.*)?$/i, ".$1$2")
}

function normalizeImageUrl(url: string): string {
  return url.includes("m.media-amazon.com/images/") ? normalizeAmazonImageUrl(url) : url
}

function backgroundImageUrlsFromStyle(value: unknown): string[] {
  const style = textFrom(value)
  if (!style) return []
  return Array.from(style.matchAll(/url\((["']?)(.*?)\1\)/gi))
    .map((match) => match[2])
    .filter(Boolean)
}

function cleanVariantName(value: unknown): string | undefined {
  const name = textFrom(value)
    ?.replace(/^click to select\s*/i, "")
    .replace(/^selected\s*/i, "")
    .replace(/^color\s*:\s*/i, "")
    .replace(/\$\d+(?:\.\d{2})?.*$/g, "")
    .replace(/\s+color$/i, "")
    .replace(/\s+-\s+image$/i, "")
    .trim()
  return name || undefined
}

function asinFromValue(value: unknown): string | undefined {
  const text = textFrom(value)
  if (!text) return undefined
  const direct = text.match(/^[A-Z0-9]{10}$/i)?.[0]
  if (direct) return direct.toUpperCase()
  const fromPath = text.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i)?.[1]
  return fromPath?.toUpperCase()
}

function normalizedImageCandidate(value: unknown, baseUrl: string): string {
  const absoluteUrl = absolutizeImageUrl(value, baseUrl)
  if (!absoluteUrl) return ""
  return normalizeImageUrl(absoluteUrl)
}

function looksLikeProductImage(url: string): boolean {
  const lower = url.toLowerCase()
  if (!/\.(avif|gif|jpe?g|png|webp)(\?|$)/.test(lower)) return false
  if (/(logo|icon|sprite|avatar|placeholder|transparent|loading|payment|banner)/.test(lower)) {
    return false
  }
  return true
}

function visibleAmazonPrice($: ReturnType<typeof load>): number | undefined {
  const offscreenPrice = [
    "#corePriceDisplay_desktop_feature_div .a-price .a-offscreen",
    "#corePrice_feature_div .a-price .a-offscreen",
    "#apex_desktop .a-price .a-offscreen",
    ".apexPriceToPay .a-offscreen",
    ".priceToPay .a-offscreen",
    ".a-price .a-offscreen",
  ]
    .map((selector) => numberFrom($(selector).first().text()))
    .find((price): price is number => typeof price === "number")

  if (offscreenPrice) return offscreenPrice

  const priceRoots = [
    "#corePriceDisplay_desktop_feature_div .a-price",
    "#corePrice_feature_div .a-price",
    "#apex_desktop .a-price",
    ".apexPriceToPay",
    ".priceToPay",
    ".a-price",
  ]

  for (const selector of priceRoots) {
    const root = $(selector).first()
    const whole = textFrom(root.find(".a-price-whole").first().text())?.replace(/[^\d]/g, "")
    if (!whole) continue

    const fraction =
      textFrom(root.find(".a-price-fraction").first().text())?.replace(/[^\d]/g, "").slice(0, 2) || "00"
    return numberFrom(`${whole}.${fraction.padEnd(2, "0")}`)
  }

  return undefined
}

function amazonGalleryImagesFrom($: ReturnType<typeof load>, baseUrl: string): string[] {
  const amazonGalleryImages: string[] = []

  $(".ivThumbImage, #ivThumbs .ivThumbImage").each((_, el) => {
    backgroundImageUrlsFromStyle($(el).attr("style")).forEach((url) => {
      const absoluteUrl = normalizedImageCandidate(url, baseUrl)
      if (absoluteUrl && looksLikeProductImage(absoluteUrl)) {
        amazonGalleryImages.push(absoluteUrl)
      }
    })
  })

  $("#altImages img").each((_, el) => {
    const element = $(el)
    const absoluteUrl = normalizeImageUrl(
      absolutizeImageUrl(
        element.attr("src") ??
          element.attr("data-src") ??
          element.attr("data-a-hires") ??
          element.attr("data-old-hires") ??
          firstSrcsetUrl(element.attr("srcset")) ??
          firstSrcsetUrl(element.attr("data-srcset")),
        baseUrl
      )
    )
    if (absoluteUrl && looksLikeProductImage(absoluteUrl)) {
      amazonGalleryImages.push(absoluteUrl)
    }
  })

  return Array.from(new Set(amazonGalleryImages)).slice(0, MAX_REFERENCE_IMAGES)
}

function genericProductReferenceImages(html: string, baseUrl: string): string[] {
  const $ = load(html)
  const imageCandidates: string[] = []
  $(["main img", "article img", '[class*="product" i] img', '[id*="product" i] img', '[class*="gallery" i] img', '[class*="media" i] img', "img"].join(",")).each(
    (_, el) => {
      const element = $(el)
      const width = Number(element.attr("width") ?? 0)
      const height = Number(element.attr("height") ?? 0)
      const tooSmall = width > 0 && height > 0 && (width < 160 || height < 160)
      if (tooSmall) return

      const url =
        element.attr("src") ??
        element.attr("data-src") ??
        element.attr("data-original") ??
        element.attr("data-image") ??
        firstSrcsetUrl(element.attr("srcset")) ??
        firstSrcsetUrl(element.attr("data-srcset"))

      const absoluteUrl = absolutizeImageUrl(url, baseUrl)
      if (absoluteUrl && looksLikeProductImage(absoluteUrl)) {
        imageCandidates.push(normalizeImageUrl(absoluteUrl))
      }
    }
  )

  $("source[srcset], source[data-srcset]").each((_, el) => {
    const element = $(el)
    const absoluteUrl = absolutizeImageUrl(
      firstSrcsetUrl(element.attr("srcset")) ?? firstSrcsetUrl(element.attr("data-srcset")),
      baseUrl
    )
    if (absoluteUrl && looksLikeProductImage(absoluteUrl)) {
      imageCandidates.push(normalizeImageUrl(absoluteUrl))
    }
  })

  return Array.from(new Set(imageCandidates)).slice(0, MAX_REFERENCE_IMAGES)
}

function urlsMatchImporter(urls: { url: string }[], source: ImportLinkSource) {
  for (const row of urls) {
    try {
      const ok = source === "amazon" ? isAmazonUrl(row.url) : isUltraProUrl(row.url)
      if (!ok) return row.url
    } catch {
      return row.url
    }
  }
  return null
}

function jsonLdTypeMatches(value: unknown, typeName: string): boolean {
  if (typeof value === "string") return value.toLowerCase() === typeName.toLowerCase()
  if (Array.isArray(value)) return value.some((item) => jsonLdTypeMatches(item, typeName))
  return false
}

function collectProductNodes(value: JsonLdValue, products: Record<string, JsonLdValue>[]) {
  if (!value || typeof value !== "object") return

  if (Array.isArray(value)) {
    value.forEach((item) => collectProductNodes(item, products))
    return
  }

  if (jsonLdTypeMatches(value["@type"], "Product")) {
    products.push(value)
  }

  Object.values(value).forEach((nested) => collectProductNodes(nested, products))
}

function imageUrlsFrom(value: unknown, baseUrl: string): string[] {
  const candidates: unknown[] = Array.isArray(value) ? value : [value]
  return candidates
    .flatMap((candidate) => {
      if (typeof candidate === "string") return [candidate]
      if (candidate && typeof candidate === "object" && "url" in candidate) {
        return [candidate.url]
      }
      return []
    })
    .map((url) => textFrom(url))
    .filter((url): url is string => !!url)
    .map((url) => absolutizeImageUrl(url, baseUrl))
    .map(normalizeImageUrl)
    .filter(Boolean)
}

function extractJsonLdDraft(html: string, baseUrl: string): Partial<ProductDraft> {
  const $ = load(html)
  const products: Record<string, JsonLdValue>[] = []

  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text()
    if (!raw.trim()) return

    try {
      collectProductNodes(JSON.parse(raw) as JsonLdValue, products)
    } catch {
      // Ignore malformed JSON-LD and continue with other metadata.
    }
  })

  const product = products[0]
  if (!product) return {}

  const offers = Array.isArray(product.offers) ? product.offers[0] : product.offers
  const price =
    offers && typeof offers === "object" && !Array.isArray(offers)
      ? numberFrom(offers.price ?? offers.lowPrice)
      : undefined

  return {
    name: textFrom(product.name),
    description: textFrom(product.description),
    details: textFrom(product.description),
    price,
    referenceImages: imageUrlsFrom(product.image, baseUrl),
  }
}

function extractMetaDraft(html: string, baseUrl: string): Partial<ProductDraft> {
  const $ = load(html)
  const meta = (selector: string) => textFrom($(selector).attr("content"))
  const title = textFrom($("title").first().text())
  const productTitle =
    textFrom($("#productTitle").first().text()) ??
    textFrom($('[itemprop="name"]').first().text()) ??
    textFrom($('[data-testid="product-title"]').first().text())
  const price =
    numberFrom(meta('meta[property="product:price:amount"]')) ??
    numberFrom(meta('meta[name="twitter:data1"]'))

  const imageCandidates = [
    meta('meta[property="og:image"]'),
    meta('meta[property="og:image:url"]'),
    meta('meta[property="og:image:secure_url"]'),
    meta('meta[name="twitter:image"]'),
    meta('meta[name="twitter:image:src"]'),
    textFrom($('link[rel="image_src"]').attr("href")),
  ].filter((url): url is string => !!url)

  return {
    name:
      productTitle ??
      meta('meta[property="og:title"]') ??
      meta('meta[name="twitter:title"]') ??
      title,
    description:
      meta('meta[property="og:description"]') ??
      meta('meta[name="twitter:description"]') ??
      meta('meta[name="description"]'),
    price,
    referenceImages: imageUrlsFrom(imageCandidates, baseUrl),
  }
}

function extractHtmlImageDraft(html: string, baseUrl: string, opts?: { allowAmazonSelectors?: boolean }): Partial<ProductDraft> {
  const allowAmazonSelectors = opts?.allowAmazonSelectors !== false

  if (!allowAmazonSelectors) {
    return { referenceImages: genericProductReferenceImages(html, baseUrl) }
  }

  const $ = load(html)
  const amazonGalleryImages = amazonGalleryImagesFrom($, baseUrl)
  const amazonVariantImages: string[] = []
  const amazonVariantMap = new Map<string, string[]>()
  const amazonVariantAsins = new Map<string, string>()

  const pushVariantImage = (name: string | undefined, url: unknown, asin?: string) => {
    const absoluteUrl = normalizedImageCandidate(url, baseUrl)
    if (!name || !absoluteUrl || !looksLikeProductImage(absoluteUrl)) return
    const current = amazonVariantMap.get(name) ?? []
    current.push(absoluteUrl)
    amazonVariantMap.set(name, current)
    if (asin) amazonVariantAsins.set(name, asin)
    amazonVariantImages.push(absoluteUrl)
  }

  const selectedColorName =
    cleanVariantName($("#variation_color_name .selection").first().text()) ??
    cleanVariantName($("#variation_color_name .a-color-secondary").first().text())

  if (selectedColorName && amazonGalleryImages.length > 0) {
    amazonVariantMap.set(selectedColorName, [...amazonGalleryImages])
  }

  $(
    [
      "#variation_color_name img",
      "#variation_color_name .imgSwatch",
      "#variation_color_name li[data-asin] img",
      "#variation_color_name li[data-asin] input.a-button-input",
      "#twister_feature_div img[src*='m.media-amazon.com']",
      "#twister_feature_div li[data-asin] input.a-button-input",
      "#twister_feature_div .imgSwatch",
      "li.swatchAvailable img",
      "li.swatchSelect img",
      "[data-defaultasin] img",
      "#variation_color_name input.a-button-input",
      "#twister_feature_div input.a-button-input[aria-labelledby]",
    ].join(",")
  ).each((_, el) => {
    const element = $(el)
    const swatch = element.closest("[data-defaultasin], [data-asin], [data-dp-url], li, span, div")
    const asin =
      asinFromValue(swatch.attr("data-defaultasin")) ??
      asinFromValue(swatch.attr("data-asin")) ??
      asinFromValue(swatch.attr("data-dp-url")) ??
      asinFromValue(swatch.find("a").first().attr("href")) ??
      asinFromValue(element.closest("a").attr("href")) ??
      asinFromValue(element.attr("data-defaultasin")) ??
      asinFromValue(element.attr("data-asin"))
    const imageElement = element.is("img") ? element : swatch.find("img").first()
    const variantName =
      cleanVariantName(imageElement.attr("alt")) ??
      cleanVariantName(element.attr("alt")) ??
      cleanVariantName(element.attr("title")) ??
      cleanVariantName(swatch.attr("title")) ??
      cleanVariantName(swatch.attr("aria-label")) ??
      cleanVariantName(swatch.attr("data-a-tooltip")) ??
      cleanVariantName($(`#${element.attr("aria-labelledby")}`).text()) ??
      cleanVariantName(swatch.text())

    const urls = [
      imageElement.attr("src"),
      imageElement.attr("data-src"),
      imageElement.attr("data-a-hires"),
      imageElement.attr("data-old-hires"),
      firstSrcsetUrl(imageElement.attr("srcset")),
      firstSrcsetUrl(imageElement.attr("data-srcset")),
      ...backgroundImageUrlsFromStyle(imageElement.attr("style")),
      ...backgroundImageUrlsFromStyle(swatch.attr("style")),
    ]

    urls.forEach((url) => pushVariantImage(variantName, url, asin))
  })

  if (amazonGalleryImages.length > 0 || amazonVariantImages.length > 0) {
    const referenceImageVariants = Array.from(amazonVariantMap.entries()).map(([name, images]) => ({
      name,
      images: Array.from(new Set(images)).slice(0, MAX_REFERENCE_IMAGES),
      asin: amazonVariantAsins.get(name),
    }))

    return {
      referenceImages: Array.from(new Set([...amazonGalleryImages, ...amazonVariantImages])).slice(
        0,
        MAX_REFERENCE_IMAGES
      ),
      referenceImageVariants,
    }
  }

  return { referenceImages: genericProductReferenceImages(html, baseUrl) }
}

function extractHtmlTextDraft(html: string): Partial<ProductDraft> {
  const $ = load(html)
  const detailItems = [
    "#feature-bullets li .a-list-item",
    "ul.a-unordered-list.a-vertical.a-spacing-mini li .a-list-item",
    '[class*="product" i] li',
  ]
    .flatMap((selector) =>
      $(selector)
        .toArray()
        .map((el) => textFrom($(el).text()))
    )
    .filter((item): item is string => !!item && item.length > 20)

  const details = Array.from(new Set(detailItems)).slice(0, 12).join("\n")
  const price = visibleAmazonPrice($)

  return {
    ...(details ? { details } : {}),
    ...(typeof price === "number" ? { price } : {}),
  }
}

function mergeDrafts(
  sourceUrl: string,
  jsonLd: Partial<ProductDraft>,
  meta: Partial<ProductDraft>,
  htmlImages: Partial<ProductDraft>,
  htmlText: Partial<ProductDraft>
) {
  const referenceImages = Array.from(
    new Set([
      ...(jsonLd.referenceImages ?? []),
      ...(meta.referenceImages ?? []),
      ...(htmlImages.referenceImages ?? []),
    ])
  ).slice(0, MAX_REFERENCE_IMAGES)
  const referenceImageVariants = htmlImages.referenceImageVariants ?? []

  const description = jsonLd.description ?? meta.description

  return {
    sourceUrl,
    name: jsonLd.name ?? meta.name,
    description,
    details: jsonLd.details ?? htmlText.details ?? description,
    price: jsonLd.price ?? meta.price ?? htmlText.price,
    comparePrice: jsonLd.comparePrice ?? meta.comparePrice,
    referenceImages,
    referenceImageVariants,
  } satisfies ProductDraft
}

function amazonVariantUrl(sourceUrl: string, asin: string): string {
  const url = new URL(sourceUrl)
  url.pathname = `/dp/${asin}`
  url.search = ""
  url.searchParams.set("th", "1")
  url.searchParams.set("psc", "1")
  return url.toString()
}

async function enrichAmazonVariantImages(
  sourceUrl: string,
  draft: ProductDraft
): Promise<ProductDraft> {
  const variants = draft.referenceImageVariants ?? []
  if (!variants.some((variant) => variant.asin)) return draft

  const enrichedVariants: ReferenceImageVariant[] = []

  for (const variant of variants.slice(0, MAX_VARIANTS_TO_FETCH)) {
    if (!variant.asin) {
      enrichedVariants.push(variant)
      continue
    }

    try {
      const variantUrl = amazonVariantUrl(sourceUrl, variant.asin)
      const { html, finalUrl } = await fetchHtml(variantUrl)
      const galleryImages = amazonGalleryImagesFrom(load(html), finalUrl)
      enrichedVariants.push({
        name: variant.name,
        images: Array.from(new Set([...galleryImages, ...variant.images])).slice(
          0,
          MAX_REFERENCE_IMAGES
        ),
        asin: variant.asin,
      })
    } catch {
      enrichedVariants.push(variant)
    }
  }

  const overflowVariants = variants.slice(MAX_VARIANTS_TO_FETCH)
  const referenceImageVariants = [...enrichedVariants, ...overflowVariants].map(
    ({ name, images }) => ({ name, images })
  )
  const variantImages = referenceImageVariants.flatMap((variant) => variant.images)

  return {
    ...draft,
    referenceImages: Array.from(new Set([...draft.referenceImages, ...variantImages])).slice(
      0,
      MAX_REFERENCE_IMAGES
    ),
    referenceImageVariants,
  }
}

function stripReferenceImagesSeenInVariants(referenceImages: string[], variantImages: string[]): string[] {
  const variantKeys = new Set(
    variantImages.map((u) => amazonMediaImageKey(u)).filter((k): k is string => !!k)
  )
  return referenceImages.filter((img) => {
    if (variantImages.includes(img)) return false
    const key = amazonMediaImageKey(img)
    if (key && variantKeys.has(key)) return false
    return true
  })
}

function variantNameKey(name: string): string {
  return name.trim().toLowerCase()
}

function mergeReferenceImageVariants(
  primary: ReferenceImageVariant[],
  fallback: ReferenceImageVariant[] = []
): ReferenceImageVariant[] {
  const byName = new Map<string, ReferenceImageVariant>()

  for (const variant of [...fallback, ...primary]) {
    const key = variantNameKey(variant.name)
    if (!key) continue

    const existing = byName.get(key)
    byName.set(key, {
      name: variant.name,
      images: Array.from(new Set([...(existing?.images ?? []), ...variant.images])).slice(
        0,
        MAX_REFERENCE_IMAGES
      ),
    })
  }

  return Array.from(byName.values()).filter((variant) => variant.images.length > 0)
}

function addImagesToVariant(
  variants: ReferenceImageVariant[],
  variantName: string | undefined,
  images: string[]
): ReferenceImageVariant[] {
  if (!variantName || !images.length) return variants

  const targetKey = variantNameKey(variantName)
  let found = false

  const merged = variants.map((variant) => {
    if (variantNameKey(variant.name) !== targetKey) return variant
    found = true
    return {
      ...variant,
      images: Array.from(new Set([...variant.images, ...images])).slice(0, MAX_REFERENCE_IMAGES),
    }
  })

  return found ? merged : [{ name: variantName, images }, ...variants]
}

function groupAmazonDraftImages(draft: ProductDraft): ProductDraft {
  const variants = (draft.referenceImageVariants ?? []).filter((variant) => variant.images.length > 0)
  if (!variants.length) return draft

  const variantImages = variants.flatMap((variant) => variant.images)
  const scrubbed = stripReferenceImagesSeenInVariants(draft.referenceImages, variantImages)
  const groupedVariants = addImagesToVariant(variants, variants[0]?.name, scrubbed)
  const groupedVariantImages = groupedVariants.flatMap((variant) => variant.images)

  return {
    ...draft,
    referenceImages: Array.from(new Set(groupedVariantImages)).slice(0, MAX_REFERENCE_IMAGES),
    referenceImageVariants: groupedVariants,
  }
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timeoutId = setTimeout(() => resolve(null), ms)
      }),
    ])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

async function enrichWithBrowserVariants(sourceUrl: string, draft: ProductDraft): Promise<ProductDraft> {
  if (!isAmazonUrl(sourceUrl)) return draft

  try {
    const browserResult = await withTimeout(scrapeAmazonVariantsWithBrowser(sourceUrl), 15000)
    if (!browserResult) {
      return {
        ...groupAmazonDraftImages(draft),
        browserScrapeWarning:
          "Amazon browser scraping took too long. Imported the images available in the page HTML only.",
      }
    }
    if (browserResult.blocked) {
      return {
        ...draft,
        browserScrapeWarning:
          "Amazon blocked the browser scraper. Imported the images available in the page HTML only.",
      }
    }

    const browserVariants = browserResult.referenceImageVariants.filter(
      (variant) => variant.images.length > 0
    )
    if (!browserVariants.length && !browserResult.referenceImages.length) return draft

    const htmlImageCount =
      draft.referenceImages.length +
      (draft.referenceImageVariants ?? []).reduce((total, variant) => total + variant.images.length, 0)
    const browserImageCount =
      browserResult.referenceImages.length +
      browserVariants.reduce((total, variant) => total + variant.images.length, 0)

    if (htmlImageCount > 0 && browserImageCount < htmlImageCount) {
      return {
        ...groupAmazonDraftImages(draft),
        browserScrapeWarning:
          "Amazon browser scraping returned fewer images than the page HTML. Kept the HTML gallery photos instead.",
      }
    }

    const mergedVariants = browserVariants.length
      ? mergeReferenceImageVariants(browserVariants, draft.referenceImageVariants)
      : draft.referenceImageVariants ?? []
    const variantImages = mergedVariants.flatMap((variant) => variant.images)
    const scrubbed = stripReferenceImagesSeenInVariants(
      [...draft.referenceImages, ...browserResult.referenceImages],
      variantImages
    )
    const groupedVariants = browserVariants.length
      ? addImagesToVariant(mergedVariants, browserVariants[0]?.name, scrubbed)
      : mergedVariants
    const groupedVariantImages = groupedVariants.flatMap((variant) => variant.images)
    const ungroupedImages = browserVariants.length
      ? []
      : stripReferenceImagesSeenInVariants(scrubbed, groupedVariantImages)

    return {
      ...draft,
      referenceImages: Array.from(new Set([...ungroupedImages, ...groupedVariantImages])).slice(
        0,
        MAX_REFERENCE_IMAGES
      ),
      referenceImageVariants: groupedVariants.length ? groupedVariants : draft.referenceImageVariants,
    }
  } catch {
    return {
      ...draft,
      browserScrapeWarning:
        "Browser variant scraping failed. Imported the images available in the page HTML only.",
    }
  }
}

async function enrichWithExplicitVariantUrls(
  draft: ProductDraft,
  variantUrls: ParsedImportInput["variantUrls"]
): Promise<ProductDraft> {
  if (variantUrls.length <= 1) return draft

  const variants: ReferenceImageVariant[] = []
  let blockedCount = 0

  for (const variant of variantUrls.slice(0, MAX_VARIANTS_TO_FETCH)) {
    try {
      const result = isAmazonUrl(variant.url)
        ? await scrapeAmazonGalleryWithBrowser(variant.url)
        : {
            images: genericProductReferenceImages((await fetchHtml(variant.url)).html, variant.url),
          }

      if ("blocked" in result && result.blocked) blockedCount += 1

      variants.push({
        name: variant.name,
        images: result.images.length ? result.images : [],
      })
    } catch {
      variants.push({ name: variant.name, images: [] })
    }
  }

  const variantsWithImages = mergeReferenceImageVariants(
    variants.filter((variant) => variant.images.length > 0),
    draft.referenceImageVariants
  )
  if (!variantsWithImages.length) return draft

  const variantImages = variantsWithImages.flatMap((variant) => variant.images)
  const scrubbed = stripReferenceImagesSeenInVariants(draft.referenceImages, variantImages)
  return {
    ...draft,
    browserScrapeWarning: blockedCount
      ? `${blockedCount} variant page(s) were blocked by Amazon. Imported the variant images that were available.`
      : draft.browserScrapeWarning,
    referenceImages: Array.from(new Set([...scrubbed, ...variantImages])).slice(0, MAX_REFERENCE_IMAGES),
    referenceImageVariants: variantsWithImages,
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = (await req.json()) as { url?: string; source?: unknown }
    if (!body.url) {
      return NextResponse.json({ error: "Product URL is required." }, { status: 400 })
    }

    let parsedInput: ParsedImportInput
    try {
      parsedInput = parseImportInput(body.url)
    } catch {
      return NextResponse.json({ error: "Enter a valid product URL." }, { status: 400 })
    }

    const source = parseImportLinkSource(body.source)
    const badUrlForImporter = urlsMatchImporter(parsedInput.variantUrls, source)
    if (badUrlForImporter) {
      return NextResponse.json(
        {
          error:
            source === "amazon"
              ? `Use Amazon links with the Amazon importer, or switch to Ultra PRO. Unrecognized URL: ${badUrlForImporter}`
              : `Use Ultra PRO / Ultra Gaming (e.g. shop.ultragaming.com) links with that importer, or switch to Amazon. Unrecognized URL: ${badUrlForImporter}`,
        },
        { status: 400 }
      )
    }

    let url: URL
    try {
      url = new URL(parsedInput.primaryUrl)
    } catch {
      return NextResponse.json({ error: "Enter a valid product URL." }, { status: 400 })
    }

    const { html, finalUrl } = await fetchHtml(url.toString())
    const draft = mergeDrafts(
      finalUrl,
      extractJsonLdDraft(html, finalUrl),
      extractMetaDraft(html, finalUrl),
      extractHtmlImageDraft(html, finalUrl, { allowAmazonSelectors: source === "amazon" }),
      extractHtmlTextDraft(html)
    )

    let htmlEnrichedDraft: ProductDraft = draft
    let browserEnrichedDraft: ProductDraft = draft

    if (source === "amazon") {
      const skipImplicitAmazonVariants = isAmazonUrl(finalUrl) && parsedInput.variantUrls.length === 1
      htmlEnrichedDraft = skipImplicitAmazonVariants ? draft : await enrichAmazonVariantImages(finalUrl, draft)
      browserEnrichedDraft = await enrichWithBrowserVariants(finalUrl, htmlEnrichedDraft)
    }

    return NextResponse.json({
      draft: await enrichWithExplicitVariantUrls(browserEnrichedDraft, parsedInput.variantUrls),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to import this product."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
