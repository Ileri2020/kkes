import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const admin = searchParams.get("admin") === "true";
  const userId = searchParams.get("userId");

  let where: any = {};
  if (admin) {
    // Admin sees everything
    where = {};
  } else if (userId && userId !== "nil") {
    // User sees approved OR their own (even if unapproved)
    where = {
      OR: [
        { approved: true },
        { creatorId: userId }
      ]
    };
  } else {
    // Visitor sees only approved
    where = { approved: true };
  }

  const products = await prisma.heavilyDiscountedProduct.findMany({
    where,
    include: { product: true, creator: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { productId, creatorId } = body;
  const newItem = await prisma.heavilyDiscountedProduct.create({
    data: { productId, creatorId, approved: false },
  });
  return NextResponse.json(newItem);
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id, approved } = body;
  const updated = await prisma.heavilyDiscountedProduct.update({
    where: { id },
    data: { approved },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  await prisma.heavilyDiscountedProduct.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
