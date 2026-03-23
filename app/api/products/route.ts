import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { productSchema } from "@/lib/validations"
import { z } from "zod"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")
    const game = searchParams.get("game")
    const subcategory = searchParams.get("subcategory")
    const featured = searchParams.get("featured")
    const search = searchParams.get("search")
    const take = parseInt(searchParams.get("take") ?? "50")

    const products = await prisma.product.findMany({
      where: {
        ...(category && { category: category as any }),
        ...(game && { game: game as any }),
        ...(subcategory && { subcategory: subcategory as any }),
        ...(featured === "true" && { featured: true }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { details: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      take,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await req.json()
    const data = productSchema.parse(body)

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        details: data.details?.trim() || null,
        price: data.price,
        comparePrice: data.comparePrice,
        images: data.images,
        category: data.category as never,
        game: data.game,
        subcategory: data.subcategory,
        stock: data.stock,
        featured: data.featured,
        set: data.set,
      },
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
