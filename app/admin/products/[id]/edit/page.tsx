export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ProductForm } from "@/components/admin/ProductForm"

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params
  let product: Awaited<ReturnType<typeof prisma.product.findUnique<{ where: { id: string } }>>> = null
  try {
    product = await prisma.product.findUnique({ where: { id } })
  } catch {
    // DB unavailable
  }
  if (!product) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-4xl text-foreground mb-1">Edit Product</h1>
        <p className="text-foreground/50 truncate">{product.name}</p>
      </div>
      <ProductForm product={product as any} mode="edit" />
    </div>
  )
}
