import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { draftProductSchema } from "@/lib/validations"
import { exportDraftProductToLocalFolder } from "@/lib/product-draft-export"
import { z } from "zod"

async function requireAdmin() {
  const session = await auth()
  return !!session?.user && session.user.role === "ADMIN"
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const draft = await prisma.draftProduct.findUnique({ where: { id } })
    if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ draft })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const data = draftProductSchema.parse(await req.json())
    const exportResult = await exportDraftProductToLocalFolder(data)

    const draft = await prisma.draftProduct.update({
      where: { id },
      data: {
        name: data.name?.trim() || null,
        slug: data.slug?.trim() || null,
        description: data.description?.trim() || null,
        details: data.details?.trim() || null,
        price: data.price ?? null,
        comparePrice: data.comparePrice ?? null,
        images: data.images,
        sourceUrl: data.sourceUrl?.trim() || null,
        referenceImages: data.referenceImages,
        referenceImageVariants: data.referenceImageVariants,
        category: data.category as never,
        game: data.game,
        subcategory: data.subcategory as never,
        stock: data.stock ?? null,
        featured: data.featured,
        set: data.set?.trim() || null,
        localFolderPath: exportResult.folderPath,
      },
    })

    return NextResponse.json({ draft, export: exportResult })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await prisma.draftProduct.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
