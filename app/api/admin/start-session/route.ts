import { NextResponse } from "next/server";
import { TermName } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sessions = await prisma.academicSession.findMany({
      include: {
        terms: true,
        _count: { select: { classes: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ sessions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, startDate, endDate, copyPreviousClasses } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Academic session name is required (e.g. '2024/2025')" }, { status: 400 });
    }

    const school = await prisma.school.findFirst();
    if (!school) {
      return NextResponse.json({ error: "No school found in DB" }, { status: 400 });
    }

    // Set all existing sessions isCurrent to false
    await prisma.academicSession.updateMany({
      where: { schoolId: school.id },
      data: { isCurrent: false },
    });

    // Create new academic session
    const newSession = await prisma.academicSession.create({
      data: {
        schoolId: school.id,
        name: name.trim(),
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        isCurrent: true,
        terms: {
          create: [
            { name: TermName.FIRST_TERM, status: "ACTIVE" },
            { name: TermName.SECOND_TERM, status: "UPCOMING" },
            { name: TermName.THIRD_TERM, status: "UPCOMING" },
          ],
        },
      },
      include: { terms: true },
    });

    let clonedCount = 0;

    // Clone classes & offerings from previous session if requested
    if (copyPreviousClasses) {
      const prevSession = await prisma.academicSession.findFirst({
        where: {
          schoolId: school.id,
          id: { not: newSession.id },
        },
        orderBy: { createdAt: "desc" },
      });

      const oldClasses = await prisma.schoolClass.findMany({
        where: {
          schoolId: school.id,
          ...(prevSession ? { sessionId: prevSession.id } : {}),
        },
        include: {
          subjectOfferings: true,
        },
      });

      for (const oldClass of oldClasses) {
        // Upsert: if a class with this name+year already exists for this school, skip
        const newClass = await prisma.schoolClass.upsert({
          where: {
            schoolId_name_year: {
              schoolId: school.id,
              name: oldClass.name,
              year: name.trim(),
            },
          },
          update: {
            // Update session link and department in case the admin changed them
            sessionId: newSession.id,
            level: oldClass.level,
            department: oldClass.department,
            classTeacherId: oldClass.classTeacherId,
          },
          create: {
            schoolId: school.id,
            sessionId: newSession.id,
            name: oldClass.name,
            level: oldClass.level,
            department: oldClass.department,
            year: name.trim(),
            classTeacherId: oldClass.classTeacherId,
          },
        });

        clonedCount++;

        // Clone subject offerings for the class (skip if offering already exists)
        if (oldClass.subjectOfferings.length > 0) {
          await prisma.subjectOffering.createMany({
            data: oldClass.subjectOfferings.map((offering) => ({
              schoolId: school.id,
              classId: newClass.id,
              subjectId: offering.subjectId,
            })),
            skipDuplicates: true,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Academic Session '${newSession.name}' created and set to active! ${clonedCount} class(es) carried over for the new session.`,
      session: newSession,
    });
  } catch (error: any) {
    console.error("Start session error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
