import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTeacherScope } from "@/lib/teacher-scope";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const scope = await getTeacherScope();
  if (!scope) return NextResponse.json({ error: "Unable to establish a school data scope." }, { status: 500 });

  try {
    const { id } = await params;
    const body = await request.json();
    const current = await prisma.schoolClass.findFirst({ where: { id, schoolId: scope.schoolId } });
    if (!current) return NextResponse.json({ error: "Class not found." }, { status: 404 });

    const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : current.name;
    const year = typeof body.year === "string" ? body.year.trim() || null : current.year;
    const department = typeof body.department === "string" ? body.department.trim() || null : current.department;
    const classTeacherId = body.classTeacherId === null || body.classTeacherId === ""
      ? null
      : typeof body.classTeacherId === "string" ? body.classTeacherId : current.classTeacherId;

    if (!name || name.length > 60) {
      return NextResponse.json({ error: "Enter a class name of 1–60 characters." }, { status: 400 });
    }
    const duplicate = await prisma.schoolClass.findMany({
      where: { schoolId: scope.schoolId, year, id: { not: id } },
      select: { name: true },
    });
    if (duplicate.some((item) => item.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase())) {
      return NextResponse.json({ error: `A class named “${name}” already exists for ${year ?? "this year"}.` }, { status: 409 });
    }
    if (classTeacherId) {
      const teacher = await prisma.user.findUnique({ where: { id: classTeacherId }, select: { id: true } });
      if (!teacher) return NextResponse.json({ error: "Choose an existing class teacher." }, { status: 400 });
    }

    const match = name.match(/^(JSS|SS)\s*(\d+)/i);
    const level = match ? `${match[1].toUpperCase()}${match[2]}` : current.level;
    const schoolClass = await prisma.schoolClass.update({
      where: { id },
      data: { name, year, department, classTeacherId, level },
      include: {
        classTeacher: { select: { id: true, name: true, email: true } },
        subjectOfferings: { where: { schoolId: scope.schoolId }, include: { subject: { select: { id: true, name: true } } } },
      },
    });
    return NextResponse.json({
      class: {
        id: schoolClass.id,
        name: schoolClass.name,
        year: schoolClass.year,
        level: schoolClass.level,
        department: schoolClass.department,
        classTeacher: schoolClass.classTeacher,
        subjects: schoolClass.subjectOfferings.map(({ subject }) => subject),
      },
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "A class with that name already exists for this year." }, { status: 409 });
    }
    console.error("Teacher class update failed:", error);
    return NextResponse.json({ error: "Unable to update the class." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  const scope = await getTeacherScope();
  if (!scope) return NextResponse.json({ error: "Unable to establish a school data scope." }, { status: 500 });

  try {
    const { id } = await params;
    const body = await request.json();

    const schoolClass = await prisma.schoolClass.findFirst({ where: { id, schoolId: scope.schoolId }, select: { id: true } });
    if (!schoolClass) return NextResponse.json({ error: "Class not found." }, { status: 404 });

    const subjectIds: string[] = Array.isArray(body.subjectIds)
      ? [...new Set(body.subjectIds.filter((s: unknown): s is string => typeof s === "string" && Boolean(s.trim())) as string[])]
      : [];

    // Validate all subjectIds belong to this school
    if (subjectIds.length > 0) {
      const validSubjects = await prisma.subject.findMany({
        where: { id: { in: subjectIds }, schoolId: scope.schoolId },
        select: { id: true },
      });
      const validIds = new Set(validSubjects.map((s) => s.id));
      const invalid = subjectIds.filter((sid) => !validIds.has(sid));
      if (invalid.length) {
        return NextResponse.json({ error: "One or more subjects do not belong to this school." }, { status: 400 });
      }
    }

    // Remove offerings not in new list, upsert those that are
    await prisma.subjectOffering.deleteMany({ where: { schoolId: scope.schoolId, classId: id, subjectId: { notIn: subjectIds } } });
    if (subjectIds.length > 0) {
      await Promise.all(
        subjectIds.map((subjectId) =>
          prisma.subjectOffering.upsert({
            where: { classId_subjectId: { classId: id, subjectId } },
            update: {},
            create: { schoolId: scope.schoolId, classId: id, subjectId },
          })
        )
      );
    }

    const updated = await prisma.schoolClass.findFirst({
      where: { id },
      include: {
        classTeacher: { select: { id: true, name: true, email: true } },
        subjectOfferings: { where: { schoolId: scope.schoolId }, include: { subject: { select: { id: true, name: true } } } },
      },
    });

    return NextResponse.json({
      class: {
        id: updated!.id,
        name: updated!.name,
        level: updated!.level,
        year: updated!.year,
        department: updated!.department,
        classTeacher: updated!.classTeacher,
        subjects: updated!.subjectOfferings.map(({ subject }) => subject),
      },
    });
  } catch (error) {
    console.error("Teacher class subject assignment failed:", error);
    return NextResponse.json({ error: "Unable to update class subjects." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const scope = await getTeacherScope();
  if (!scope) return NextResponse.json({ error: "Unable to establish a school data scope." }, { status: 500 });

  try {
    const { id } = await params;
    const schoolClass = await prisma.schoolClass.findFirst({ where: { id, schoolId: scope.schoolId }, select: { id: true } });
    if (!schoolClass) return NextResponse.json({ error: "Class not found." }, { status: 404 });

    await prisma.subjectOffering.deleteMany({ where: { schoolId: scope.schoolId, classId: id } });
    await Promise.all([
      prisma.schoolUser.updateMany({ where: { classId: id }, data: { classId: null } }),
      prisma.test.updateMany({ where: { schoolId: scope.schoolId, classId: id }, data: { classId: null } }),
      prisma.assignment.updateMany({ where: { schoolId: scope.schoolId, classId: id }, data: { classId: null } }),
    ]);
    await prisma.schoolClass.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Teacher class deletion failed:", error);
    return NextResponse.json({ error: "Unable to delete the class." }, { status: 500 });
  }
}
