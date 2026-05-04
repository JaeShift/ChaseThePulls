import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"

const rewriteSchema = z.object({
  name: z.string().trim().max(200).optional(),
  details: z.string().trim().min(20).max(12000),
})

async function requireAdmin() {
  const session = await auth()
  return !!session?.user && session.user.role === "ADMIN"
}

function removeMarkdownFormatting(value: string) {
  return value
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "- ")
    .trim()
}

export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 })
    }

    const data = rewriteSchema.parse(await req.json())
    const productName = data.name ? `Product name: ${data.name}` : "Product name: Unknown"

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.35,
        messages: [
          {
            role: "system",
            content:
              "You rewrite product details for an online trading card and collectibles shop. Keep every factual detail grounded in the user's source text. Do not invent compatibility, sizes, materials, quantities, brands, guarantees, or claims. Remove marketplace fluff, duplicate wording, shipping language, review language, and seller claims. Return only plain text product details. Format every point as a simple hyphen bullet that starts with '- '. Do not use paragraphs, headings, Markdown formatting, bold text, asterisks, or double asterisks.",
          },
          {
            role: "user",
            content: `${productName}\n\nRewrite these details for the Chase The Pulls storefront:\n\n${data.details}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const body = (await response.text()).slice(0, 1000)
      console.error("OpenAI rewrite failed:", response.status, body)

      if (response.status === 429 && body.includes("insufficient_quota")) {
        return NextResponse.json(
          { error: "OpenAI says this API key has no available quota. Check billing or add credits in OpenAI." },
          { status: 502 }
        )
      }

      return NextResponse.json({ error: "AI rewrite failed. Please try again." }, { status: 502 })
    }

    const result = (await response.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const rewrittenDetails = removeMarkdownFormatting(result.choices?.[0]?.message?.content ?? "")

    if (!rewrittenDetails) {
      return NextResponse.json({ error: "AI rewrite returned an empty response." }, { status: 502 })
    }

    return NextResponse.json({ details: rewrittenDetails })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Add at least a little product detail text before rewriting." },
        { status: 400 }
      )
    }

    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
