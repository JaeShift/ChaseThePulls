import { NextRequest, NextResponse } from "next/server"
import { lookup } from "dns/promises"
import net from "net"
import { auth } from "@/lib/auth"
import { getCloudinaryEnvError, uploadImage } from "@/lib/cloudinary"

const MAX_IMAGE_BYTES = 10 * 1024 * 1024

function isPrivateAddress(address: string) {
  if (net.isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number)
    return (
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||
      a === 0
    )
  }

  if (net.isIP(address) === 6) {
    const normalized = address.toLowerCase()
    return (
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80:")
    )
  }

  return true
}

async function assertSafeImageUrl(url: URL) {
  if (url.protocol !== "https:") {
    throw new Error("Only HTTPS image URLs can be uploaded.")
  }

  const { address } = await lookup(url.hostname)
  if (isPrivateAddress(address)) {
    throw new Error("That image URL is not allowed.")
  }
}

function imageMimeFromUrl(url: string) {
  if (/\.avif(\?|$)/i.test(url)) return "image/avif"
  if (/\.gif(\?|$)/i.test(url)) return "image/gif"
  if (/\.jpe?g(\?|$)/i.test(url)) return "image/jpeg"
  if (/\.png(\?|$)/i.test(url)) return "image/png"
  if (/\.webp(\?|$)/i.test(url)) return "image/webp"
  return null
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Not allowed — uploads require an admin account. Sign out and sign in again after your user is ADMIN in the database, or run npm run admin:add.",
          code: "NOT_ADMIN",
        },
        { status: 403 }
      )
    }

    const envErr = getCloudinaryEnvError()
    if (envErr) {
      return NextResponse.json({ error: envErr, code: "CLOUDINARY_ENV" }, { status: 500 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const imageUrlValue = formData.get("imageUrl")

    if (!file && typeof imageUrlValue !== "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file) {
      const fallbackMime = imageMimeFromUrl(file.name)
      const mime = file.type.startsWith("image/") ? file.type : fallbackMime

      if (!mime) {
        return NextResponse.json({ error: "File must be an image" }, { status: 400 })
      }

      if (file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64 = `data:${mime};base64,${buffer.toString("base64")}`
      const url = await uploadImage(base64)

      return NextResponse.json({ url })
    }

    if (typeof imageUrlValue !== "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const imageUrl = new URL(imageUrlValue)
    await assertSafeImageUrl(imageUrl)

    const res = await fetch(imageUrl, { redirect: "follow" })
    if (!res.ok) {
      return NextResponse.json({ error: "Could not fetch image URL" }, { status: 400 })
    }

    const mime = res.headers.get("content-type")?.split(";")[0] ?? imageMimeFromUrl(imageUrl.toString())
    if (!mime?.startsWith("image/")) {
      return NextResponse.json({ error: "URL must point to an image" }, { status: 400 })
    }

    const length = Number(res.headers.get("content-length") ?? 0)
    if (length > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
    }

    const bytes = await res.arrayBuffer()
    if (bytes.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
    }

    const buffer = Buffer.from(bytes)
    const base64 = `data:${mime};base64,${buffer.toString("base64")}`
    const url = await uploadImage(base64)

    return NextResponse.json({ url })
  } catch (error) {
    console.error("Upload error:", error)
    const isDev = process.env.NODE_ENV === "development"
    const msg =
      error instanceof Error ? error.message : "Upload failed"
    return NextResponse.json(
      {
        error: isDev ? msg : "Upload failed",
        code: "CLOUDINARY_UPLOAD",
        hint: isDev
          ? "Confirm API key/secret match the Cloudinary dashboard and restart next dev after changing .env.local."
          : undefined,
      },
      { status: 500 }
    )
  }
}
