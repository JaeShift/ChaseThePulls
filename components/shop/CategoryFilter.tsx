"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { CATEGORY_LABELS, CATEGORY_COLORS, type ProductCategory } from "@/types"

const CATEGORIES: ProductCategory[] = ["BOOSTER_PACK", "ETB", "BLISTER", "BOOSTER_BUNDLE", "UPC", "SPC"]

export function CategoryFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get("category")

  const handleFilter = (category: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (category) {
      params.set("category", category)
    } else {
      params.delete("category")
    }
    params.delete("page")
    router.push(`/shop?${params.toString()}`)
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <button
        onClick={() => handleFilter(null)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
          !activeCategory
            ? "bg-gold text-background border-gold shadow-lg shadow-gold/20"
            : "bg-surface border-surface-border text-white/60 hover:border-gold/50 hover:text-gold"
        }`}
      >
        All Products
      </button>
      {CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat
        const color = CATEGORY_COLORS[cat]
        return (
          <button
            key={cat}
            onClick={() => handleFilter(cat)}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border"
            style={
              isActive
                ? { backgroundColor: color, color: "#080C14", borderColor: color, boxShadow: `0 4px 15px ${color}30` }
                : { backgroundColor: "transparent", color: `${color}90`, borderColor: `${color}30` }
            }
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = `${color}80`
                e.currentTarget.style.color = color
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = `${color}30`
                e.currentTarget.style.color = `${color}90`
              }
            }}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        )
      })}
    </div>
  )
}

