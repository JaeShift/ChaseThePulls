"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Copy, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

interface DuplicateProductButtonProps {
  productId: string
  productName: string
}

export function DuplicateProductButton({ productId, productName }: DuplicateProductButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDuplicate() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/duplicate-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })
      const data = await res.json() as { draft?: { id: string }; error?: string }

      if (!res.ok || !data.draft) {
        toast({ title: "Duplicate failed", description: data.error ?? "Unknown error.", variant: "destructive" })
        return
      }

      toast({
        title: "Saved as draft",
        description: `"${productName} (Copy)" saved to drafts.`,
        variant: "success",
      })
      router.push(`/admin/drafts/${data.draft.id}`)
    } catch {
      toast({ title: "Duplicate failed", description: "Network error.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDuplicate}
      disabled={loading}
      title={`Duplicate "${productName}" as draft`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
    </Button>
  )
}
