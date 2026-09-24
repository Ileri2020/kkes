import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const optionalNumber = (value: unknown) => value === "" || value == null ? undefined : Number(value)

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[a-f\d]{24}$/i.test(id)) return NextResponse.json({ error: "Invalid sales id" }, { status: 400 })
  const inventory = await prisma.inventory.findUnique({ where: { id }, include: { sales: true } })
  if (!inventory || inventory.type !== "sale") return NextResponse.json({ error: "Sales record not found" }, { status: 404 })
  return NextResponse.json(inventory)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!/^[a-f\d]{24}$/i.test(id)) return NextResponse.json({ error: "Invalid sales id" }, { status: 400 })
    const body = await request.json()
    const rows = Array.isArray(body.rows) ? body.rows : []
    if (!rows.length) return NextResponse.json({ error: "No rows provided" }, { status: 400 })

    const inventory = await prisma.inventory.update({
      where: { id },
      data: {
        date: body.date?.date ? new Date(body.date.date) : undefined,
        rangeFrom: body.date?.from ? new Date(body.date.from) : undefined,
        rangeTo: body.date?.to ? new Date(body.date.to) : undefined,
        paymentMethod: body.paymentMethod || undefined,
        cashPaid: body.cashPaid === undefined ? undefined : Number(body.cashPaid),
        posPayment: body.posPayment === undefined ? undefined : Number(body.posPayment),
        change: body.change === undefined ? undefined : Number(body.change),
        sales: {
          deleteMany: {},
          create: rows.map((row: any) => ({
            sn: optionalNumber(row.sn),
            customerSn: optionalNumber(row.customerSn),
            customerName: row.customerName || body.customerName || undefined,
            productName: String(row.productName || ""),
            carton: Boolean(row.carton),
            cartonQty: optionalNumber(row.cartonQty),
            packsPerCarton: optionalNumber(row.packsPerCarton),
            pack: Boolean(row.pack),
            wholesale: Boolean(row.wholesale),
            pcsCount: optionalNumber(row.pcsCount),
            packQty: optionalNumber(row.packQty),
            pcsQty: optionalNumber(row.pcsQty),
            totalPcs: optionalNumber(row.totalPcs),
            qty: optionalNumber(row.qty),
            costPrice: optionalNumber(row.costPrice),
            packSalesPrice: optionalNumber(row.salesPrice ?? row.packSalesPrice),
            pcsSalesPrice: optionalNumber(row.salesPrice ?? row.pcsSalesPrice),
            price: optionalNumber(row.salesPrice ?? row.price),
            total: optionalNumber(row.total),
          })),
        },
      },
      include: { sales: true },
    })
    return NextResponse.json(inventory)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to update sales" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!/^[a-f\d]{24}$/i.test(id)) return NextResponse.json({ error: "Invalid sales id" }, { status: 400 })

    const existing = await prisma.inventory.findUnique({ where: { id }, select: { id: true, type: true } })
    if (!existing || existing.type !== "sale") return NextResponse.json({ error: "Sales record not found" }, { status: 404 })

    await prisma.inventorySale.deleteMany({ where: { inventoryId: id } })
    await prisma.inventory.delete({ where: { id } })
    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to delete sales" }, { status: 500 })
  }
}
