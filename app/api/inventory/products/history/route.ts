import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const productName = new URL(request.url).searchParams.get("productName")?.trim()
    if (!productName) return NextResponse.json({ error: "Product name is required" }, { status: 400 })

    const normalizedName = productName.replace(/\s+/g, " ").toLowerCase()
    const [stocks, sales] = await Promise.all([
      prisma.inventory.findMany({
        where: { type: "stock" },
        orderBy: { createdAt: "desc" },
        include: { stocks: true },
      }),
      prisma.inventory.findMany({
        where: { type: "sale" },
        orderBy: { createdAt: "desc" },
        include: { sales: true },
      }),
    ])

    const matches = (value: string) => value.replace(/\s+/g, " ").trim().toLowerCase() === normalizedName

    return NextResponse.json({
      stocks: stocks.map((inventory) => ({
        id: inventory.id,
        date: inventory.date,
        rangeFrom: inventory.rangeFrom,
        rangeTo: inventory.rangeTo,
        companyName: inventory.stocks.find((row) => matches(row.productName))?.companyName ?? "",
        repName: inventory.stocks.find((row) => matches(row.productName))?.repName ?? "",
        rows: inventory.stocks.filter((row) => matches(row.productName)),
      })).filter((inventory) => inventory.rows.length > 0),
      sales: sales.map((inventory) => ({
        id: inventory.id,
        date: inventory.date,
        rangeFrom: inventory.rangeFrom,
        rangeTo: inventory.rangeTo,
        rows: inventory.sales.filter((row) => matches(row.productName)),
      })).filter((inventory) => inventory.rows.length > 0),
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to load product history" }, { status: 500 })
  }
}
