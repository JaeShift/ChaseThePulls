"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export function DeleteProductButton({ productId, productName }: { productId: string; productName: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Product deleted", description: `${productName} has been removed.`, variant: "success" })
        setOpen(false)
        router.refresh()
      } else {
        toast({ title: "Error", description: "Failed to delete product.", variant: "destructive" })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="hover:text-electric-red hover:bg-electric-red/10">
        <Trash2 className="w-4 h-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{productName}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
