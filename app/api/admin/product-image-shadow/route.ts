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

function isEdgeWhite(data: Buffer, offset: number) {
  const r = data[offset]
  const g = data[offset + 1]
  const b = data[offset + 2]
  const a = data[offset + 3]
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)

  return a <= 10 || (r >= 238 && g >= 238 && b >= 238 && max - min <= 35)
}

function detectObjectAlpha(data: Buffer, width: number, height: number) {
  const totalPixels = width * height
  const background = new Uint8Array(totalPixels)
  const queue = new Int32Array(totalPixels)
  let start = 0
  let end = 0

  const enqueue = (pixelIndex: number) => {
    if (background[pixelIndex]) return
    if (!isEdgeWhite(data, pixelIndex * 4)) return

    background[pixelIndex] = 1
    queue[end] = pixelIndex
    end += 1
  }

  for (let x = 0; x < width; x += 1) {
    enqueue(x)
    enqueue((height - 1) * width + x)
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(y * width)
    enqueue(y * width + width - 1)
  }

  while (start < end) {
    const pixelIndex = queue[start]
    start += 1

    const x = pixelIndex % width
    const y = Math.floor(pixelIndex / width)

    if (x > 0) enqueue(pixelIndex - 1)
    if (x < width - 1) enqueue(pixelIndex + 1)
    if (y > 0) enqueue(pixelIndex - width)
    if (y < height - 1) enqueue(pixelIndex + width)
  }

  const object = Buffer.alloc(data.length)
  const shadow = Buffer.alloc(data.length)

  for (let pixelIndex = 0; pixelIndex < totalPixels; pixelIndex += 1) {
    const offset = pixelIndex * 4
    const alpha = background[pixelIndex] ? 0 : data[offset + 3]

    object[offset] = data[offset]
    object[offset + 1] = data[offset + 1]
    object[offset + 2] = data[offset + 2]
    object[offset + 3] = alpha

    shadow[offset] = 0
    shadow[offset + 1] = 0
    shadow[offset + 2] = 0
    shadow[offset + 3] = Math.round(alpha * 0.32)
  }

  return { object, shadow }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin required" }, { status: 403 })
    }

    const envErr = getCloudinaryEnvError()
    if (envErr) {
      return NextResponse.json({ error: envErr, code: "CLOUDINARY_ENV" }, { status: 500 })
    }

    const { imageUrl } = (await req.json()) as { imageUrl?: string }
    if (!imageUrl || !isAllowedImageUrl(imageUrl)) {
      return NextResponse.json({ error: "Only uploaded Cloudinary images can be processed." }, { status: 400 })
    }

    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      return NextResponse.json({ error: "Could not fetch image." }, { status: 400 })
    }

    const contentType = imageResponse.headers.get("content-type") ?? ""
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "URL must point to an image." }, { status: 400 })
    }

    const contentLength = Number(imageResponse.headers.get("content-length") ?? 0)
    if (contentLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image is too large to process." }, { status: 400 })
    }

    const input = Buffer.from(await imageResponse.arrayBuffer())
    if (input.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image is too large to process." }, { status: 400 })
    }

    const { data, info } = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
      .rotate()
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const { object, shadow } = detectObjectAlpha(data, info.width, info.height)
    const raw = { width: info.width, height: info.height, channels: 4 as const }

    // Padding around the object on all sides so blur has room to spread
    const pad = Math.max(Math.round(Math.min(info.width, info.height) * 0.18), 80)
    const shadowDropY = Math.round(info.height * 0.04)
    const outputWidth = info.width + pad * 2
    const outputHeight = info.height + pad * 2

    // Object PNG at original size, then placed on padded canvas
    const objectPng = await sharp(object, { raw }).png().toBuffer()

    // Shadow: place the tight shadow mask onto the full padded canvas FIRST,
    // then blur — so the blur spreads freely on all sides without clipping
    const shadowOnPaddedCanvas = await sharp({
      create: {
        width: outputWidth,
        height: outputHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: await sharp(shadow, { raw }).png().toBuffer(), top: pad + shadowDropY, left: pad }])
      .png()
      .toBuffer()

    const shadowBlurred = await sharp(shadowOnPaddedCanvas).blur(18).png().toBuffer()

    const output = await sharp({
      create: {
        width: outputWidth,
        height: outputHeight,
        channels: 4,
        background: "#ffffff",
      },
    })
      .composite([
        { input: shadowBlurred, top: 0, left: 0 },
        { input: objectPng, top: pad, left: pad },
      ])
      .png()
      .toBuffer()

    const url = await uploadImage(`data:image/png;base64,${output.toString("base64")}`)
    return NextResponse.json({ url })
  } catch (error) {
    console.error("Product image shadow error:", error)
    return NextResponse.json({ error: "Could not add object shadow." }, { status: 500 })
  }
}
