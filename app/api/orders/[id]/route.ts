import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendOrderShippedEmail } from "@/lib/resend"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { status, trackingNumber } = await req.json()

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(trackingNumber && { trackingNumber }),
      },
      include: {
        items: { include: { product: true } },
      },
    })

    // Send shipping email when status changes to SHIPPED
    if (status === "SHIPPED" && trackingNumber) {
      try {
        await sendOrderShippedEmail(order as any, trackingNumber)
      } catch (err) {
        console.error("Failed to send shipping email:", err)
      }
    }

    return NextResponse.json({ order })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
