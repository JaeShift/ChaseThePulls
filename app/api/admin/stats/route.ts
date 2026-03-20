import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalOrders,
      totalRevenue,
      totalProducts,
      totalUsers,
      recentOrders,
      lowStockProducts,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { not: "CANCELLED" } },
      }),
      prisma.product.count(),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          items: { take: 1 },
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.product.findMany({
        where: { stock: { lte: 5 } },
        orderBy: { stock: "asc" },
        take: 5,
        select: { id: true, name: true, stock: true, category: true },
      }),
    ]);

    return NextResponse.json({
      totalOrders,
      totalRevenue: totalRevenue._sum.total ?? 0,
      totalProducts,
      totalUsers,
      recentOrders,
      lowStockProducts,
    });
  } catch (error) {
    console.error("GET stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

