"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

const STATUS_OPTIONS = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-300",
  PAID: "text-blue-300",
  PROCESSING: "text-purple-300",
  SHIPPED: "text-indigo-300",
  DELIVERED: "text-green-300",
  CANCELLED: "text-red-300",
  REFUNDED: "text-gray-300",
};

export function UpdateOrderStatusButton({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <select
        value={currentStatus}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={loading}
        className={`appearance-none pr-8 pl-3 py-1.5 rounded-lg text-xs font-bold bg-[#12122a] border border-[rgba(99,102,241,0.25)] cursor-pointer hover:border-accent/40 transition-colors disabled:opacity-50 ${STATUS_COLORS[currentStatus]}`}
      >
        {STATUS_OPTIONS.map((status) => (
          <option key={status} value={status} className="text-foreground bg-[#0d0d24]">
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
    </div>
  );
}

