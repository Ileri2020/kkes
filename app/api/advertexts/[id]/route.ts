import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { usersession } from "@/session";

const prisma = new PrismaClient();

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await usersession();
    const { id } = await params;
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text, order, active } = await req.json();

    const updated = await prisma.advertext.update({
      where: { id },
      data: { text, order, active },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating advertext:", error);
    return NextResponse.json({ error: "Failed to update advertext" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await usersession();
    const { id } = await params;
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.advertext.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting advertext:", error);
    return NextResponse.json({ error: "Failed to delete advertext" }, { status: 500 });
  }
}
