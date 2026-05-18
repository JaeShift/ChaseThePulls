import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
import { auth } from "@/lib/auth"
import { getCloudinaryEnvError, uploadImage } from "@/lib/cloudinary"

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_INPUT_PIXELS = 25_000_000

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

    const envError = getCloudinaryEnvError()
    if (envError) return NextResponse.json({ error: envError }, { status: 500 })

    const { imageUrl, selection } = await req.json() as {
      imageUrl: string
      /** All values are 0–1 fractions of the image dimensions */
      selection: { x: number; y: number; width: number; height: number }
    }

    if (!imageUrl || !isAllowedImageUrl(imageUrl)) {
      return NextResponse.json({ error: "Invalid image URL" }, { status: 400 })
    }
    if (
      typeof selection?.x !== "number" ||
      typeof selection?.y !== "number" ||
      typeof selection?.width !== "number" ||
      typeof selection?.height !== "number"
    ) {
      return NextResponse.json({ error: "Invalid selection" }, { status: 400 })
    }

    const imageRes = await fetch(imageUrl)
    if (!imageRes.ok) return NextResponse.json({ error: "Failed to fetch image" }, { status: 400 })

    const contentLength = Number(imageRes.headers.get("content-length") ?? 0)
    if (contentLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image too large" }, { status: 400 })
    }

    const input = Buffer.from(await imageRes.arrayBuffer())
    const { data: _data, info } = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
      .rotate()
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const imgW = info.width
    const imgH = info.height

    // Convert fractional selection to pixel coordinates, clamped to image bounds
    const left   = Math.max(0, Math.round(selection.x * imgW))
    const top    = Math.max(0, Math.round(selection.y * imgH))
    const width  = Math.min(imgW - left, Math.round(selection.width  * imgW))
    const height = Math.min(imgH - top,  Math.round(selection.height * imgH))

    if (width <= 0 || height <= 0) {
      return NextResponse.json({ error: "Selection is empty" }, { status: 400 })
    }

    // Extract only the selected region
    const extracted = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
      .rotate()
      .extract({ left, top, width, height })
      .png()
      .toBuffer()

    // Composite extracted region back onto a white canvas of the original size,
    // at the same position — everything outside the selection becomes white
    const output = await sharp({
      create: {
        width: imgW,
        height: imgH,
        channels: 4,
        background: "#ffffff",
      },
    })
      .composite([{ input: extracted, left, top }])
      .png()
      .toBuffer()

    const url = await uploadImage(`data:image/png;base64,${output.toString("base64")}`)
    return NextResponse.json({ url })
  } catch (err) {
    console.error("[product-image-crop]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
