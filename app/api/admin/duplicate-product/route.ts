import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { productId } = await req.json()
    if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 })

    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })

    const baseName = product.name ? `${product.name} (Copy)` : "Untitled Copy"
    const baseSlug = product.slug ? `${product.slug}-copy` : `copy-${Date.now()}`

    // Ensure slug is unique among drafts
    let slug = baseSlug
    let attempt = 1
    while (await prisma.draftProduct.findFirst({ where: { slug } })) {
      slug = `${baseSlug}-${++attempt}`
    }

    const draft = await prisma.draftProduct.create({
      data: {
        name: baseName,
        slug,
        description: product.description ?? null,
        details: product.details ?? null,
        price: product.price,
        comparePrice: product.comparePrice ?? null,
        images: product.images,
        sourceUrl: product.sourceUrl ?? null,
        referenceImages: product.referenceImages ?? [],
        referenceImageVariants: [],
        category: product.category,
        game: product.game,
        subcategory: product.subcategory,
        stock: product.stock,
        featured: product.featured,
        set: product.set ?? null,
        localFolderPath: null,
      },
    })

    return NextResponse.json({ draft })
  } catch (err) {
    console.error("[duplicate-product]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
