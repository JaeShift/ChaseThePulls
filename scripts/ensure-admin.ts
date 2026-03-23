/**
 * Creates or updates an admin user from env (run once on your machine).
 *
 * Usage:
 *   Set in .env or .env.local:
 *     ADMIN_EMAIL="you@example.com"
 *     ADMIN_PASSWORD="a-strong-password"
 *   Then: npm run admin:add
 */
import { config } from "dotenv"
import { resolve } from "path"

config({ path: resolve(process.cwd(), ".env.local") })
config({ path: resolve(process.cwd(), ".env") })

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) {
    console.error(
      "Missing ADMIN_EMAIL or ADMIN_PASSWORD. Add them to .env.local then run: npm run admin:add"
    )
    process.exit(1)
  }

  const hashed = await bcrypt.hash(password, 12)

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: "Store Admin",
      password: hashed,
      role: "ADMIN",
    },
    update: {
      password: hashed,
      role: "ADMIN",
    },
  })

  console.log("Admin user ready.")
  console.log("  Email:", email)
  console.log("  Sign in at: /login  →  then open: /admin/products/new")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
