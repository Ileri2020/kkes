"use server";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";


// Unified Model Map for the entire Sheet System
const modelMap: Record<string, any> = {
  product: prisma.product,
  category: prisma.category,
  brand: prisma.brand,
  activeIngredient: prisma.activeIngredient,
  healthConcern: prisma.healthConcern,
  stock: prisma.stock,
  bulkPrice: prisma.bulkPrice,
  user: prisma.user,
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { model, query, filters, sortBy, sortOrder, page = 1, limit = 50 } = await req.json();

    if (!model || !modelMap[model]) {
      return NextResponse.json({ error: "Invalid model" }, { status: 400 });
    }

    const prismaModel = modelMap[model];

    const where: any = {};

    // Text search across multiple fields
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([field, value]) => {
        where[field] = value;
      });
    }

    const [data, total] = await Promise.all([
      prismaModel.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
        include: getIncludesForModel(model)
      }),
      prismaModel.count({ where })
    ]);

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    console.error("Advanced search error:", error);
    return NextResponse.json({ error: error.message || "Search failed" }, { status: 500 });
  }
}

function getIncludesForModel(model: string) {
  switch (model) {
    case 'product':
      return {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        activeIngredients: { select: { id: true, name: true } },
        stock: { select: { id: true, addedQuantity: true } },
        bulkPrices: { select: { id: true, name: true, price: true } },
      };
    case 'stock':
      return { product: { select: { id: true, name: true } } };
    case 'bulkPrice':
      return { product: { select: { id: true, name: true } } };
    default:
      return undefined;
  }
}
