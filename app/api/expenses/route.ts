import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const optionalDate = (value: unknown) => value ? new Date(String(value)) : undefined

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams
    const date = params.get("date")
    const from = params.get("from")
    const to = params.get("to")
    const start = from || date
    const end = to || date
    const expenses = await prisma.expense.findMany({
      where: start && end ? { date: { gte: new Date(`${start}T00:00:00.000Z`), lte: new Date(`${end}T23:59:59.999Z`) } } : undefined,
      orderBy: { date: "desc" },
      include: { items: true },
    })
    return NextResponse.json(expenses)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to load expenses" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rows = Array.isArray(body.rows)
      ? body.rows.filter((row: any) => String(row.name || "").trim() && Number(row.amount) >= 0)
      : []

    if (!rows.length) return NextResponse.json({ error: "Add at least one expense" }, { status: 400 })

    const items = rows.map((row: any) => ({
      name: String(row.name).trim(),
      amount: Number(row.amount),
      span: Boolean(row.span),
      spanFrom: row.span ? optionalDate(row.spanFrom) : undefined,
      spanTo: row.span ? optionalDate(row.spanTo) : undefined,
    }))

    const expense = await prisma.expense.create({
      data: {
        date: new Date(`${body.date || new Date().toISOString().slice(0, 10)}T00:00:00`),
        total: items.reduce((sum, item) => sum + item.amount, 0),
        items: { create: items },
      },
      include: { items: true },
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to save expenses" }, { status: 500 })
  }
}
