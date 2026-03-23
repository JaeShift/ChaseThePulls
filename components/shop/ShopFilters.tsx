"use client"

import { ShopSubcategoryTabs } from "./ShopSubcategoryTabs"
import { ShopTcgFormatTabs } from "./ShopTcgFormatTabs"

/** Sub-type tabs when a game is selected (search lives above this on the shop page). */
export function ShopFilters() {
  return (
    <div className="flex flex-col items-center gap-0 mb-8 w-full">
      <ShopSubcategoryTabs />
      <ShopTcgFormatTabs />
    </div>
  )
}
