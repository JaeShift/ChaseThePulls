import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const MAX_IMAGE_BYTES = 10 * 1024 * 1024

function isAllowedImageUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "https:" && url.hostname.endsWith("cloudinary.com")
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { imageUrl } = (await req.json()) as { imageUrl?: string }
    if (!imageUrl || !isAllowedImageUrl(imageUrl)) {
      return NextResponse.json({ error: "Only uploaded Cloudinary images can be edited." }, { status: 400 })
    }

    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      return NextResponse.json({ error: "Could not fetch image." }, { status: 400 })
    }

    const contentType = imageResponse.headers.get("content-type") ?? "image/png"
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "URL must point to an image." }, { status: 400 })
    }

    const contentLength = Number(imageResponse.headers.get("content-length") ?? 0)
    if (contentLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image is too large to edit." }, { status: 400 })
    }

    const bytes = await imageResponse.arrayBuffer()
    if (bytes.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image is too large to edit." }, { status: 400 })
    }

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Product image source error:", error)
    return NextResponse.json({ error: "Could not load image." }, { status: 500 })
  }
}
