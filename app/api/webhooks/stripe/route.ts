import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { sendOrderConfirmationEmail } from "@/lib/resend"
import Stripe from "stripe"
import { Prisma } from "@prisma/client"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session

    try {
      await handleCheckoutCompleted(session)
    } catch (err) {
      console.error("Error handling checkout.session.completed:", err)
      return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const cartId = session.metadata?.cartId
  const userId = session.metadata?.userId || null
  const sessionCartId = session.metadata?.sessionCartId

  // Get the cart
  const cart = await prisma.cart.findUnique({
    where: { id: cartId ?? "" },
    include: { items: { include: { product: true } } },
  })

  if (!cart || cart.items.length === 0) return

  // Get shipping info from session
  const shippingDetails = session.shipping_details
  const shippingAddress = shippingDetails?.address
    ? {
        name: shippingDetails.name ?? "",
        line1: shippingDetails.address.line1 ?? "",
        line2: shippingDetails.address.line2 ?? "",
        city: shippingDetails.address.city ?? "",
        state: shippingDetails.address.state ?? "",
        postal_code: shippingDetails.address.postal_code ?? "",
        country: shippingDetails.address.country ?? "",
      }
    : null

  const subtotal = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const shippingCost = (session.shipping_cost?.amount_subtotal ?? 0) / 100
  const tax = (session.total_details?.amount_tax ?? 0) / 100
  const total = (session.amount_total ?? 0) / 100

  // Create order
  const order = await prisma.order.create({
    data: {
      userId: userId || null,
      email: session.customer_email ?? session.customer_details?.email ?? "",
      stripeSessionId: session.id,
      status: "PROCESSING",
      subtotal,
      shipping: shippingCost,
      tax,
      total,
      shippingAddress: shippingAddress ?? Prisma.JsonNull,
      items: {
        create: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price,
        })),
      },
    },
    include: {
      items: { include: { product: true } },
    },
  })

  // Decrease stock
  for (const item of cart.items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    })
  }

  // Clear the cart
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })

  // Send confirmation email
  try {
    await sendOrderConfirmationEmail(order as any)
  } catch (emailErr) {
    console.error("Failed to send confirmation email:", emailErr)
    // Don't fail the webhook for email errors
  }
}
