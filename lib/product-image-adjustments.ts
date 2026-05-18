const ZOOM_PARAM = "ctp_zoom"

export const PRODUCT_IMAGE_ZOOM_DEFAULT = 1
export const PRODUCT_IMAGE_ZOOM_MIN = 0.5
export const PRODUCT_IMAGE_ZOOM_MAX = 3.0
export const PRODUCT_IMAGE_ZOOM_STEP = 0.1

export function getProductImageZoom(src: string): number {
  try {
    const parsed = new URL(src, "https://chase-the-pulls.local")
    const raw = parsed.searchParams.get(ZOOM_PARAM)

    // null means the param is absent — treat as default, not 0
    if (raw === null) return PRODUCT_IMAGE_ZOOM_DEFAULT

    const zoom = Number(raw)
    if (!Number.isFinite(zoom) || zoom === 0) return PRODUCT_IMAGE_ZOOM_DEFAULT

    return Math.min(PRODUCT_IMAGE_ZOOM_MAX, Math.max(PRODUCT_IMAGE_ZOOM_MIN, zoom))
  } catch {
    return PRODUCT_IMAGE_ZOOM_DEFAULT
  }
}

export function setProductImageZoom(src: string, zoom: number): string {
  try {
    const parsed = new URL(src, "https://chase-the-pulls.local")
    const clamped = Math.min(PRODUCT_IMAGE_ZOOM_MAX, Math.max(PRODUCT_IMAGE_ZOOM_MIN, zoom))

    if (Math.abs(clamped - PRODUCT_IMAGE_ZOOM_DEFAULT) < 0.01) {
      parsed.searchParams.delete(ZOOM_PARAM)
    } else {
      parsed.searchParams.set(ZOOM_PARAM, clamped.toFixed(1))
    }

    if (/^https?:\/\//i.test(src)) return parsed.toString()
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return src
  }
}

export function updateProductImageZoom(src: string, direction: 1 | -1): string {
  try {
    const parsed = new URL(src, "https://chase-the-pulls.local")
    const currentZoom = getProductImageZoom(src)
    const nextZoom = Math.min(
      PRODUCT_IMAGE_ZOOM_MAX,
      Math.max(PRODUCT_IMAGE_ZOOM_MIN, currentZoom + direction * PRODUCT_IMAGE_ZOOM_STEP)
    )

    if (Math.abs(nextZoom - PRODUCT_IMAGE_ZOOM_DEFAULT) < 0.01) {
      parsed.searchParams.delete(ZOOM_PARAM)
    } else {
      parsed.searchParams.set(ZOOM_PARAM, nextZoom.toFixed(1))
    }

    if (/^https?:\/\//i.test(src)) {
      return parsed.toString()
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return src
  }
}
