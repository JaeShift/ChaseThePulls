"use client"

import { useRouter, useSearchParams } from "next/navigation"
import type { ProductGame } from "@/types"
import {
  TCG_TAB_QUERY,
  TCG_PRODUCT_TABS,
  isTcgTabSlug,
} from "@/lib/tcg-shop-tabs"

const VALID_GAMES: ProductGame[] = ["MAGIC_THE_GATHERING", "POKEMON", "ONE_PIECE", "YUGIOH"]

/** Unified TCG “Filter by Product” chips when subcategory = Trading Card Game (all franchises). */
export function ShopTcgFormatTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const game = searchParams.get("game")
  const sub = searchParams.get("subcategory")
  const activeTcg = searchParams.get(TCG_TAB_QUERY)

  if (!game || !VALID_GAMES.includes(game as ProductGame) || sub !== "TRADING_CARD_GAME") {
    return null
  }

  const allActive = !activeTcg || !isTcgTabSlug(activeTcg)
  const hasProductFilter = isTcgTabSlug(activeTcg)

  const push = (params: URLSearchParams) => {
    params.delete("page")
    router.push(`/shop?${params.toString()}`)
  }

  const setTcg = (slug: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("category")
    if (slug && isTcgTabSlug(slug)) {
      params.set(TCG_TAB_QUERY, slug)
    } else {
      params.delete(TCG_TAB_QUERY)
    }
    push(params)
  }

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(TCG_TAB_QUERY)
    params.delete("category")
    push(params)
  }

  const chipBase =
    "shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors sm:px-3 sm:py-1 sm:text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background"

  return (
    <div className="w-full border-t border-surface-border/50 bg-surface2/50 px-3 py-2 sm:px-4">
      <div className="mx-auto flex max-w-6xl items-center gap-2">
        <span className="shrink-0 whitespace-nowrap text-[10px] font-medium uppercase tracking-wider text-foreground/32">
          Filter by Product
        </span>

        <div className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain scrollbar-hide">
          <div className="flex flex-nowrap items-center gap-1.5 py-0.5" role="group" aria-label="Filter by product">
            <button
              type="button"
              aria-pressed={allActive}
              onClick={() => setTcg(null)}
              className={`${chipBase} ${
                allActive
                  ? "border-foreground/12 bg-foreground/[0.04] text-foreground/85"
                  : "border-foreground/8 bg-transparent text-foreground/40 hover:border-foreground/15 hover:text-foreground/60"
              }`}
            >
              All
            </button>
            {TCG_PRODUCT_TABS.map(({ slug, label }) => {
              const isActive = activeTcg === slug
              return (
                <button
                  key={slug}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setTcg(slug)}
                  className={`${chipBase} ${
                    isActive
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-foreground/8 bg-transparent text-foreground/40 hover:border-foreground/15 hover:text-foreground/60"
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {hasProductFilter && (
          <button
            type="button"
            onClick={clearFilters}
            className="shrink-0 text-[10px] font-medium text-foreground/35 underline-offset-2 transition-colors hover:text-foreground/60 sm:text-xs"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}
