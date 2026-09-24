import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const optionalNumber = (value: unknown) => value === "" || value == null ? undefined : Number(value)

export async function GET(req: Request) {
  try {
    const requestUrl = new URL(req.url)
    const date = requestUrl.searchParams.get("date")
    const from = requestUrl.searchParams.get("from")
    const to = requestUrl.searchParams.get("to")
    const start = from || date
    const end = to || date
    const inventories = await prisma.inventory.findMany({
      where: {
        type: "sale",
        ...(start && end ? {
          OR: [
            { date: { gte: new Date(`${start}T00:00:00.000Z`), lte: new Date(`${end}T23:59:59.999Z`) } },
            { rangeFrom: { lte: new Date(`${end}T23:59:59.999Z`) }, rangeTo: { gte: new Date(`${start}T00:00:00.000Z`) } },
          ],
        } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { sales: true },
    })

    return NextResponse.json(inventories.map((inventory) => ({
      id: inventory.id,
      date: inventory.date,
      rangeFrom: inventory.rangeFrom,
      rangeTo: inventory.rangeTo,
      customerName: inventory.sales[0]?.customerName ?? "",
      products: inventory.sales.map((sale) => sale.productName).filter(Boolean),
      total: inventory.sales.reduce((sum, sale) => sum + (sale.total ?? 0), 0),
      paymentMethod: inventory.paymentMethod,
      cashPaid: inventory.cashPaid,
      posPayment: inventory.posPayment,
      change: inventory.change,
    })))
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to load sales history" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { date, rows, customerName, paymentMethod, cashPaid, posPayment, change } = body

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows provided" }, { status: 400 })
    }

    const sales = await prisma.inventory.create({
      data: {
        type: "sale",
        date: date?.date ? new Date(date.date) : undefined,
        rangeFrom: date?.from ? new Date(date.from) : undefined,
        rangeTo: date?.to ? new Date(date.to) : undefined,
        paymentMethod: paymentMethod || undefined,
        cashPaid: cashPaid === undefined ? undefined : Number(cashPaid),
        posPayment: posPayment === undefined ? undefined : Number(posPayment),
        change: change === undefined ? undefined : Number(change),
        sales: {
          create: rows.map((row: any) => ({
            sn: optionalNumber(row.sn),
            customerSn: optionalNumber(row.customerSn),
            customerName: row.customerName === "" ? undefined : String(row.customerName || customerName || ""),
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
            packSalesPrice: optionalNumber(row.salesPrice),
            pcsSalesPrice: optionalNumber(row.salesPrice),
            price: optionalNumber(row.salesPrice),
            total: optionalNumber(row.total),
          })),
        },
      },
    })

    return NextResponse.json(sales)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to save sales" }, { status: 500 })
  }
}
