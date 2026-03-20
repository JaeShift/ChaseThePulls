export const dynamic = "force-dynamic"

import { Suspense } from "react"
import type { Metadata } from "next"
import { ProductCard } from "@/components/shop/ProductCard"
import { ShopFilters } from "@/components/shop/ShopFilters"
import { StaggerContainer, StaggerItem } from "@/components/animations/ScrollReveal"
import { Skeleton } from "@/components/ui/skeleton"
import { prisma } from "@/lib/prisma"
import type { ProductCategory } from "@/types"
import { Search } from "lucide-react"

export const metadata: Metadata = {
  title: "Shop Pokémon TCG Products",
  description:
    "Browse our full selection of sealed Pokémon TCG products. Shop Booster Packs, Elite Trainer Boxes, Blisters, Booster Bundles, Ultra Premium Collections, and Special Collections.",
  openGraph: {
    title: "Shop | Chase The Pulls",
    description: "Find your next great pull. Browse Pokémon TCG sealed products at Chase The Pulls.",
    type: "website",
  },
}

interface ShopPageProps {
  searchParams: Promise<{
    category?: string
    sort?: string
    search?: string
    page?: string
  }>
}

async function getProducts(params: {
  category?: string
  sort?: string
  search?: string
  page?: string
}) {
  const { category, sort, search, page } = params
  const pageNum = parseInt(page ?? "1")
  const perPage = 24

  const where = {
    ...(category && { category: category as ProductCategory }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
        { set: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  }

  const orderBy =
    sort === "price-asc"
      ? { price: "asc" as const }
      : sort === "price-desc"
      ? { price: "desc" as const }
      : sort === "oldest"
      ? { createdAt: "asc" as const }
      : { createdAt: "desc" as const }

  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (pageNum - 1) * perPage,
        take: perPage,
      }),
      prisma.product.count({ where }),
    ])
    return { products, total, pages: Math.ceil(total / perPage), page: pageNum }
  } catch {
    return { products: [], total: 0, pages: 0, page: pageNum }
  }
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-surface-border overflow-hidden">
          <Skeleton className="aspect-[3/4] w-full" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

async function ShopContent({
  searchParams,
}: {
  searchParams: Awaited<ShopPageProps["searchParams"]>
}) {
  const { products, total, pages, page } = await getProducts(searchParams)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-white/50 text-sm">
          {total} {total === 1 ? "product" : "products"} found
        </p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-24">
          <Search className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No products found</h3>
          <p className="text-white/50">Try adjusting your filters or search term</p>
        </div>
      ) : (
        <>
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <StaggerItem key={product.id}>
                <ProductCard product={product as any} />
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-12">
              {Array.from({ length: pages }).map((_, i) => {
                const pageNum = i + 1
                const p = new URLSearchParams()
                if (searchParams.category) p.set("category", searchParams.category)
                if (searchParams.sort) p.set("sort", searchParams.sort)
                if (searchParams.search) p.set("search", searchParams.search)
                p.set("page", pageNum.toString())
                return (
                  <a
                    key={pageNum}
                    href={`/shop?${p.toString()}`}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-200 border ${
                      page === pageNum
                        ? "bg-gold text-background border-gold"
                        : "border-surface-border text-white/60 hover:border-gold/50 hover:text-gold"
                    }`}
                  >
                    {pageNum}
                  </a>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-display font-bold text-4xl md:text-5xl text-white mb-2">
            {params.category
              ? params.category.replace(/_/g, " ")
              : "All Products"}
          </h1>
          <p className="text-white/50">Chase your next great pull</p>
        </div>

        {/* Filters bar */}
        <Suspense>
          <ShopFilters />
        </Suspense>

        {/* Products */}
        <Suspense fallback={<ProductGridSkeleton />}>
          <ShopContent searchParams={params} />
        </Suspense>
      </div>
    </div>
  )
}
