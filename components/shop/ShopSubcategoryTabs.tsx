"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { GAME_COLORS, type ProductGame } from "@/types"
import { SUBTABS_BY_GAME } from "@/lib/game-subtabs"

const VALID_GAMES: ProductGame[] = ["MAGIC_THE_GATHERING", "POKEMON", "ONE_PIECE", "YUGIOH"]

export function ShopSubcategoryTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const game = searchParams.get("game")
  const activeSub = searchParams.get("subcategory")

  if (!game || !VALID_GAMES.includes(game as ProductGame)) {
    return null
  }

  const g = game as ProductGame
  const subtabs = SUBTABS_BY_GAME[g]
  const accent = GAME_COLORS[g]

  const push = (params: URLSearchParams) => {
    params.delete("page")
    router.push(`/shop?${params.toString()}`)
  }

  const setSubcategory = (value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set("subcategory", value)
    else params.delete("subcategory")
    if (value !== "TRADING_CARD_GAME") {
      params.delete("category")
      params.delete("tcg")
    }
    push(params)
  }

  return (
    <div className="w-full border-b border-surface-border bg-surface/80">
      <nav
        className="flex flex-wrap justify-center gap-1 sm:gap-2 px-4 py-0 overflow-x-auto overscroll-x-contain scrollbar-hide sm:overflow-visible"
        aria-label="Browse by product type"
      >
      <button
        type="button"
        onClick={() => setSubcategory(null)}
        className={`shrink-0 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors border-b-2 -mb-px ${
          !activeSub
            ? "text-foreground border-foreground/30"
            : "text-foreground/40 border-transparent hover:text-foreground/65"
        }`}
      >
        All
      </button>
      {subtabs.map(({ value, label }) => {
        const isActive = activeSub === value
        return (
          <button
            key={value}
            type="button"
            onClick={() => setSubcategory(value)}
            className={`shrink-0 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors border-b-2 -mb-px ${
              isActive ? "" : "text-foreground/40 border-transparent hover:text-foreground/65"
            }`}
            style={
              isActive
                ? { color: accent, borderBottomColor: accent }
                : undefined
            }
          >
            {label}
          </button>
        )
      })}
      </nav>
    </div>
  )
}
