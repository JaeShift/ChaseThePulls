"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

const STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]

export function UpdateOrderStatus({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast({ title: "Order updated", description: `Status changed to ${status}.`, variant: "success" })
        router.refresh()
      } else {
        toast({ title: "Error", description: "Failed to update order.", variant: "destructive" })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <select
      defaultValue={currentStatus}
      onChange={handleChange}
      disabled={loading}
      className="text-xs rounded-lg border border-surface-border bg-surface2 text-white px-2 py-1.5 focus:outline-none focus:border-gold/50 cursor-pointer disabled:opacity-50"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  )
}


