import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");

  if (!fromStr || !toStr) {
    return NextResponse.json({ error: "Missing from or to date" }, { status: 400 });
  }

  const from = new Date(fromStr);
  const to = new Date(toStr);

  try {
    /* ================= PAID CARTS FOR REVENUE & PROFIT ================= */
    const paidCarts = await prisma.cart.findMany({
      where: {
        status: "paid",
        createdAt: { gte: from, lte: to },
      },
      include: {
        products: {
          include: { product: true }
        }
      }
    });

    const totalRevenue = paidCarts.reduce(
      (sum, cart) => sum + cart.total,
      0
    );

    const totalCost = paidCarts.reduce((sum, cart) => {
      const cost = cart.products.reduce((pSum, item) => {
        return pSum + ((item.product as any).costPrice || 0) * item.quantity;
      }, 0);
      return sum + cost;
    }, 0);

    const totalProfit = totalRevenue - totalCost;

    /* ================= REVENUE OVER TIME (For chart) ================= */
    // Grouping by day manually as Prisma doesn't do it easily for MongoDB
    const revenueByDay: Record<string, number> = {};
    paidCarts.forEach(cart => {
      const day = cart.createdAt.toISOString().split("T")[0];
      revenueByDay[day] = (revenueByDay[day] || 0) + cart.total;
    });

    const revenueOverTime = Object.entries(revenueByDay).map(([date, revenue]) => ({
      date,
      revenue
    })).sort((a, b) => a.date.localeCompare(b.date));

    /* ================= PROFIT OVER TIME (For chart) ================= */
    const profitByDay: Record<string, { revenue: number; cost: number; profit: number }> = {};
    paidCarts.forEach(cart => {
      const day = cart.createdAt.toISOString().split("T")[0];
      const cost = cart.products.reduce((pSum, item) => {
        return pSum + ((item.product as any).costPrice || 0) * item.quantity;
      }, 0);
      
      if (!profitByDay[day]) {
        profitByDay[day] = { revenue: 0, cost: 0, profit: 0 };
      }
      profitByDay[day].revenue += cart.total;
      profitByDay[day].cost += cost;
      profitByDay[day].profit += (cart.total - cost);
    });

    const profitOverTime = Object.entries(profitByDay).map(([date, stats]) => ({
      date,
      ...stats
    })).sort((a, b) => a.date.localeCompare(b.date));

    /* ================= CART STATUS DISTRIBUTION ================= */
    const cartStatusCountsRaw = await prisma.cart.groupBy({
      by: ["status"],
      where: {
        createdAt: { gte: from, lte: to },
      },
      _count: { status: true },
    });

    const cartStatusCounts = cartStatusCountsRaw.map(c => ({
      name: c.status,
      value: c._count.status
    }));

    /* ================= TOP PRODUCTS ================= */
    const topProductsRaw = await prisma.cartItem.groupBy({
      by: ["productId"],
      where: {
        cart: {
          status: "paid",
          createdAt: { gte: from, lte: to }
        }
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });

    const productIds = topProductsRaw.map(p => p.productId);

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true }
    });

    const topProducts = topProductsRaw.map(tp => {
      const prod = products.find(p => p.id === tp.productId);
      return {
        name: prod?.name || "Unknown",
        quantity: tp._sum.quantity,
      };
    });

    /* ================= VISITS OVER TIME (from Visit model) ================= */
    const visitsRaw = await prisma.visit.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { createdAt: true, path: true },
    });

    const visitsByDay: Record<string, number> = {};
    visitsRaw.forEach((v) => {
      const day = v.createdAt.toISOString().split("T")[0];
      visitsByDay[day] = (visitsByDay[day] || 0) + 1;
    });

    const dailyVisits = Object.entries(visitsByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const totalVisits = visitsRaw.length;

    /* ================= REFUND REASONS ================= */
    const refundsRaw = await prisma.refund.groupBy({
      by: ["reason"],
      where: {
        createdAt: { gte: from, lte: to },
      },
      _count: { reason: true },
    });

    const refunds = refundsRaw.map(d => ({
      reason: d.reason || "No reason",
      count: d._count.reason
    }));

    /* ================= KPIs ================= */
    const ordersCount = paidCarts.length;
    
    const refundAgg = await prisma.refund.aggregate({
      where: { createdAt: { gte: from, lte: to } },
      _sum: { amount: true }
    });

    const newUsers = await prisma.user.count({
      where: { createdAt: { gte: from, lte: to } }
    });
    
    const totalUsers = await prisma.user.count();

    /* ================= MISC DB COUNTS ================= */
    const totalProducts = await prisma.product.count();
    const newProducts = await prisma.product.count({
      where: { createdAt: { gte: from, lte: to } }
    });

    const totalBrands = await prisma.brand.count();

    const totalPosts = await prisma.post.count();
    const newPosts = await prisma.post.count({
      where: { createdAt: { gte: from, lte: to } }
    });

    /* ================= POSTS BY CATEGORY ================= */
    const postsByCategoryRaw = await prisma.post.groupBy({
      by: ["category"],
      where: { createdAt: { gte: from, lte: to } },
      _count: { category: true }
    });
    
    const postsByCategory = postsByCategoryRaw.map(p => ({
      name: p.category || "Uncategorized",
      value: p._count.category
    }));

    /* ================= USER ROLES OVERVIEW ================= */
    const userRolesRaw = await prisma.user.groupBy({
      by: ["role"],
      _count: { role: true },
    });

    const userRoles = userRolesRaw.map(u => ({
      name: u.role || "customer",
      value: u._count.role
    }));

    /* ================= UNIQUE BROWSERS COUNT ================= */
    const uniqueBrowsers = await prisma.visit.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { browserId: true },
      distinct: ['browserId']
    });

    const totalUniqueBrowsers = uniqueBrowsers.length;

    return NextResponse.json({
      revenue: totalRevenue,
      profit: totalProfit,
      revenueOverTime,
      profitOverTime,
      cartStatusCounts,
      topProducts,
      dailyVisits,
      totalVisits,
      refunds,
      postsByCategory,
      userRoles,
      uniqueBrowsers: totalUniqueBrowsers,
      kpis: {
        totalRevenue,
        totalOrders: ordersCount,
        totalRefunds: refundAgg._sum.amount || 0,
        newUsers,
        totalUsers,
        totalProducts,
        newProducts,
        totalPosts,
        newPosts,
        totalBrands,
        totalVisits,
        totalUniqueBrowsers
      }
    });
  } catch (error) {
    console.error("Analytics API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
