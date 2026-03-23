import type { ProductCategory } from "@/types"

/** URL query for unified TCG product filter row (all games). */
export const TCG_TAB_QUERY = "tcg"

export const TCG_PRODUCT_TABS = [
  { slug: "booster-packs", label: "Booster Packs" },
  { slug: "booster-boxes", label: "Booster Boxes" },
  { slug: "starter-decks", label: "Starter / Structure Decks" },
  { slug: "collection-boxes", label: "Collection Boxes" },
  { slug: "accessories", label: "Accessories" },
] as const

export type TcgTabSlug = (typeof TCG_PRODUCT_TABS)[number]["slug"]

/** Maps shop tab → product categories (includes legacy enums where relevant). */
export const TCG_TAB_CATEGORY_GROUPS: Record<TcgTabSlug, readonly ProductCategory[]> = {
  "booster-packs": ["BOOSTER_PACK"],
  "booster-boxes": ["BOOSTER_BOX", "BOOSTER_BUNDLE"],
  "starter-decks": ["STARTER_STRUCTURE_DECK"],
  "collection-boxes": ["COLLECTION_BOX", "ETB", "UPC", "SPC", "TIN", "BOXED_SET"],
  "accessories": ["ACCESSORIES"],
}

export function isTcgTabSlug(s: string | null | undefined): s is TcgTabSlug {
  return !!s && TCG_PRODUCT_TABS.some((t) => t.slug === s)
}
