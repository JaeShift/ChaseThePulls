import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

const CART_COOKIE = "ctp-cart-id"

async function getCartForRequest(userId?: string, sessionId?: string) {
  if (userId) return prisma.cart.findUnique({ where: { userId } })
  if (sessionId) return prisma.cart.findUnique({ where: { sessionId } })
  return null
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params
  try {
    const session = await auth()
    const cookieStore = await cookies()
    const sessionId = cookieStore.get(CART_COOKIE)?.value

    const cart = await getCartForRequest(session?.user?.id, sessionId ?? undefined)
    if (!cart) return NextResponse.json({ error: "Cart not found" }, { status: 404 })

    const { quantity } = await req.json()

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: itemId } })
    } else {
      await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } })
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true }, orderBy: { createdAt: "asc" } } },
    })

    return NextResponse.json(updatedCart)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params
  try {
    const session = await auth()
    const cookieStore = await cookies()
    const sessionId = cookieStore.get(CART_COOKIE)?.value

    const cart = await getCartForRequest(session?.user?.id, sessionId ?? undefined)
    if (!cart) return NextResponse.json({ error: "Cart not found" }, { status: 404 })

    await prisma.cartItem.delete({ where: { id: itemId } })

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true }, orderBy: { createdAt: "asc" } } },
    })

    return NextResponse.json(updatedCart)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


