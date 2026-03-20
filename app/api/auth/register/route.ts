import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password } = schema.parse(body)

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const isAdmin = process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: isAdmin ? "ADMIN" : "USER",
      },
    })

    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
