import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Unified Model Map for the entire Sheet System
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

async function logChange(model: string, operation: string, userId: string, recordId: string, changes: any) {
  try {
    await prisma.auditLog.create({
      data: {
        model,
        operation,
        userId,
        recordId,
        changes,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error("Audit log failed:", error);
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const isAdmin = (session?.user as any)?.role === "admin";
  
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const model = searchParams.get("model");
  
  // Optimization: Default limit to 50 for better performance
  const requestedLimit = parseInt(searchParams.get("limit") || "50");
  const limit = isAdmin ? Math.min(requestedLimit, 2000) : Math.min(requestedLimit, 50);
  const offset = parseInt(searchParams.get("offset") || "0");
  const search = searchParams.get("search") || "";
  const details = searchParams.get("details") === "true"; // Lazy load heavy relations

  if (!model || !modelMap[model]) {
    return NextResponse.json({ error: "Invalid model" }, { status: 400 });
  }

  try {
    let data;
    if (model === "product") {
      // Use select for basic data, include heavy relations only when details=true
      const baseSelect = {
        id: true,
        name: true,
        description: true,
        price: true,
        scarce: true,
        requiresPrescription: true,
        numberPcs: true,
        form: true,
        createdAt: true,
        categoryId: true,
        brandId: true,
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        images: true,
      };

      const productSelect: any = {
        ...baseSelect,
      };
      
      if (details) {
        productSelect.activeIngredients = { select: { id: true, name: true } };
        productSelect.stock = { select: { id: true, addedQuantity: true, costPerProduct: true, createdAt: true } };
        productSelect.bulkPrices = { select: { id: true, name: true, quantity: true, price: true } };
        productSelect.vendors = { 
          select: { 
            id: true, 
            costPrice: true, 
            isDefault: true,
            vendor: { select: { id: true, name: true } }
          } 
        };
      }

      const whereClause = search ? {
        name: { contains: search, mode: 'insensitive' as const }
      } : {};

      data = await prisma.product.findMany({
        where: whereClause,
        select: productSelect,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      // Computed fields removed - now handled by client browsers to improve performance
    } else if (model === "stock") {
      data = await prisma.stock.findMany({
        include: { product: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });
    } else if (model === "bulkPrice") {
      data = await prisma.bulkPrice.findMany({
        include: { product: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });
    } else {
      data = await modelMap[model].findMany({
        include: model === "category" || model === "brand" || model === "activeIngredient" 
          ? { _count: { select: { products: true } } } 
          : undefined,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });
    }

    // Also return total count for pagination UI if needed
    const whereClause = search ? {
      name: { contains: search, mode: 'insensitive' as const }
    } : {};
    const total = await modelMap[model].count({ where: whereClause });

    if (model === 'vendor') {
      // include product count for vendor row
      const vendorWithCounts = await prisma.vendor.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { products: true } } }
      });
      return NextResponse.json({ data: vendorWithCounts, total, limit, offset }, {
        headers: {
          'Cache-Control': 'private, max-age=30', // Cache for 30 seconds
        },
      });
    }

    if (model === 'productVendor') {
      const productVendorData = await prisma.productVendor.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true } },
          vendor: { select: { id: true, name: true } }
        }
      });
      return NextResponse.json({ data: productVendorData, total, limit, offset }, {
        headers: {
          'Cache-Control': 'private, max-age=30',
        },
      });
    }

    return NextResponse.json({ data, total, limit, offset }, {
      headers: {
        'Cache-Control': 'private, max-age=30', // Cache for 30 seconds
      },
    });
  } catch (error) {
    console.error("Sheet Fetch Error:", error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { model, id, field, value } = await req.json();
    const prismaModel = modelMap[model];
    if (!prismaModel) return NextResponse.json({ error: "Invalid model" }, { status: 400 });

    let updateData: any = {};

    // --- Complex Relation Handling Logic ---
    if (model === "product") {
      if (field === "categoryId") {
        updateData.category = { connect: { id: value } };
      } else if (field === "brandId") {
        updateData.brand = value ? { connect: { id: value } } : { disconnect: true };
      } else if (field === "activeIngredients") {
        // Value is expected to be an array of ingredient names or IDs
        // Based on your previous logic, using names as stable identifiers for connectOrCreate
        updateData.activeIngredients = { 
          set: [], 
          connectOrCreate: value.map((name: string) => ({ 
            where: { name }, 
            create: { name } 
          })) 
        };
      } else if (field === "price") {
        updateData.price = parseFloat(value) || 0;
      } else {
        updateData[field] = value;
      }
    } else if (model === "stock" || model === "bulkPrice") {
      if (field === "productId") {
        updateData.product = { connect: { id: value } };
      } else if (field === "addedQuantity" || field === "quantity") {
        updateData[field] = parseInt(value) || 0;
      } else if (field === "costPerProduct" || field === "price") {
        updateData[field] = parseFloat(value) || 0;
      } else {
        updateData[field] = value;
      }
    } else if (model === "brand" && field === "order") {
      updateData.order = parseInt(value) || 0;
    } else {
      updateData[field] = value;
    }

    const item = await prismaModel.findUnique({ where: { id }, select: { version: true } });
    if (!item) return NextResponse.json({ error: "Record not found" }, { status: 404 });

    const updated = await prismaModel.update({
      where: { id, version: item.version },
      data: { ...updateData, version: { increment: 1 } },
    });

    // Log the change
    await logChange(model, 'update', session?.user?.id || 'unknown', id, { field, newValue: value });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Sheet Update Error:", error);
    return NextResponse.json({ error: error.message || "Update failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { model, data } = await req.json();
    const prismaModel = modelMap[model];
    if (!prismaModel) return NextResponse.json({ error: "Invalid model" }, { status: 400 });

    // Handle initial relation state for a new empty record
    const created = await prismaModel.create({
      data: data || {}
    });

    return NextResponse.json(created);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const model = searchParams.get("model");
  const id = searchParams.get("id");

  if (!model || !id || !modelMap[model]) return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });

  try {
    await modelMap[model].delete({ where: { id } });
    
    // Log the deletion
    await logChange(model, 'delete', session?.user?.id || 'unknown', id!, null);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
