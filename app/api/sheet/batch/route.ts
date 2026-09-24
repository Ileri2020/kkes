import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const modelMap: Record<string, any> = {
  product: prisma.product,
  category: prisma.category,
  brand: prisma.brand,
  vendor: prisma.vendor,
  activeIngredient: prisma.activeIngredient,
  healthConcern: prisma.healthConcern,
  stock: prisma.stock,
  bulkPrice: prisma.bulkPrice,
  productVendor: prisma.productVendor,
  user: prisma.user,
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { model, operations } = await req.json();
    
    if (!model || !modelMap[model] || !Array.isArray(operations)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }
    
    // Resolve string names for associations (from CSV uploads)
    const resolvedOperations = await Promise.all(operations.map(async (op: any) => {
      if (model === 'product' && (op.type === 'update' || op.type === 'create')) {
        const newData = { ...op.data };
        
        if ('vendor' in newData) {
          const vendorName = newData.vendor;
          delete newData.vendor;
          if (vendorName && typeof vendorName === 'string') {
            const v = await prisma.vendor.upsert({
              where: { name: vendorName },
              update: {},
              create: { name: vendorName }
            });
            if (op.type === 'update') {
              // Update all current productVendors to not be default
              await prisma.productVendor.updateMany({
                where: { productId: op.id },
                data: { isDefault: false }
              });
              await prisma.productVendor.upsert({
                where: { productId_vendorId: { productId: op.id, vendorId: v.id } },
                update: { isDefault: true },
                create: { productId: op.id, vendorId: v.id, costPrice: 0, isDefault: true }
              });
            }
          }
        }
        
        if ('category' in newData) {
          const catName = newData.category;
          delete newData.category;
          if (catName && typeof catName === 'string') {
            const cat = await prisma.category.upsert({
              where: { name: catName },
              update: {},
              create: { name: catName }
            });
            newData.categoryId = cat.id;
          }
        }
        
        if ('brand' in newData) {
          const brandName = newData.brand;
          delete newData.brand;
          if (brandName && typeof brandName === 'string') {
            const b = await prisma.brand.upsert({
              where: { name: brandName },
              update: {},
              create: { name: brandName }
            });
            newData.brandId = b.id;
          }
        }

        // Clean up stock/bulkPrice placeholders that might come from CSV incorrectly mapped, if present
        delete newData.stock;
        delete newData.bulkName;
        delete newData.bulkQty;
        delete newData.bulkPrice;

        return { ...op, data: newData };
      }
      return op;
    }));

    // operations: [{ type: 'update' | 'create' | 'delete', id?, data }]
    const results = await prisma.$transaction(
      resolvedOperations.map((op: any) => {
        if (op.type === 'update') {
          return modelMap[model].update({ where: { id: op.id }, data: op.data });
        } else if (op.type === 'create') {
          return modelMap[model].create({ data: op.data });
        } else if (op.type === 'delete') {
          return modelMap[model].delete({ where: { id: op.id } });
        }
        throw new Error(`Unsupported operation type: ${op.type}`);
      })
    );

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("Batch operation failed:", error);
    return NextResponse.json({ error: error.message || "Batch operation failed" }, { status: 500 });
  }
}