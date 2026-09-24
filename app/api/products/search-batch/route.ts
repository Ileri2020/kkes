import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function POST(req: NextRequest) {
  try {
    const { products } = await req.json();

    if (!Array.isArray(products)) {
      return NextResponse.json({ error: "Invalid products list" }, { status: 400 });
    }

    const results = await Promise.all(
      products.map(async (item: { name: string; quantity: number | string; grams?: string; activeIngredients?: string[]; category?: string }) => {
        // Search criteria
        const searchTerms = [item.name.trim()];
        if (item.activeIngredients) searchTerms.push(...item.activeIngredients);
        
        // Find many possible matches
        const options = await prisma.product.findMany({
          where: {
            OR: [
              { name: { contains: item.name.trim(), mode: "insensitive" } },
              item.category ? { category: { name: { contains: item.category, mode: "insensitive" } } } : {},
              item.activeIngredients?.[0] ? { activeIngredients: { some: { name: { contains: item.activeIngredients[0], mode: "insensitive" } } } } : {},
            ]
          },
          include: {
            category: true,
            stock: true,
            brand: true,
            activeIngredients: true,
          },
          take: 5 // Limit options per item to keep UI clean
        });

        return {
          identifiedItem: item,
          options: options.map(opt => ({
            ...opt,
            requestedQuantity: typeof item.quantity === 'string' ? parseInt(item.quantity) || 1 : item.quantity,
            requestedGrams: item.grams
          }))
        };
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Batch search error:", error);
    return NextResponse.json({ error: "Failed to search products" }, { status: 500 });
  }
}
