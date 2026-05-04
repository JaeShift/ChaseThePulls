export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ProductForm } from "@/components/admin/ProductForm"

interface EditDraftPageProps {
  params: Promise<{ id: string }>
}

export default async function EditDraftPage({ params }: EditDraftPageProps) {
  const { id } = await params
  let draft: Awaited<ReturnType<typeof prisma.draftProduct.findUnique<{ where: { id: string } }>>> = null
  try {
    draft = await prisma.draftProduct.findUnique({ where: { id } })
  } catch {
    // DB unavailable
  }
  if (!draft) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-4xl text-foreground mb-1">Edit Draft</h1>
        <p className="text-foreground/50 truncate">{draft.name ?? "Untitled Draft"}</p>
      </div>
      <ProductForm draft={draft as any} draftId={draft.id} mode="create" />
    </div>
  )
}
