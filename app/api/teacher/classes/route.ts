import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAcademicYear, getTeacherScope } from "@/lib/teacher-scope";

export const runtime = "nodejs";

const DEFAULT_CLASSES = [
  { name: "JSS1 A", level: "JSS1" },
  { name: "JSS2 A", level: "JSS2" },
  { name: "JSS3 A", level: "JSS3" },
  { name: "SS1 A", level: "SS1" },
  { name: "SS2 A", level: "SS2" },
  { name: "SS3 A", level: "SS3" },
];

export async function GET() {
  const scope = await getTeacherScope();
  if (!scope) return NextResponse.json({ error: "Unable to establish a school data scope." }, { status: 500 });

  try {
    const existing = await prisma.schoolClass.findMany({
      where: { schoolId: scope.schoolId, year: "2026" },
      select: { id: true, name: true, year: true },
    });
    const byNameAndYear = new Map<string, { id: string; year: string | null }>();
    for (const schoolClass of existing) {
      byNameAndYear.set(`${schoolClass.name.trim().toLocaleLowerCase()}|${schoolClass.year ?? ""}`, {
        id: schoolClass.id,
        year: schoolClass.year,
      });
    }
    for (const defaultClass of DEFAULT_CLASSES) {
      const savedClass = byNameAndYear.get(`${defaultClass.name.toLocaleLowerCase()}|2026`);
      if (savedClass) {
        continue;
      }
      try {
        await prisma.schoolClass.create({
          data: {
            schoolId: scope.schoolId,
            ...defaultClass,
            year: "2026",
            classTeacherId: scope.userId,
          },
        });
      } catch (error) {
        const duplicate = await prisma.schoolClass.findFirst({
          where: { schoolId: scope.schoolId, name: defaultClass.name, year: "2026" },
          select: { id: true },
        });
        if (!duplicate) throw error;
      }
    }

    const [classes, teachers] = await Promise.all([
      prisma.schoolClass.findMany({
        where: { schoolId: scope.schoolId },
        orderBy: { name: "asc" },
        include: {
          classTeacher: { select: { id: true, name: true, email: true } },
          subjectOfferings: { where: { schoolId: scope.schoolId }, include: { subject: { select: { id: true, name: true } } } },
        },
      }),
      prisma.user.findMany({
        where: { role: "TEACHER" },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({
      classes: classes.map(({ id, name, level, year, department, classTeacher, subjectOfferings }) => ({
        id,
        name,
        level,
        year,
        department,
        classTeacher,
        subjects: subjectOfferings.map(({ subject }) => subject),
      })),
      teachers,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Teacher classes load failed:", error);
    return NextResponse.json({ error: "Unable to load classes." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const scope = await getTeacherScope();
  if (!scope) return NextResponse.json({ error: "Unable to establish a school data scope." }, { status: 500 });

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
    const year = typeof body.year === "string" && body.year.trim() ? body.year.trim() : getCurrentAcademicYear();
    const department = typeof body.department === "string" && body.department.trim() ? body.department.trim() : null;
    const classTeacherId = typeof body.classTeacherId === "string" && body.classTeacherId.trim()
      ? body.classTeacherId.trim()
      : null;
    if (!name || name.length > 60) {
      return NextResponse.json({ error: "Enter a class name of 1–60 characters." }, { status: 400 });
    }

    const schoolClasses = await prisma.schoolClass.findMany({
      where: { schoolId: scope.schoolId, year },
      select: { name: true },
    });
    if (schoolClasses.some((schoolClass) => schoolClass.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase())) {
      return NextResponse.json({ error: `A class named “${name}” already exists for ${year}.` }, { status: 409 });
    }

    if (classTeacherId) {
      const teacher = await prisma.user.findUnique({ where: { id: classTeacherId }, select: { id: true } });
      if (!teacher) return NextResponse.json({ error: "Choose an existing class teacher." }, { status: 400 });
    }

    const match = name.match(/^(JSS|SS)\s*(\d+)/i);
    const level = match ? `${match[1].toUpperCase()}${match[2]}` : null;
    const schoolClass = await prisma.schoolClass.create({
      data: { schoolId: scope.schoolId, name, level, year, department, classTeacherId },
      include: { classTeacher: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json({
      class: { ...schoolClass, subjects: [] },
    }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "A class with that name already exists for this year." }, { status: 409 });
    }
    console.error("Teacher class creation failed:", error);
    return NextResponse.json({ error: "Unable to create the class." }, { status: 500 });
  }
}
