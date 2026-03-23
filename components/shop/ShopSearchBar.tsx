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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
        <input
          value={search}
          onChange={handleSearchChange}
          placeholder="Search products..."
          className="pl-9 pr-8 h-10 w-full rounded-lg border border-surface-border bg-surface text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
        />
        {search && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <SlidersHorizontal className="w-4 h-4 text-white/40 flex-shrink-0" />
        <select
          defaultValue={searchParams.get("sort") ?? "newest"}
          onChange={handleSortChange}
          className="h-10 flex-1 sm:flex-none rounded-lg border border-surface-border bg-surface text-sm text-white px-3 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 cursor-pointer"
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
