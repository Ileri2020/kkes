import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";


export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name || typeof name !== "string" || name.trim().length < 3) {
      return NextResponse.json({ error: "Valid name is required (min 3 characters)" }, { status: 400 });
    }

    // Check if user is already an affiliate
    const existingAffiliate = await prisma.affiliate.findUnique({
      where: { userId: session.user.id }
    });

    if (existingAffiliate) {
      return NextResponse.json({ error: "User is already an affiliate" }, { status: 400 });
    }

    // Check if name is already taken
    const existingName = await prisma.affiliate.findUnique({
      where: { name: name.trim() }
    });

    if (existingName) {
      return NextResponse.json({ error: "Affiliate name already taken" }, { status: 400 });
    }

    // Generate unique affiliate ID
    let affiliateId;
    let attempts = 0;
    do {
      affiliateId = `AFF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      attempts++;
      if (attempts > 10) {
        return NextResponse.json({ error: "Failed to generate unique affiliate ID" }, { status: 500 });
      }
    } while (await prisma.affiliate.findUnique({ where: { affiliateId } }));

    // Create affiliate
    const affiliate = await prisma.affiliate.create({
      data: {
        userId: session.user.id,
        affiliateId,
        name: name.trim()
      }
    });

    return NextResponse.json({
      success: true,
      affiliate: {
        id: affiliate.id,
        affiliateId: affiliate.affiliateId,
        name: affiliate.name
      }
    });
  } catch (error) {
    console.error("Affiliate creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    // Allow unauthenticated requests - just return false for isAffiliate
    if (!session?.user?.id) {
      return NextResponse.json({
        isAffiliate: false,
        affiliate: null
      });
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: session.user.id }
    });

    return NextResponse.json({
      isAffiliate: !!affiliate,
      affiliate
    });
  } catch (error) {
    console.error("Affiliate check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}