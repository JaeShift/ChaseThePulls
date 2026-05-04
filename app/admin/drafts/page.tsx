export const dynamic = "force-dynamic"

import Link from "next/link"
import { FileText, Pencil, Plus } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CATEGORY_LABELS, CATEGORY_COLORS, GAME_LABELS, GAME_COLORS } from "@/types"
import { DeleteDraftButton } from "@/components/admin/DeleteDraftButton"

export default async function AdminDraftsPage() {
  let drafts: Awaited<ReturnType<typeof prisma.draftProduct.findMany>> = []
  try {
    drafts = await prisma.draftProduct.findMany({ orderBy: { updatedAt: "desc" } })
  } catch {
    // DB unavailable
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-4xl text-foreground mb-1">Drafts</h1>
          <p className="text-foreground/50">{drafts.length} draft products</p>
        </div>
        <Button variant="glow" asChild>
          <Link href="/admin/products/new">
            <Plus className="w-4 h-4 mr-1" /> New Draft
          </Link>
        </Button>
      </div>

      <div className="rounded-2xl border border-surface-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left p-4 text-sm font-medium text-foreground/50">Draft</th>
                <th className="text-left p-4 text-sm font-medium text-foreground/50">Game</th>
                <th className="text-left p-4 text-sm font-medium text-foreground/50">Type</th>
                <th className="text-right p-4 text-sm font-medium text-foreground/50">Price</th>
                <th className="text-left p-4 text-sm font-medium text-foreground/50">Local Folder</th>
                <th className="text-right p-4 text-sm font-medium text-foreground/50">Actions</th>
              </tr>
            </thead>
            <tbody>
              {drafts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <FileText className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
                    <p className="text-foreground/40">No drafts yet</p>
                    <Button variant="glow" size="sm" className="mt-4" asChild>
                      <Link href="/admin/products/new">Create your first draft</Link>
                    </Button>
                  </td>
                </tr>
              ) : (
                drafts.map((draft) => {
                  const typeColor = CATEGORY_COLORS[draft.category as keyof typeof CATEGORY_COLORS]
                  const gameColor = GAME_COLORS[draft.game as keyof typeof GAME_COLORS]
                  const draftName = draft.name ?? "Untitled Draft"
                  return (
                    <tr key={draft.id} className="border-b border-surface-border hover:bg-surface2/50 transition-colors">
                      <td className="p-4">
                        <p className="text-sm font-medium text-foreground line-clamp-1">{draftName}</p>
                        {draft.sourceUrl && (
                          <a
                            href={draft.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-accent hover:text-accent-light"
                          >
                            Source link
                          </a>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            color: gameColor,
                            background: `${gameColor}18`,
                            border: `1px solid ${gameColor}35`,
                          }}
                        >
                          {GAME_LABELS[draft.game as keyof typeof GAME_LABELS]}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            color: typeColor,
                            background: `${typeColor}15`,
                            border: `1px solid ${typeColor}30`,
                          }}
                        >
                          {CATEGORY_LABELS[draft.category as keyof typeof CATEGORY_LABELS]}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {draft.price ? (
                          <span className="text-sm font-semibold text-accent">{formatPrice(draft.price)}</span>
                        ) : (
                          <Badge variant="secondary">No price</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <p className="max-w-xs truncate text-xs text-foreground/45">
                          {draft.localFolderPath ?? "Not exported"}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/admin/drafts/${draft.id}/edit`}>
                              <Pencil className="w-4 h-4" />
                            </Link>
                          </Button>
                          <DeleteDraftButton draftId={draft.id} draftName={draftName} />
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
