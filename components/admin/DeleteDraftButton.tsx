"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

export function DeleteDraftButton({ draftId, draftName }: { draftId: string; draftName: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const deleteDraft = async () => {
    if (!confirm(`Delete draft "${draftName}"?`)) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/drafts/${draftId}`, { method: "DELETE" })
      if (!res.ok) {
        toast({ title: "Error", description: "Failed to delete draft.", variant: "destructive" })
        return
      }

      toast({ title: "Draft deleted", description: `${draftName} has been removed.`, variant: "success" })
      router.refresh()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={deleteDraft} disabled={deleting}>
      <Trash2 className="w-4 h-4 text-electric-red" />
    </Button>
  )
}
