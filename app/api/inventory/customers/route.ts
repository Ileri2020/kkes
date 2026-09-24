import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const sales = await prisma.inventorySale.findMany({
      select: {
        customerName: true,
      },
      orderBy: { createdAt: "desc" },
    })

    const customerSet = new Set<string>()

    sales.forEach((sale) => {
      const name = sale.customerName?.trim()
      if (name) {
        customerSet.add(name)
      }
    })

    const customers = Array.from(customerSet).sort((a, b) =>
      a.localeCompare(b)
    )

    return NextResponse.json(customers)
  } catch (error) {
    console.error(error)
    return NextResponse.json([], { status: 500 })
  }
}
