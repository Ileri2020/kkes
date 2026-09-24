import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await auth();
    const role = (session?.user as any)?.role;

    if (role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const model = searchParams.get("model") || "product";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    try {
        if (model === "product") {
            const products = await prisma.product.findMany({
                select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                    scarce: true,
                    requiresPrescription: true,
                    category: { select: { name: true } },
                    brand: { select: { name: true } },
                    activeIngredients: { select: { name: true } },
                    stock: { select: { addedQuantity: true } },
                    bulkPrices: { select: { name: true, quantity: true, price: true } }
                },
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'desc' }
            });

            const total = await prisma.product.count();
            const data = products.map(p => ({
                id: p.id,
                name: p.name,
                description: p.description || "",
                price: p.price,
                category: p.category?.name || "",
                brand: p.brand?.name || "",
                ingredients: p.activeIngredients.map(i => i.name).join("; "),
                stockCount: p.stock.reduce((acc, s) => acc + s.addedQuantity, 0),
                bulkPrices: p.bulkPrices.map(b => `${b.name}(${b.quantity}x @ ₦${b.price})`).join("; "),
                scarce: p.scarce || false,
                requiresPrescription: p.requiresPrescription || false
            }));
            return NextResponse.json({ data, total, page, limit });
        }

        if (model === "category") {
            const categories = await prisma.category.findMany({
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'desc' }
            });
            const total = await prisma.category.count();
            return NextResponse.json({ data: categories, total, page, limit });
        }

        if (model === "brand") {
            const brands = await prisma.brand.findMany({
                take: limit,
                skip: offset,
                orderBy: { order: 'asc' }
            });
            const total = await prisma.brand.count();
            return NextResponse.json({ data: brands, total, page, limit });
        }

        if (model === "activeIngredient") {
            const ingredients = await prisma.activeIngredient.findMany({
                take: limit,
                skip: offset,
                orderBy: { name: 'asc' }
            });
            const total = await prisma.activeIngredient.count();
            return NextResponse.json({ data: ingredients, total, page, limit });
        }

        if (model === "stock") {
            const stocks = await prisma.stock.findMany({
                select: {
                    id: true,
                    addedQuantity: true,
                    costPerProduct: true,
                    pricePerProduct: true as any, // Handle potential missing fields gracefully
                    createdAt: true,
                    product: { select: { name: true } }
                },
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'desc' }
            });
            const data = stocks.map(s => ({
                id: s.id,
                product: s.product?.name || "",
                quantity: s.addedQuantity,
                costPrice: s.costPerProduct,
                sellingPrice: (s as any).pricePerProduct,
            }));
            const total = await prisma.stock.count();
            return NextResponse.json({ data: data, total, page, limit });
        }

        // 'all' endpoint restricted to metadata or removed for production safety
        if (model === "all") {
             return NextResponse.json({ error: "Bulk 'all' export is disabled for performance. Export individual models instead." }, { status: 400 });
        }

        return NextResponse.json({ error: "Model not supported for export" }, { status: 400 });
    } catch (error) {
        console.error("Bulk Export Error:", error);
        return NextResponse.json({ error: "Export failed" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    const role = (session?.user as any)?.role;

    if (role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const model = searchParams.get("model") || "product";
    const { data } = await req.json();

    if (!Array.isArray(data)) {
        return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    let updated = 0;
    let created = 0;
    const errors: string[] = [];

    try {
        for (const [index, row] of data.entries()) {
            try {
                if (model === "product") {
                    const { id, name, description, price, category, brand, ingredients, scarce } = row;
                    
                    // Upsert logic
                    const categoryObj = category ? await prisma.category.upsert({
                        where: { name: category },
                        update: {},
                        create: { name: category }
                    }) : null;

                    const brandObj = brand ? await prisma.brand.upsert({
                        where: { name: brand },
                        update: {},
                        create: { name: brand }
                    }) : null;

                    const ingredientList = ingredients ? ingredients.split(";").map((i: string) => i.trim()).filter(Boolean) : [];
                    const ingredientIds: string[] = [];
                    for (const ingName of ingredientList) {
                        const ing = await prisma.activeIngredient.upsert({
                            where: { name: ingName },
                            update: {},
                            create: { name: ingName }
                        });
                        ingredientIds.push(ing.id);
                    }

                    const productData: any = {
                        name,
                        description,
                        price: parseFloat(price),
                        scarce: scarce === "true" || scarce === true,
                        category: categoryObj ? { connect: { id: categoryObj.id } } : undefined,
                        brand: brandObj ? { connect: { id: brandObj.id } } : undefined,
                        activeIngredients: { set: ingredientIds.map(id => ({ id })) }
                    };

                    if (id && id.length === 24) { // MongoDB ObjectId check
                        await prisma.product.update({
                            where: { id },
                            data: productData
                        });
                        updated++;
                    } else {
                        await prisma.product.create({
                            data: productData
                        });
                        created++;
                    }
                }

                if (model === "category") {
                    const { id, name, description, image } = row;
                    if (id && id.length === 24) {
                        await prisma.category.update({ where: { id }, data: { name, description, image } });
                        updated++;
                    } else {
                        await prisma.category.create({ data: { name, description, image } });
                        created++;
                    }
                }

                if (model === "brand") {
                    const { id, name, order } = row;
                    if (id && id.length === 24) {
                        await prisma.brand.update({ where: { id }, data: { name, order: parseInt(order) || 0 } });
                        updated++;
                    } else {
                        await prisma.brand.create({ data: { name, order: parseInt(order) || 0 } });
                        created++;
                    }
                }

                if (model === "activeIngredient") {
                    const { id, name } = row;
                    if (id && id.length === 24) {
                        await prisma.activeIngredient.update({ where: { id }, data: { name } });
                        updated++;
                    } else {
                        await prisma.activeIngredient.create({ data: { name } });
                        created++;
                    }
                }
            } catch (err: any) {
                errors.push(`Row ${index + 1}: ${err.message}`);
            }
        }

        return NextResponse.json({ updated, created, errors });
    } catch (error) {
        console.error("Bulk Import Error:", error);
        return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
}
