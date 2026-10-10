import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/student/class-offerings?classId=<id>
 *
 * Returns the sub-subjects offered for the given class.
 * Called when a student selects a different class in the subject enrollment page.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    if (!classId) {
      return NextResponse.json(
        { error: "classId query param is required" },
        { status: 400 }
      );
    }

    const offerings = await prisma.subjectOffering.findMany({
      where: { classId },
      include: {
        subject: {
          include: { parentSubject: { select: { id: true, name: true } } },
        },
      },
    });

    const subjects = offerings.map((o) => o.subject);

    return NextResponse.json({ classOfferings: subjects });
  } catch (error: any) {
    console.error("class-offerings GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
