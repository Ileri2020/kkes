import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const oldName = String(body.oldName || "").trim()
    const newName = String(body.newName || "").trim()

    if (!oldName || !newName) return NextResponse.json({ error: "Both product names are required" }, { status: 400 })
    if (oldName === newName) return NextResponse.json({ error: "The product name is unchanged" }, { status: 400 })

    const [stocks, sales] = await Promise.all([
      prisma.inventoryStock.findMany({ where: { productName: oldName }, select: { id: true } }),
      prisma.inventorySale.findMany({ where: { productName: oldName }, select: { id: true } }),
    ])

    if (!stocks.length && !sales.length) return NextResponse.json({ error: "No saved product references found" }, { status: 404 })

    await Promise.all([
      prisma.inventoryStock.updateMany({ where: { productName: oldName }, data: { productName: newName } }),
      prisma.inventorySale.updateMany({ where: { productName: oldName }, data: { productName: newName } }),
    ])

    return NextResponse.json({ renamed: true, stockCount: stocks.length, salesCount: sales.length, productName: newName })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to rename product" }, { status: 500 })
  }
}
