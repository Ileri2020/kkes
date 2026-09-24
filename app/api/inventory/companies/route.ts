import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const stocks = await prisma.inventoryStock.findMany({
      select: {
        companyName: true,
        repName: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    const companyMap = new Map<string, { companyName: string; repName: string }>()

    stocks.forEach((stock) => {
      const company = stock.companyName?.trim()
      if (!company) return
      const key = company.toLowerCase()

      const existing = companyMap.get(key)
      if (!existing) {
        companyMap.set(key, {
          companyName: company,
          repName: stock.repName?.trim() || "",
        })
      } else if (!existing.repName && stock.repName?.trim()) {
        existing.repName = stock.repName.trim()
      }
    })

    const companies = Array.from(companyMap.values()).sort((a, b) =>
      a.companyName.localeCompare(b.companyName)
    )

    return NextResponse.json(companies)
  } catch (error) {
    console.error(error)
    return NextResponse.json([], { status: 500 })
  }
}
