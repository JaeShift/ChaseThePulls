import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { productId, images } = await req.json()

    if (!productId || !Array.isArray(images)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: { images },
    })

    return NextResponse.json({ product })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
