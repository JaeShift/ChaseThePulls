import type { ProductGame, ProductSubcategory } from "@/types"

/** Sub-tab labels per game (filter values are shared enums). */
export const SUBTABS_BY_GAME: Record<
  ProductGame,
  { value: ProductSubcategory; label: string }[]
> = {
  POKEMON: [
    { value: "TRADING_CARD_GAME", label: "Trading Card Game" },
    { value: "PLUSH", label: "Plush" },
    { value: "CLOTHING", label: "Clothing" },
    { value: "FUNKO", label: "Funkos" },
  ],
  ONE_PIECE: [
    { value: "TRADING_CARD_GAME", label: "Trading Card Game" },
    { value: "PLUSH", label: "Plush" },
    { value: "CLOTHING", label: "Clothing" },
    { value: "FUNKO", label: "Funkos" },
  ],
  MAGIC_THE_GATHERING: [
    { value: "TRADING_CARD_GAME", label: "Trading Card Game" },
    { value: "PLUSH", label: "Plush" },
    { value: "CLOTHING", label: "Clothing" },
    { value: "FUNKO", label: "Funkos" },
  ],
  YUGIOH: [
    { value: "TRADING_CARD_GAME", label: "Trading Card Game" },
    { value: "PLUSH", label: "Plush" },
    { value: "CLOTHING", label: "Clothing" },
    { value: "FUNKO", label: "Funkos" },
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
  CLOTHING: "Clothing",
}

export const ALL_SUBCATEGORIES: ProductSubcategory[] = [
  "TRADING_CARD_GAME",
  "PLUSH",
  "CLOTHING",
  "FUNKO",
]
