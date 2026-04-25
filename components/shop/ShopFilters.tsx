"use client"

import { useSearchParams } from "next/navigation"
import { ShopSubcategoryTabs } from "./ShopSubcategoryTabs"
import { ShopTcgFormatTabs } from "./ShopTcgFormatTabs"
import { cn } from "@/lib/utils"
import type { ProductGame } from "@/types"

const VALID_GAMES: ProductGame[] = ["MAGIC_THE_GATHERING", "POKEMON", "ONE_PIECE", "YUGIOH"]

/** Sub-type tabs when a game is selected (search lives above this on the shop page). */
export function ShopFilters() {
  const searchParams = useSearchParams()
  const game = searchParams.get("game")
  const hasGameTabs = !!game && VALID_GAMES.includes(game as ProductGame)

  return (
    <div
      className={cn(
        "mb-8 flex w-full flex-col items-center gap-0",
        hasGameTabs &&
          "sticky top-[5.75rem] z-30 bg-background/95 py-1 backdrop-blur-sm supports-[backdrop-filter]:bg-background/85",
      )}
    >
      <ShopSubcategoryTabs />
      <ShopTcgFormatTabs />
    </div>
  )
}
