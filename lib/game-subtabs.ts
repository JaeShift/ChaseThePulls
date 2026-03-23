import type { ProductGame, ProductSubcategory } from "@/types"

/** Sub-tab labels per game (filter values are shared enums). */
export const SUBTABS_BY_GAME: Record<
  ProductGame,
  { value: ProductSubcategory; label: string }[]
> = {
  POKEMON: [
    { value: "TRADING_CARD_GAME", label: "Trading Card Game" },
    { value: "PLUSH", label: "Plush" },
    { value: "FUNKO", label: "Funkos" },
    { value: "MISCELLANEOUS", label: "Miscellaneous" },
  ],
  ONE_PIECE: [
    { value: "TRADING_CARD_GAME", label: "Trading Card Game" },
    { value: "PLUSH", label: "Plush" },
    { value: "FUNKO", label: "Funkos" },
    { value: "MISCELLANEOUS", label: "Miscellaneous" },
  ],
  MAGIC_THE_GATHERING: [
    { value: "TRADING_CARD_GAME", label: "Trading Card Game" },
    { value: "PLUSH", label: "Plush" },
    { value: "FUNKO", label: "Funkos" },
    { value: "MISCELLANEOUS", label: "Miscellaneous" },
  ],
  YUGIOH: [
    { value: "TRADING_CARD_GAME", label: "Trading Card Game" },
    { value: "PLUSH", label: "Plush" },
    { value: "FUNKO", label: "Funkos" },
    { value: "MISCELLANEOUS", label: "Miscellaneous" },
  ],
}

export function subtabLabel(game: ProductGame, value: ProductSubcategory): string {
  const row = SUBTABS_BY_GAME[game]?.find((t) => t.value === value)
  if (row) return row.label
  return SUBCATEGORY_FALLBACK_LABELS[value]
}

const SUBCATEGORY_FALLBACK_LABELS: Record<ProductSubcategory, string> = {
  TRADING_CARD_GAME: "Trading Card Game",
  PLUSH: "Plush",
  FUNKO: "Funkos",
  MISCELLANEOUS: "Miscellaneous",
}

export const ALL_SUBCATEGORIES: ProductSubcategory[] = [
  "TRADING_CARD_GAME",
  "PLUSH",
  "FUNKO",
  "MISCELLANEOUS",
]
