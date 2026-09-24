import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type ProductBalance = {
  productName: string
  expiry: Date | null
  availablePieces: number
  packsPerCarton: number
  piecesPerPack: number
  cartonEnabled: boolean
  packEnabled: boolean
}

export async function GET() {
  try {
    const [stocks, sales] = await Promise.all([
      prisma.inventoryStock.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          productName: true,
          carton: true,
          cartonQty: true,
          packsPerCarton: true,
          pack: true,
          packQty: true,
          pcsQty: true,
          pcsCount: true,
          totalPcs: true,
        },
      }),
      prisma.inventorySale.findMany({
        select: {
          productName: true,
          carton: true,
          cartonQty: true,
          packsPerCarton: true,
          pack: true,
          packQty: true,
          pcsQty: true,
          pcsCount: true,
          totalPcs: true,
        },
      }),
    ])

    const balances = new Map<string, ProductBalance>()
    const getBalance = (productName: string) => {
      const existing = balances.get(productName)
      if (existing) return existing
      const balance: ProductBalance = {
        productName,
        expiry: null,
        availablePieces: 0,
        packsPerCarton: 0,
        piecesPerPack: 0,
        cartonEnabled: false,
        packEnabled: false,
      }
      balances.set(productName, balance)
      return balance
    }

    stocks.forEach((stock) => {
      const productName = stock.productName?.trim()
      if (!productName) return
      const balance = getBalance(productName)
      if (!balance.expiry && stock.expiry) balance.expiry = stock.expiry
      const packsPerCarton = stock.packsPerCarton || 0
      const piecesPerPack = stock.pcsCount || 0

      if (stock.carton || packsPerCarton > 0 || (stock.cartonQty || 0) > 0) balance.cartonEnabled = true
      if (stock.pack || piecesPerPack > 0 || (stock.packQty || 0) > 0) balance.packEnabled = true

      if (packsPerCarton > 0 && !balance.packsPerCarton) balance.packsPerCarton = packsPerCarton
      if (piecesPerPack > 0 && !balance.piecesPerPack) balance.piecesPerPack = piecesPerPack

      const cartonQty = stock.cartonQty || 0
      const packQty = stock.packQty || 0
      const pcsQty = stock.pcsQty ?? (cartonQty === 0 && packQty === 0 ? (stock.totalPcs || 0) : 0)

      let derivedPieces = 0
      if (cartonQty > 0) {
        const ppc = packsPerCarton || balance.packsPerCarton || 1
        const pCount = piecesPerPack || balance.piecesPerPack || 1
        derivedPieces += cartonQty * ppc * pCount
      }
      if (packQty > 0) {
        const pCount = piecesPerPack || balance.piecesPerPack || 1
        derivedPieces += packQty * pCount
      }
      derivedPieces += pcsQty

      if (derivedPieces === 0 && (stock.totalPcs || 0) > 0) {
        derivedPieces = stock.totalPcs || 0
      }

      balance.availablePieces += derivedPieces
    })

    sales.forEach((sale) => {
      const productName = sale.productName?.trim()
      if (!productName) return
      const balance = getBalance(productName)
      const packsPerCarton = sale.packsPerCarton || balance.packsPerCarton || 0
      const piecesPerPack = sale.pcsCount || balance.piecesPerPack || 0

      const cartonQty = sale.cartonQty || 0
      const packQty = sale.packQty || 0
      const pcsQty = sale.pcsQty ?? (cartonQty === 0 && packQty === 0 ? (sale.totalPcs || 0) : 0)

      let soldPieces = 0
      if (cartonQty > 0) {
        const ppc = packsPerCarton || 1
        const pCount = piecesPerPack || 1
        soldPieces += cartonQty * ppc * pCount
      }
      if (packQty > 0) {
        const pCount = piecesPerPack || 1
        soldPieces += packQty * pCount
      }
      soldPieces += pcsQty

      if (soldPieces === 0 && (sale.totalPcs || 0) > 0) {
        soldPieces = sale.totalPcs || 0
      }

      balance.availablePieces -= soldPieces
    })

    return NextResponse.json([...balances.values()]
      .map((balance) => {
        const netPieces = Math.max(balance.availablePieces, 0)
        let remaining = netPieces
        let cartons = 0
        let packs = 0

        const ppc = balance.packsPerCarton
        const pCount = balance.piecesPerPack

        if (balance.cartonEnabled && ppc > 0 && pCount > 0) {
          cartons = Math.floor(remaining / (ppc * pCount))
          remaining = remaining % (ppc * pCount)
        }

        if (balance.packEnabled && pCount > 0) {
          packs = Math.floor(remaining / pCount)
          remaining = remaining % pCount
        }

        const pieces = remaining

        return {
          productName: balance.productName,
          expiry: balance.expiry,
          availablePieces: netPieces,
          cartons,
          packs,
          pieces,
          packsPerCarton: ppc,
          piecesPerPack: pCount,
        }
      })
      .sort((left, right) => left.productName.localeCompare(right.productName)))
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Unable to load product availability" }, { status: 500 })
  }
}
