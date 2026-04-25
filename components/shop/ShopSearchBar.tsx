"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { SlidersHorizontal, Search, X } from "lucide-react"
import { useState, useRef } from "react"

export function ShopSearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", e.target.value)
    params.delete("page")
    router.push(`/shop?${params.toString()}`)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearch(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (val) params.set("search", val)
      else params.delete("search")
      params.delete("page")
      router.push(`/shop?${params.toString()}`)
    }, 400)
  }

  const clearSearch = () => {
    setSearch("")
    const params = new URLSearchParams(searchParams.toString())
    params.delete("search")
    params.delete("page")
    router.push(`/shop?${params.toString()}`)
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-2xl mx-auto w-full">
      <div className="relative flex-1 sm:min-w-0 sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 pointer-events-none" />
        <input
          value={search}
          onChange={handleSearchChange}
          placeholder="Search products..."
          className="pl-9 pr-8 h-10 w-full rounded-lg border border-surface-border bg-surface text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
        />
        {search && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <SlidersHorizontal className="w-4 h-4 text-foreground/40 flex-shrink-0" />
        <select
          defaultValue={searchParams.get("sort") ?? "newest"}
          onChange={handleSortChange}
          className="h-10 flex-1 sm:flex-none rounded-lg border border-surface-border bg-surface text-sm text-foreground px-3 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 cursor-pointer"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>
    </div>
  )
}
