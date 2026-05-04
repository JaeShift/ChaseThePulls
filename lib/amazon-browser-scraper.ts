import "server-only"
import { setTimeout as sleep } from "node:timers/promises"
import { chromium, type Browser, type Page } from "playwright"

const MAX_VARIANTS = 10
const MAX_IMAGES_PER_VARIANT = 24
const PAGE_TIMEOUT_MS = 25000

export type BrowserReferenceImageVariant = {
  name: string
  images: string[]
}

type BrowserColorOption = {
  checked: boolean
  index: number
  name: string
  asin?: string
}

export type AmazonBrowserScrapeResult = {
  referenceImages: string[]
  referenceImageVariants: BrowserReferenceImageVariant[]
  blocked?: boolean
}

export type AmazonBrowserGalleryResult = {
  images: string[]
  blocked?: boolean
}

function normalizeAmazonImageUrl(url: string): string {
  return url.replace(/\._[^/.]+_\.(jpe?g|png|webp)(\?.*)?$/i, ".$1$2")
}

function normalizeImageUrl(url: string): string {
  return url.includes("m.media-amazon.com/images/") ? normalizeAmazonImageUrl(url) : url
}

function cleanVariantName(value: string | null | undefined): string | undefined {
  const name = value
    ?.replace(/\s+/g, " ")
    .replace(/^click to select\s*/i, "")
    .replace(/^selected\s*/i, "")
    .replace(/^color\s*:\s*/i, "")
    .replace(/\$\d+(?:\.\d{2})?.*$/g, "")
    .replace(/\s+color$/i, "")
    .replace(/\s+-\s+image$/i, "")
    .trim()
  return name || undefined
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function looksLikeProductImage(url: string): boolean {
  const lower = url.toLowerCase()
  return (
    /\.(avif|gif|jpe?g|png|webp)(\?|$)/.test(lower) &&
    !/(logo|icon|sprite|avatar|placeholder|transparent|loading|payment|banner)/.test(lower)
  )
}

async function isBlocked(page: Page): Promise<boolean> {
  const title = (await page.title().catch(() => "")).toLowerCase()
  const bodyText = (await page.locator("body").innerText({ timeout: 2000 }).catch(() => "")).toLowerCase()
  return (
    title.includes("robot check") ||
    bodyText.includes("enter the characters you see below") ||
    bodyText.includes("sorry, we just need to make sure you're not a robot") ||
    (await page.locator("form[action*='validateCaptcha']").count()) > 0
  )
}

async function continueShoppingIfPresent(page: Page) {
  const bodyText = (await page.locator("body").innerText({ timeout: 2000 }).catch(() => "")).toLowerCase()
  if (!bodyText.includes("continue shopping")) return

  const continueButton = page.getByRole("button", { name: /continue shopping/i }).first()
  if ((await continueButton.count().catch(() => 0)) > 0) {
    await continueButton.click({ timeout: 3000 }).catch(() => undefined)
    await page.waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(() => undefined)
    await sleep(1000)
    return
  }

  const continueInput = page.locator("input[type='submit'][aria-label*='Continue' i], input[type='submit'][value*='Continue' i]").first()
  if ((await continueInput.count().catch(() => 0)) > 0) {
    await continueInput.click({ timeout: 3000 }).catch(() => undefined)
    await page.waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(() => undefined)
    await sleep(1000)
  }
}

async function galleryImages(page: Page): Promise<string[]> {
  const urls = await page.evaluate(() => {
    const imageUrls: string[] = []
    const add = (value: unknown) => {
      if (typeof value === "string" && value.trim()) imageUrls.push(value.trim())
    }
    const firstSrcsetUrl = (value: string | null) =>
      value
        ?.split(",")
        .map((entry) => entry.trim().split(/\s+/)[0])
        .find(Boolean)

    document.querySelectorAll(".ivThumbImage, #ivThumbs .ivThumbImage").forEach((el) => {
      const style = el.getAttribute("style") ?? ""
      for (const match of style.matchAll(/url\((["']?)(.*?)\1\)/gi)) {
        add(match[2])
      }
    })

    document.querySelectorAll("#altImages img, #imageBlock img, #main-image-container img").forEach((el) => {
      const img = el as HTMLImageElement
      add(img.getAttribute("data-a-hires"))
      add(img.getAttribute("data-old-hires"))
      add(img.currentSrc)
      add(img.src)
      add(img.getAttribute("data-src"))
      add(firstSrcsetUrl(img.getAttribute("srcset")))
      add(firstSrcsetUrl(img.getAttribute("data-srcset")))
    })

    const landingImage = document.querySelector("#landingImage") as HTMLImageElement | null
    if (landingImage) {
      add(landingImage.getAttribute("data-a-dynamic-image"))
      add(landingImage.getAttribute("data-old-hires"))
      add(landingImage.currentSrc)
      add(landingImage.src)
    }

    return imageUrls
  })

  const expanded = urls.flatMap((url) => {
    if (url.trim().startsWith("{")) {
      try {
        return Object.keys(JSON.parse(url) as Record<string, unknown>)
      } catch {
        return []
      }
    }
    return [url]
  })

  return unique(expanded.map(normalizeImageUrl).filter(looksLikeProductImage)).slice(
    0,
    MAX_IMAGES_PER_VARIANT
  )
}

async function immersiveThumbnailImages(page: Page): Promise<string[]> {
  const urls = await page.evaluate(() => {
    const imageUrls: string[] = []

    document.querySelectorAll(".ivThumbImage, #ivThumbs .ivThumbImage").forEach((el) => {
      const style = el.getAttribute("style") ?? ""
      for (const match of style.matchAll(/url\((["']?)(.*?)\1\)/gi)) {
        if (match[2]) imageUrls.push(match[2])
      }
    })

    return imageUrls
  })

  return unique(urls.map(normalizeImageUrl).filter(looksLikeProductImage)).slice(
    0,
    MAX_IMAGES_PER_VARIANT
  )
}

async function imageThumbnailRadioImages(page: Page): Promise<string[]> {
  const urls = await page.evaluate(() => {
    const roots = [
      document.querySelector('ul[aria-label="Image thumbnails"][role="radiogroup"]'),
      document.querySelector("ul.gridAltImageViewLayoutIn1x7"),
      document.querySelector("#imageBlock ul.a-button-toggle-group[role='radiogroup']"),
    ].filter(Boolean) as Element[]

    const rows: { pos: number; url: string }[] = []

    for (const root of roots) {
      const inputs = Array.from(
        root.querySelectorAll<HTMLInputElement>("input.a-button-input[aria-posinset][aria-setsize]")
      )

      for (const input of inputs) {
        const pos = parseInt(input.getAttribute("aria-posinset") ?? "0", 10)
        const setsize = parseInt(input.getAttribute("aria-setsize") ?? "0", 10)
        if (pos < 1 || setsize < 2 || pos > setsize) continue

        const labelId = input.getAttribute("aria-labelledby")
        const label = labelId ? document.getElementById(labelId) : null
        const image =
          label?.querySelector<HTMLImageElement>("img") ??
          input.closest("li")?.querySelector<HTMLImageElement>("img")
        const url = image?.getAttribute("src") ?? image?.getAttribute("data-src") ?? ""
        if (url) rows.push({ pos, url })
      }

      if (rows.length > 0) break
    }

    return rows
      .sort((a, b) => a.pos - b.pos)
      .map((row) => row.url)
  })

  return unique(urls.map(normalizeImageUrl).filter(looksLikeProductImage)).slice(
    0,
    MAX_IMAGES_PER_VARIANT
  )
}

/** New PDP layout: thumbnail strip is often outside #altImages (gridAltImageViewLayoutIn1x7, etc.). */
const IMAGE_THUMB_STRIP_SELECTORS = [
  'ul[aria-label="Image thumbnails"][role="radiogroup"]',
  "ul.gridAltImageViewLayoutIn1x7",
  "#imageBlock ul.a-button-toggle-group[role='radiogroup']",
]

async function locatorFirstMatching(page: Page, selectors: string[]) {
  for (const sel of selectors) {
    const count = await page.locator(sel).count().catch(() => 0)
    if (count > 0) return page.locator(sel).first()
  }
  return null
}

async function clickPrimaryThumbnailStrip(page: Page, absorb: (batch: string[]) => void): Promise<boolean> {
  const stripLocator = await locatorFirstMatching(page, IMAGE_THUMB_STRIP_SELECTORS)
  if (!stripLocator) return false

  const items = stripLocator.locator("li.imageThumbnail")
  const n = await items.count().catch(() => 0)
  const limit = Math.min(Math.max(n, 0), 14)
  if (limit < 1) return false

  for (let i = 0; i < limit; i++) {
    const item = items.nth(i)
    await item.scrollIntoViewIfNeeded().catch(() => undefined)
    await item.click({ timeout: 4000 }).catch(async () => {
      const input = item.locator("input.a-button-input").first()
      await input.click({ timeout: 4000, force: true }).catch(() => undefined)
    })
    await sleep(450)
    absorb(await galleryImages(page))
  }

  return true
}

type GalleryRadioMeta = { setsize: string; positions: number[] }

/** Prefer radios inside the labeled image thumbnail strip so we never confuse another radiogroup on the page. */
async function detectGalleryRadioGroup(page: Page): Promise<GalleryRadioMeta | null> {
  const scopedStrip = await locatorFirstMatching(page, IMAGE_THUMB_STRIP_SELECTORS)
  if (scopedStrip) {
    const meta = await scopedStrip.evaluate((strip) => {
      const inputs = Array.from(
        strip.querySelectorAll<HTMLInputElement>("input.a-button-input[aria-setsize][aria-posinset]")
      )
      if (inputs.length < 2) return null

      const ss = inputs[0]?.getAttribute("aria-setsize")?.trim() ?? ""
      const n = parseInt(ss, 10)
      if (n < 2 || n > 16) return null

      const byPos = new Map<number, HTMLInputElement>()
      for (const inp of inputs) {
        if (inp.getAttribute("aria-setsize")?.trim() !== ss) continue
        const p = parseInt(inp.getAttribute("aria-posinset") ?? "0", 10)
        if (p < 1) continue
        const prev = byPos.get(p)
        if (!prev) {
          byPos.set(p, inp)
          continue
        }
        const prevHidden = Boolean(prev.closest(".aok-hidden, [aria-hidden='true']"))
        const curHidden = Boolean(inp.closest(".aok-hidden, [aria-hidden='true']"))
        if (prevHidden && !curHidden) byPos.set(p, inp)
      }

      const positions = [...byPos.keys()].sort((a, b) => a - b).slice(0, n)
      return positions.length >= 2 ? { setsize: ss, positions } : null
    })

    if (meta) return meta
  }

  return page.evaluate(() => {
    const roots = [
      document.querySelector('ul[aria-label="Image thumbnails"][role="radiogroup"]'),
      document.querySelector("ul.gridAltImageViewLayoutIn1x7"),
      document.querySelector("#altImages"),
      document.querySelector("#imageBlock"),
      document.querySelector("#leftCol"),
      document.querySelector("#ppd"),
    ].filter(Boolean) as Element[]

    const excludeSel = "#variation_color_name, #twister_feature_div, #variation_size_name"

    const outsideTwister = (el: Element) => !el.closest(excludeSel)

    const isGalleryInput = (inp: HTMLInputElement) => {
      if (!outsideTwister(inp)) return false
      const role = inp.getAttribute("role")
      const inGalleryUi = Boolean(
        inp.closest(
          '#altImages, #imageBlock, ul[aria-label="Image thumbnails"], ul.gridAltImageViewLayoutIn1x7'
        )
      )
      if (role === "radio") return true
      if (inp.type === "submit" && inGalleryUi) return true
      return false
    }

    const inputs: HTMLInputElement[] = []
    for (const root of roots) {
      for (const inp of root.querySelectorAll<HTMLInputElement>(
        "input.a-button-input[aria-setsize][aria-posinset]"
      )) {
        if (!isGalleryInput(inp)) continue
        inputs.push(inp)
      }
    }

    const bySetsize = new Map<string, HTMLInputElement[]>()
    for (const inp of inputs) {
      const ss = inp.getAttribute("aria-setsize")?.trim() ?? ""
      if (!ss) continue
      const n = parseInt(ss, 10)
      if (n < 2 || n > 16) continue
      const list = bySetsize.get(ss) ?? []
      list.push(inp)
      bySetsize.set(ss, list)
    }

    let best: { ss: string; list: HTMLInputElement[] } | null = null
    for (const [ss, list] of bySetsize) {
      const n = parseInt(ss, 10)
      const positions = new Set(
        list.map((el) => parseInt(el.getAttribute("aria-posinset") ?? "0", 10)).filter((p) => p >= 1)
      )
      if (positions.size < Math.min(n, 2)) continue
      if (!best || n > parseInt(best.ss, 10)) best = { ss, list }
    }

    if (!best) return null

    const n = parseInt(best.ss, 10)
    const byPos = new Map<number, HTMLInputElement>()
    for (const inp of best.list) {
      const p = parseInt(inp.getAttribute("aria-posinset") ?? "0", 10)
      if (p < 1) continue
      const prev = byPos.get(p)
      if (!prev) {
        byPos.set(p, inp)
        continue
      }
      const prevHidden = Boolean(prev.closest(".aok-hidden, [aria-hidden='true']"))
      const curHidden = Boolean(inp.closest(".aok-hidden, [aria-hidden='true']"))
      if (prevHidden && !curHidden) byPos.set(p, inp)
    }

    const uniquePos = [...byPos.keys()].sort((a, b) => a - b).slice(0, n)
    if (uniquePos.length < 2) return null

    return { setsize: best.ss, positions: uniquePos }
  })
}

async function clickGalleryRadioSlots(page: Page, absorb: (batch: string[]) => void) {
  const meta = await detectGalleryRadioGroup(page)
  if (!meta) return

  const stripScoped = await locatorFirstMatching(page, IMAGE_THUMB_STRIP_SELECTORS)

  for (const pos of meta.positions) {
    const radio = stripScoped
      ? stripScoped.locator(`input.a-button-input[aria-setsize="${meta.setsize}"][aria-posinset="${pos}"]`).first()
      : page.locator(
          `#altImages input.a-button-input[aria-setsize="${meta.setsize}"][aria-posinset="${pos}"], #imageBlock input.a-button-input[aria-setsize="${meta.setsize}"][aria-posinset="${pos}"], #leftCol input.a-button-input[aria-setsize="${meta.setsize}"][aria-posinset="${pos}"]`
        ).first()

    if ((await radio.count().catch(() => 0)) === 0) continue

    const inTwister = await radio
      .evaluate((el) =>
        Boolean(el.closest("#variation_color_name, #twister_feature_div, #variation_size_name"))
      )
      .catch(() => false)

    if (inTwister) continue

    await radio.scrollIntoViewIfNeeded().catch(() => undefined)
    await radio.click({ timeout: 4000, force: true }).catch(() => undefined)
    await sleep(450)
    absorb(await galleryImages(page))
  }
}

async function clickImmersiveThumbnails(page: Page, absorb: (batch: string[]) => void): Promise<boolean> {
  let thumbs = page.locator(".ivThumb, #ivThumbs .ivThumb")
  let count = await thumbs.count().catch(() => 0)

  if (count < 2) {
    const opener = page
      .locator(
        'ul[aria-label="Image thumbnails"] li.overlayRestOfImages, ul[aria-label="Image thumbnails"] li.imageThumbnail'
      )
      .last()

    if ((await opener.count().catch(() => 0)) > 0) {
      await opener.scrollIntoViewIfNeeded().catch(() => undefined)
      await opener.click({ timeout: 4000 }).catch(async () => {
        await opener.locator("input.a-button-input").first().click({ timeout: 4000, force: true }).catch(() => undefined)
      })
      await sleep(650)
      absorb(await immersiveThumbnailImages(page))
    }

    thumbs = page.locator(".ivThumb, #ivThumbs .ivThumb")
    count = await thumbs.count().catch(() => 0)
  }

  const limit = Math.min(Math.max(count, 0), 18)
  if (limit < 1) return false

  for (let i = 0; i < limit; i++) {
    const thumb = thumbs.nth(i)
    await thumb.scrollIntoViewIfNeeded().catch(() => undefined)
    await thumb.click({ timeout: 3500, force: true }).catch(() => undefined)
    await sleep(350)
    absorb(await immersiveThumbnailImages(page))
  }

  await page.keyboard.press("Escape").catch(() => undefined)
  return true
}

/** Prefer Amazon immersive thumbnails only; use older gallery surfaces only as fallback. */
async function galleryImagesExpanded(page: Page): Promise<string[]> {
  try {
    const radioImages = await imageThumbnailRadioImages(page)
    if (radioImages.length > 0) return radioImages

    const accum = new Set<string>()
    const absorb = (batch: string[]) => {
      for (const raw of batch) {
        const u = normalizeImageUrl(raw)
        if (looksLikeProductImage(u)) accum.add(u)
      }
    }

    absorb(await immersiveThumbnailImages(page))
    await clickImmersiveThumbnails(page, absorb)
    if (accum.size > 0) {
      return Array.from(accum).slice(0, MAX_IMAGES_PER_VARIANT)
    }

    const usedStrip = await clickPrimaryThumbnailStrip(page, absorb)

    if (!usedStrip) {
      await clickGalleryRadioSlots(page, absorb)
    }

    if (!usedStrip) {
      const thumbLocator = page.locator(
        [
          "#altImages li.imageThumbnail",
          "#altImages ul.regularImageGridLayout li.imageThumbnail",
          "#altImages .list-item-image-layout li",
          "#altImages .a-button-list li",
          "#altImages ul.imageThumbnailGridLayout li",
        ].join(", ")
      )
      const thumbCount = await thumbLocator.count().catch(() => 0)
      const limit = Math.min(Math.max(thumbCount, 0), 14)

      for (let i = 0; i < limit; i++) {
        const item = thumbLocator.nth(i)
        await item.scrollIntoViewIfNeeded().catch(() => undefined)
        await item.click({ timeout: 4000 }).catch(async () => {
          await item.locator("input.a-button-input").first().click({ timeout: 4000, force: true }).catch(() => undefined)
        })
        await sleep(450)
        absorb(await galleryImages(page))
      }
    }

    if (accum.size < 3) {
      await clickGalleryRadioSlots(page, absorb)
    }

    return Array.from(accum).slice(0, MAX_IMAGES_PER_VARIANT)
  } catch {
    return galleryImages(page).catch(() => [])
  }
}

function asinFromValue(value: string | null | undefined): string | undefined {
  const text = value?.trim()
  if (!text) return undefined
  const direct = text.match(/^[A-Z0-9]{10}$/i)?.[0]
  if (direct) return direct.toUpperCase()
  return text.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i)?.[1]?.toUpperCase()
}

async function colorOptions(page: Page): Promise<BrowserColorOption[]> {
  return page.evaluate(() => {
    const clean = (value: string | null | undefined) =>
      value
        ?.replace(/\s+/g, " ")
        .replace(/^click to select\s*/i, "")
        .replace(/^selected\s*/i, "")
        .replace(/^color\s*:\s*/i, "")
        .replace(/\$\d+(?:\.\d{2})?.*$/g, "")
        .trim()

    const inputs = Array.from(
      document.querySelectorAll<HTMLInputElement>(
        "#variation_color_name li[data-asin] input.a-button-input, #twister_feature_div li[data-asin] input.a-button-input, #variation_color_name input.a-button-input, #twister_feature_div input.a-button-input[aria-labelledby]"
      )
    )

    const options = inputs
      .map((input, index) => {
        if (input.closest(".aok-hidden, [aria-hidden='true']")) return null
        const labelId = input.getAttribute("aria-labelledby")
        const label = labelId ? document.getElementById(labelId)?.textContent : undefined
        const container = input.closest("[data-defaultasin], [data-asin], [data-dp-url], li, span, div")
        const img = container?.querySelector("img")
        const asinText =
          container?.getAttribute("data-defaultasin") ||
          container?.getAttribute("data-asin") ||
          container?.getAttribute("data-dp-url") ||
          container?.querySelector("a")?.getAttribute("href") ||
          input.closest("a")?.getAttribute("href") ||
          input.getAttribute("data-defaultasin") ||
          input.getAttribute("data-asin") ||
          undefined
        const name =
          clean(img?.getAttribute("alt")) ||
          clean(label) ||
          clean(input.getAttribute("aria-label")) ||
          clean(container?.getAttribute("title")) ||
          clean(container?.getAttribute("aria-label")) ||
          clean(container?.textContent)
        return name
          ? {
              checked: input.getAttribute("aria-checked") === "true" || input.checked,
              index,
              name,
            asinText,
            }
          : null
      })
      .filter((option): option is { checked: boolean; index: number; name: string; asinText: string | undefined } =>
        Boolean(option)
      )

    const byName = new Map<string, { checked: boolean; index: number; name: string; asinText: string | undefined }>()
    for (const option of options) {
      const key = option.name.toLowerCase()
      const existing = byName.get(key)
      if (!existing || option.checked || (!existing.checked && option.index < existing.index)) {
        byName.set(key, option)
      }
    }

    return Array.from(byName.values())
  }).then((options) =>
    options.map(({ asinText, ...option }) => ({
      ...option,
      asin: asinFromValue(asinText),
    }))
  )
}

async function clickColorOption(page: Page, option: BrowserColorOption) {
  const clickedByName = await page
    .evaluate((targetName) => {
      const clean = (value: string | null | undefined) =>
        value
          ?.replace(/\s+/g, " ")
          .replace(/^click to select\s*/i, "")
          .replace(/^selected\s*/i, "")
          .replace(/^color\s*:\s*/i, "")
          .replace(/\$\d+(?:\.\d{2})?.*$/g, "")
          .trim()
          .toLowerCase()

      const target = clean(targetName)
      if (!target) return false

      const inputs = Array.from(
        document.querySelectorAll<HTMLInputElement>(
          "#variation_color_name li[data-asin] input.a-button-input, #twister_feature_div li[data-asin] input.a-button-input, #variation_color_name input.a-button-input, #twister_feature_div input.a-button-input[aria-labelledby]"
        )
      )

      for (const input of inputs) {
        if (input.closest(".aok-hidden, [aria-hidden='true']")) continue
        const labelId = input.getAttribute("aria-labelledby")
        const label = labelId ? document.getElementById(labelId)?.textContent : undefined
        const container = input.closest("[data-defaultasin], [data-asin], [data-dp-url], li, span, div")
        const img = container?.querySelector("img")
        const name =
          clean(img?.getAttribute("alt")) ||
          clean(label) ||
          clean(input.getAttribute("aria-label")) ||
          clean(container?.getAttribute("title")) ||
          clean(container?.getAttribute("aria-label")) ||
          clean(container?.textContent)

        if (name === target) {
          input.click()
          return true
        }
      }

      return false
    }, option.name)
    .catch(() => false)

  if (!clickedByName) {
    const options = page.locator(
      "#variation_color_name li[data-asin] input.a-button-input, #twister_feature_div li[data-asin] input.a-button-input, #variation_color_name input.a-button-input, #twister_feature_div input.a-button-input[aria-labelledby]"
    )
    await options.nth(option.index).click({ timeout: 5000, force: true })
  }

  await page.waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(() => undefined)
  await sleep(1200)
}

async function selectedColorName(page: Page): Promise<string | undefined> {
  const name = await page
    .evaluate(() => {
      const clean = (value: string | null | undefined) =>
        value
          ?.replace(/\s+/g, " ")
          .replace(/^color\s*:\s*/i, "")
          .trim()

      return (
        clean(document.querySelector("#variation_color_name .selection")?.textContent) ||
        clean(document.querySelector("#variation_color_name .a-color-secondary")?.textContent) ||
        clean(document.querySelector("#inline-twister-expanded-dimension-text-color_name")?.textContent)
      )
    })
    .catch(() => undefined)

  return cleanVariantName(name) ?? name
}

function imageSignature(images: string[]): string {
  return images.join("|")
}

async function galleryImagesAfterChange(
  page: Page,
  previousImages: string[],
  expectedColorName?: string
): Promise<string[]> {
  const previous = imageSignature(previousImages)

  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (expectedColorName) {
      const selected = await selectedColorName(page)
      if (selected && cleanVariantName(selected)?.toLowerCase() !== cleanVariantName(expectedColorName)?.toLowerCase()) {
        await sleep(350)
        continue
      }
    }

    const images = await galleryImagesExpanded(page)
    if (!previous || (images.length > 0 && imageSignature(images) !== previous)) {
      return images
    }
    await sleep(350)
  }

  return galleryImagesExpanded(page)
}

export function isAmazonUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    return hostname === "amazon.com" || hostname.endsWith(".amazon.com")
  } catch {
    return false
  }
}

export async function scrapeAmazonVariantsWithBrowser(
  url: string
): Promise<AmazonBrowserScrapeResult> {
  let browser: Browser | null = null

  try {
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({
      viewport: { width: 1365, height: 900 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    })
    page.setDefaultTimeout(PAGE_TIMEOUT_MS)

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: PAGE_TIMEOUT_MS })
    await continueShoppingIfPresent(page)
    if (await isBlocked(page)) return { referenceImages: [], referenceImageVariants: [], blocked: true }

    try {
      await page.locator("#landingImage, #productTitle, #imgTagWrapperId").first().waitFor({
        state: "attached",
        timeout: 12000,
      })
    } catch {
      await sleep(800)
    }

    const initialImages = await galleryImagesExpanded(page)

    let rawColorOptions: BrowserColorOption[] = []
    try {
      rawColorOptions = await colorOptions(page)
    } catch {
      rawColorOptions = []
    }

    const options = rawColorOptions
      .map((option) => ({
        ...option,
        name: cleanVariantName(option.name) ?? option.name,
      }))
      .filter((option) => Number.isFinite(option.index) && option.name)
      .slice(0, MAX_VARIANTS)

    if (!options.length) {
      const colorName = (await selectedColorName(page)) ?? "Selected color"
      return initialImages.length
        ? {
            referenceImages: initialImages,
            referenceImageVariants: [{ name: colorName, images: initialImages }],
          }
        : { referenceImages: initialImages, referenceImageVariants: [] }
    }

    const referenceImageVariants: BrowserReferenceImageVariant[] = []
    let previousImages = initialImages

    for (const option of options) {
      const beforeImages = option.checked ? initialImages : []
      if (!option.checked) {
        try {
          await clickColorOption(page, option)
        } catch {
          referenceImageVariants.push({ name: option.name, images: beforeImages.length ? beforeImages : initialImages })
          continue
        }
      }

      if (await isBlocked(page)) return { referenceImages: initialImages, referenceImageVariants, blocked: true }
      let images = beforeImages
      try {
        const expanded = option.checked ? initialImages : await galleryImagesAfterChange(page, previousImages, option.name)
        if (expanded.length) images = expanded
      } catch {
        /* keep initialImages */
      }
      previousImages = images.length ? images : previousImages
      referenceImageVariants.push({
        name: option.name,
        images: images.length ? images : beforeImages,
      })
    }

    const allVariantImages = referenceImageVariants.flatMap((variant) => variant.images)

    return {
      referenceImages: unique(allVariantImages).slice(0, MAX_IMAGES_PER_VARIANT * MAX_VARIANTS),
      referenceImageVariants,
    }
  } finally {
    await browser?.close().catch(() => undefined)
  }
}

export async function scrapeAmazonGalleryWithBrowser(url: string): Promise<AmazonBrowserGalleryResult> {
  let browser: Browser | null = null

  try {
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({
      viewport: { width: 1365, height: 900 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    })
    page.setDefaultTimeout(PAGE_TIMEOUT_MS)

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: PAGE_TIMEOUT_MS })
    await continueShoppingIfPresent(page)
    if (await isBlocked(page)) return { images: [], blocked: true }

    return { images: await galleryImagesExpanded(page) }
  } finally {
    await browser?.close().catch(() => undefined)
  }
}
