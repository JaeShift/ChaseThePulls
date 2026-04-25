export const dynamic = "force-dynamic"

import { Suspense } from "react"
import type { Metadata } from "next"
import { ProductCard } from "@/components/shop/ProductCard"
import { ShopFilters } from "@/components/shop/ShopFilters"
import { StaggerContainer, StaggerItem } from "@/components/animations/ScrollReveal"
import { Skeleton } from "@/components/ui/skeleton"
import { prisma } from "@/lib/prisma"
import { isTcgTabSlug, TCG_TAB_CATEGORY_GROUPS } from "@/lib/tcg-shop-tabs"
import type { ProductCategory, ProductGame, ProductSubcategory } from "@/types"
import { CATEGORY_LABELS, GAME_LABELS, isProductCategory } from "@/types"
import { Search } from "lucide-react"
import { ShopSearchBar } from "@/components/shop/ShopSearchBar"

const PRODUCT_GAMES: ProductGame[] = ["MAGIC_THE_GATHERING", "POKEMON", "ONE_PIECE", "YUGIOH"]
const PRODUCT_SUBCATEGORIES: ProductSubcategory[] = [
  "TRADING_CARD_GAME",
  "PLUSH",
  "CLOTHING",
  "FUNKO",
]

const SUBCATEGORY_SHOP_HEADINGS: Record<ProductSubcategory, string> = {
  TRADING_CARD_GAME: "Trading card games",
  PLUSH: "Plush & soft goods",
  CLOTHING: "Clothing",
  FUNKO: "Funko & vinyl",
}

export const metadata: Metadata = {
  title: "Shop Trading Card Products",
  description:
    "Browse sealed TCG products: Pokémon, Magic: The Gathering, Yu-Gi-Oh!, One Piece, Lorcana, Gundam, and more. Booster packs, collector boxes, blisters, bundles, premium and special collections.",
  openGraph: {
    title: "Shop | Chase The Pulls",
    description:
      "Find your next great pull. Sealed trading card products across your favorite games at Chase The Pulls.",
    type: "website",
  },
}

interface ShopPageProps {
  searchParams: Promise<{
    category?: string
    game?: string
    subcategory?: string
    tcg?: string
    sort?: string
    search?: string
    page?: string
  }>
}

function shopHeading(params: { game?: string; category?: string; subcategory?: string }) {
  if (params.game && params.game in GAME_LABELS) {
    return GAME_LABELS[params.game as ProductGame]
  }
  if (params.category && isProductCategory(params.category)) {
    return CATEGORY_LABELS[params.category]
  }
  if (
    params.subcategory &&
    PRODUCT_SUBCATEGORIES.includes(params.subcategory as ProductSubcategory)
  ) {
    return SUBCATEGORY_SHOP_HEADINGS[params.subcategory as ProductSubcategory]
  }
  if (params.category) {
    return params.category.replace(/_/g, " ")
  }
  return "All Products"
}

async function getProducts(params: {
  category?: string
  game?: string
  subcategory?: string
  tcg?: string
  sort?: string
  search?: string
  page?: string
}) {
  const { category, game, subcategory, tcg, sort, search, page } = params
  const pageNum = parseInt(page ?? "1")
  const perPage = 24

  const onTcgSection =
    subcategory === "TRADING_CARD_GAME" &&
    !!game &&
    PRODUCT_GAMES.includes(game as ProductGame) &&
    PRODUCT_SUBCATEGORIES.includes(subcategory as ProductSubcategory)

  let categoryFilter: { category: ProductCategory } | { category: { in: ProductCategory[] } } | object =
    {}

  if (onTcgSection) {
    if (isTcgTabSlug(tcg)) {
      categoryFilter = { category: { in: [...TCG_TAB_CATEGORY_GROUPS[tcg]] } }
    } else if (category && isProductCategory(category)) {
      categoryFilter = { category: category as ProductCategory }
    }
  } else if (category && isProductCategory(category)) {
    categoryFilter = { category: category as ProductCategory }
  }

  const where = {
    ...(game && PRODUCT_GAMES.includes(game as ProductGame) && { game: game as ProductGame }),
    ...(subcategory &&
      PRODUCT_SUBCATEGORIES.includes(subcategory as ProductSubcategory) && {
        subcategory: subcategory as ProductSubcategory,
      }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
        { details: { contains: search, mode: "insensitive" as const } },
        { set: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...categoryFilter,
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
        // Prisma client types lag until `npx prisma generate` after enum migration
        where: where as never,
        orderBy,
        skip: (pageNum - 1) * perPage,
        take: perPage,
      }),
      prisma.product.count({ where: where as never }),
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
      <div className="flex justify-center mb-6">
        <p className="text-foreground/50 text-sm text-center">
          {total} {total === 1 ? "product" : "products"} found
        </p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-24">
          <Search className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No products found</h3>
          <p className="text-foreground/50">Try adjusting your filters or search term</p>
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
                if (searchParams.game) p.set("game", searchParams.game)
                if (searchParams.subcategory) p.set("subcategory", searchParams.subcategory)
                if (searchParams.tcg) p.set("tcg", searchParams.tcg)
                if (searchParams.sort) p.set("sort", searchParams.sort)
                if (searchParams.search) p.set("search", searchParams.search)
                p.set("page", pageNum.toString())
                return (
                  <a
                    key={pageNum}
                    href={`/shop?${p.toString()}`}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-200 border ${
                      page === pageNum
                        ? "bg-accent text-white border-accent"
                        : "border-surface-border text-foreground/60 hover:border-accent/50 hover:text-accent"
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
    <div className="min-h-screen pb-16 pt-32 sm:pt-36">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page title */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-2">
            {shopHeading(params)}
          </h1>
          <p className="text-foreground/50 mb-8">Chase your next great pull</p>
        </div>

        <Suspense>
          <div className="mb-8 w-full">
            <ShopSearchBar />
          </div>
        </Suspense>

        {/* Sub-type tabs when a game is selected */}
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
