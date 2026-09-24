import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";



export async function GET() {
  try {
    // 1. Update Products
    const products = await prisma.product.findMany();
    let productCount = 0;
    
    for (const product of products) {
      // Assuming existing price is Wholesale (cost * 1.1)
      const cost = product.price / 1.1;
      
      await prisma.product.update({
        where: { id: product.id },
        data: { price: cost } // Now storing the cost in price field
      });
      productCount++;
    }

    // 2. Update Stocks
    const stocks = await prisma.stock.findMany();
    let stockCount = 0;
    
    for (const stock of stocks) {
      // If pricePerProduct exists, update it to cost
      if ((stock as any).pricePerProduct) {
        const cost = ((stock as any).pricePerProduct || 0) / 1.1;
        await prisma.stock.update({
          where: { id: stock.id },
          data: { 
            costPerProduct: cost // Ensure costPerProduct is set
          }
        });
        stockCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Updated ${productCount} products and ${stockCount} stocks. Existing prices were treated as Wholesale (cost * 1.1) to back-calculate the base cost.`,
      details: { productCount, stockCount }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
