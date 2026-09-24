import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[a-f\d]{24}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid stock purchase id" }, { status: 400 })
  }
  const inventory = await prisma.inventory.findUnique({ where: { id }, include: { stocks: true } })
  if (!inventory) return NextResponse.json({ error: "Stock purchase not found" }, { status: 404 })
  return NextResponse.json(inventory)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid stock purchase id" }, { status: 400 })
    }
    const body = await request.json()
    const rows = Array.isArray(body.rows) ? body.rows : []
    const amountPaid = Number(body.amountPaid) || 0
    const total = rows.reduce((sum: number, row: any) => sum + (Number(row.costPrice) || 0), 0)
    const inventory = await prisma.inventory.update({
      where: { id },
      data: {
        date: body.date?.date ? new Date(body.date.date) : undefined,
        total,
        amountPaid,
        stocks: {
          deleteMany: {},
          create: rows.map((row: any) => {
            const carton = Boolean(row.carton)
            const pack = Boolean(row.pack)
            const isWs = Boolean(row.wholesale)

            return {
              sn: row.sn === "" || row.sn === undefined || row.sn === null ? undefined : Number(row.sn),
              productName: String(row.productName || ""),
              companyName: body.companyName ? String(body.companyName) : undefined,
              repName: body.repName ? String(body.repName) : undefined,
              carton,
              cartonQty: carton && row.cartonQty !== "" && row.cartonQty !== undefined && row.cartonQty !== null ? Number(row.cartonQty) : undefined,
              packsPerCarton: carton && row.packsPerCarton !== "" && row.packsPerCarton !== undefined && row.packsPerCarton !== null ? Number(row.packsPerCarton) : undefined,
              pack,
              pcsCount: (carton || pack) && row.pcsCount !== "" && row.pcsCount !== undefined && row.pcsCount !== null ? Number(row.pcsCount) : undefined,
              packQty: pack && row.packQty !== "" && row.packQty !== undefined && row.packQty !== null ? Number(row.packQty) : undefined,
              pcsQty: row.pcsQty === "" || row.pcsQty === undefined || row.pcsQty === null ? undefined : Number(row.pcsQty),
              totalPcs: Number(row.totalPcs) || 0,
              qty: pack ? (row.packQty === "" || row.packQty === undefined || row.packQty === null ? undefined : Number(row.packQty)) : undefined,
              costPrice: row.costPrice === "" || row.costPrice === undefined || row.costPrice === null ? undefined : Number(row.costPrice),
              cartonCostPrice: carton && row.cartonCostPrice !== "" && row.cartonCostPrice !== undefined && row.cartonCostPrice !== null ? Number(row.cartonCostPrice) : undefined,
              packCostPrice: pack && row.packCostPrice !== "" && row.packCostPrice !== undefined && row.packCostPrice !== null ? Number(row.packCostPrice) : undefined,
              pcsCostPrice: row.pcsCostPrice === "" || row.pcsCostPrice !== undefined && row.pcsCostPrice !== null ? Number(row.pcsCostPrice) : undefined,
              cartonSalesPrice: carton ? (row.retailCartonSalesPrice ? Number(row.retailCartonSalesPrice) : (!isWs && row.cartonSalesPrice ? Number(row.cartonSalesPrice) : undefined)) : undefined,
              packSalesPrice: pack ? (row.retailPackSalesPrice ? Number(row.retailPackSalesPrice) : (!isWs && row.packSalesPrice ? Number(row.packSalesPrice) : undefined)) : undefined,
              pcsSalesPrice: row.retailPcsSalesPrice ? Number(row.retailPcsSalesPrice) : (!isWs && row.pcsSalesPrice ? Number(row.pcsSalesPrice) : undefined),
              wholesaleCartonSalesPrice: carton ? (row.wholesaleCartonSalesPrice ? Number(row.wholesaleCartonSalesPrice) : (isWs && row.cartonSalesPrice ? Number(row.cartonSalesPrice) : undefined)) : undefined,
              wholesalePackSalesPrice: pack ? (row.wholesalePackSalesPrice ? Number(row.wholesalePackSalesPrice) : (isWs && row.packSalesPrice ? Number(row.packSalesPrice) : undefined)) : undefined,
              wholesalePcsSalesPrice: row.wholesalePcsSalesPrice ? Number(row.wholesalePcsSalesPrice) : (isWs && row.pcsSalesPrice ? Number(row.pcsSalesPrice) : undefined),
              expiry: row.expiry ? new Date(`${row.expiry}T00:00:00.000Z`) : undefined,
            }
          }),
        },
      },
      include: { stocks: true },
    })
    return NextResponse.json(inventory)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to update stock" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid stock row id" }, { status: 400 })
    }

    const body = await request.json()
    const expiry = typeof body.expiry === "string" && body.expiry
      ? new Date(`${body.expiry}T00:00:00.000Z`)
      : null
    if (expiry && Number.isNaN(expiry.getTime())) {
      return NextResponse.json({ error: "Invalid expiry date" }, { status: 400 })
    }

    const stock = await prisma.inventoryStock.update({
      where: { id },
      data: { expiry },
    })
    return NextResponse.json(stock)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to update stock expiry" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid stock purchase id" }, { status: 400 })
    }

    const existing = await prisma.inventory.findUnique({ where: { id }, select: { id: true } })
    if (!existing) return NextResponse.json({ error: "Stock purchase not found" }, { status: 404 })

    await prisma.inventoryStock.deleteMany({ where: { inventoryId: id } })
    await prisma.inventory.delete({ where: { id } })
    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to delete stock purchase" }, { status: 500 })
  }
}