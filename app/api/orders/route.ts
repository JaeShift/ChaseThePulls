import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = session.user.role === "ADMIN"

    const orders = await prisma.order.findMany({
      where: isAdmin ? {} : { userId: session.user.id },
      include: {
        items: { include: { product: { select: { name: true, images: true, slug: true } } } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ orders })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
