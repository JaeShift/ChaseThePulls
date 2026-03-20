import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { generateCartId } from "@/lib/utils"

const CART_COOKIE = "ctp-cart-id"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

async function getOrCreateCart(userId?: string, sessionId?: string) {
  if (userId) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true }, orderBy: { createdAt: "asc" } } },
    })
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: { items: { include: { product: true }, orderBy: { createdAt: "asc" } } },
      })
    }
    return cart
  }

  if (sessionId) {
    let cart = await prisma.cart.findUnique({
      where: { sessionId },
      include: { items: { include: { product: true }, orderBy: { createdAt: "asc" } } },
    })
    if (!cart) {
      cart = await prisma.cart.create({
        data: { sessionId },
        include: { items: { include: { product: true }, orderBy: { createdAt: "asc" } } },
      })
    }
    return cart
  }

  return null
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const cookieStore = await cookies()
    let sessionId = cookieStore.get(CART_COOKIE)?.value

    if (!sessionId && !session?.user) {
      sessionId = generateCartId()
    }

    const cart = await getOrCreateCart(session?.user?.id, sessionId)

    // Merge anonymous cart with user cart on login
    if (session?.user?.id && sessionId) {
      const anonCart = await prisma.cart.findUnique({
        where: { sessionId },
        include: { items: true },
      })

      if (anonCart && anonCart.items.length > 0) {
        const userCart = await prisma.cart.findUnique({ where: { userId: session.user.id } })
        if (userCart) {
          // Move items
          for (const item of anonCart.items) {
            const existing = await prisma.cartItem.findUnique({
              where: { cartId_productId: { cartId: userCart.id, productId: item.productId } },
            })
            if (existing) {
              await prisma.cartItem.update({
                where: { id: existing.id },
                data: { quantity: existing.quantity + item.quantity },
              })
            } else {
              await prisma.cartItem.create({
                data: { cartId: userCart.id, productId: item.productId, quantity: item.quantity },
              })
            }
          }
          await prisma.cart.delete({ where: { id: anonCart.id } })
        }
      }
    }

    const response = NextResponse.json(cart ?? { id: null, items: [] })

    if (sessionId && !cookieStore.get(CART_COOKIE)) {
      response.cookies.set(CART_COOKIE, sessionId, { maxAge: COOKIE_MAX_AGE, httpOnly: true, sameSite: "lax" })
    }

    return response
  } catch (error) {
    console.error("Cart GET error:", error)
    return NextResponse.json({ id: null, items: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const cookieStore = await cookies()
    let sessionId = cookieStore.get(CART_COOKIE)?.value

    if (!sessionId && !session?.user) {
      sessionId = generateCartId()
    }

    const { productId, quantity = 1 } = await req.json()

    if (!productId || quantity < 1) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })
    if (product.stock === 0) return NextResponse.json({ error: "Out of stock" }, { status: 400 })

    let cart = await getOrCreateCart(session?.user?.id, sessionId)
    if (!cart) return NextResponse.json({ error: "Could not create cart" }, { status: 500 })

    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    })

    if (existing) {
      const newQty = Math.min(existing.quantity + quantity, product.stock)
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty } })
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity: Math.min(quantity, product.stock) },
      })
    }

    cart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true }, orderBy: { createdAt: "asc" } } },
    })

    const response = NextResponse.json(cart)
    if (sessionId && !cookieStore.get(CART_COOKIE)) {
      response.cookies.set(CART_COOKIE, sessionId, { maxAge: COOKIE_MAX_AGE, httpOnly: true, sameSite: "lax" })
    }
    return response
  } catch (error) {
    console.error("Cart POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    const cookieStore = await cookies()
    const sessionId = cookieStore.get(CART_COOKIE)?.value

    if (session?.user?.id) {
      const cart = await prisma.cart.findUnique({ where: { userId: session.user.id } })
      if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
    } else if (sessionId) {
      const cart = await prisma.cart.findUnique({ where: { sessionId } })
      if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


