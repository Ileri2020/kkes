import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { usersession } from "@/session";


export async function GET() {
  try {
    const adverts = await prisma.advertext.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(adverts);
  } catch (error) {
    console.error("Error fetching advertexts:", error);
    return NextResponse.json({ error: "Failed to fetch advertexts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await usersession();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text, order } = await req.json();
    const advert = await prisma.advertext.create({
      data: { text, order: order || 0 },
    });
    return NextResponse.json(advert);
  } catch (error) {
    console.error("Error creating advertext:", error);
    return NextResponse.json({ error: "Failed to create advertext" }, { status: 500 });
  }
}
