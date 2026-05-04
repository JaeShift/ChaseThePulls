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

function normalizedText(value: string | null | undefined) {
  return value?.trim() || null
}

async function findDuplicateDraft(data: z.infer<typeof draftProductSchema>) {
  const sourceUrl = normalizedText(data.sourceUrl)
  const slug = normalizedText(data.slug)
  const name = normalizedText(data.name)

  if (sourceUrl) {
    const duplicate = await prisma.draftProduct.findFirst({ where: { sourceUrl } })
    if (duplicate) return duplicate
  }

  if (slug) {
    const duplicate = await prisma.draftProduct.findFirst({ where: { slug } })
    if (duplicate) return duplicate
  }

  if (name) {
    return prisma.draftProduct.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        category: data.category as never,
        game: data.game,
      },
    })
  }

  return null
}

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const drafts = await prisma.draftProduct.findMany({ orderBy: { updatedAt: "desc" } })
    return NextResponse.json({ drafts })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const data = draftProductSchema.parse(await req.json())
    const duplicate = await findDuplicateDraft(data)
    if (duplicate) {
      return NextResponse.json(
        {
          error: "This product already exists in drafts.",
          duplicateDraft: { id: duplicate.id, name: duplicate.name },
        },
        { status: 409 }
      )
    }

    const exportResult = await exportDraftProductToLocalFolder(data)

    const draft = await prisma.draftProduct.create({
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

    return NextResponse.json({ draft, export: exportResult }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
