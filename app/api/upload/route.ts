import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getCloudinaryEnvError, uploadImage } from "@/lib/cloudinary"

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

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`

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
