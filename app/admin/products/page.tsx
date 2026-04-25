export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import { formatPrice } from "@/lib/utils"
import { Plus, Pencil, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CATEGORY_LABELS, CATEGORY_COLORS, GAME_LABELS, GAME_COLORS } from "@/types"
import { DeleteProductButton } from "@/components/admin/DeleteProductButton"

export default async function AdminProductsPage() {
  let products: Awaited<ReturnType<typeof prisma.product.findMany>> = []
  try {
    products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } })
  } catch {
    // DB unavailable
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-4xl text-foreground mb-1">Products</h1>
          <p className="text-foreground/50">{products.length} products total</p>
        </div>
        <Button variant="glow" asChild>
          <Link href="/admin/products/new">
            <Plus className="w-4 h-4 mr-1" /> Add Product
          </Link>
        </Button>
      </div>

      <div className="rounded-2xl border border-surface-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left p-4 text-sm font-medium text-foreground/50">Product</th>
                <th className="text-left p-4 text-sm font-medium text-foreground/50">Game</th>
                <th className="text-left p-4 text-sm font-medium text-foreground/50">Type</th>
                <th className="text-right p-4 text-sm font-medium text-foreground/50">Price</th>
                <th className="text-right p-4 text-sm font-medium text-foreground/50">Stock</th>
                <th className="text-right p-4 text-sm font-medium text-foreground/50">Featured</th>
                <th className="text-right p-4 text-sm font-medium text-foreground/50">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <Package className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
                    <p className="text-foreground/40">No products yet</p>
                    <Button variant="glow" size="sm" className="mt-4" asChild>
                      <Link href="/admin/products/new">Add your first product</Link>
                    </Button>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const typeColor = CATEGORY_COLORS[product.category as keyof typeof CATEGORY_COLORS]
                  const gameColor = GAME_COLORS[product.game as keyof typeof GAME_COLORS]
                  return (
                    <tr key={product.id} className="border-b border-surface-border hover:bg-surface2/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-12 rounded-lg bg-surface2 border border-surface-border overflow-hidden flex-shrink-0">
                            {product.images[0] ? (
                              <Image src={product.images[0]} alt="" width={40} height={48} className="object-cover w-full h-full" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-4 h-4 text-foreground/20" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground line-clamp-1">{product.name}</p>
                            {product.set && <p className="text-xs text-foreground/40">{product.set}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            color: gameColor,
                            background: `${gameColor}18`,
                            border: `1px solid ${gameColor}35`,
                          }}
                        >
                          {GAME_LABELS[product.game as keyof typeof GAME_LABELS]}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: typeColor, background: `${typeColor}15`, border: `1px solid ${typeColor}30` }}>
                          {CATEGORY_LABELS[product.category as keyof typeof CATEGORY_LABELS]}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm font-semibold text-accent">{formatPrice(product.price)}</span>
                        {product.comparePrice && (
                          <span className="block text-xs text-foreground/40 line-through">{formatPrice(product.comparePrice)}</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <span className={`text-sm font-medium ${product.stock === 0 ? "text-electric-red" : product.stock <= 5 ? "text-yellow-400" : "text-electric-green"}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {product.featured ? (
                          <Badge variant="default">Yes</Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/admin/products/${product.id}/edit`}>
                              <Pencil className="w-4 h-4" />
                            </Link>
                          </Button>
                          <DeleteProductButton productId={product.id} productName={product.name} />
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
