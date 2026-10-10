import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTeacherScope } from "@/lib/teacher-scope";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ id: string }> };

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const scope = await getTeacherScope();
  if (!scope) return NextResponse.json({ error: "Unable to establish a school data scope." }, { status: 500 });

  try {
    const { id } = await params;
    const body = await request.json();
    const subject = await prisma.subject.findFirst({ where: { id, schoolId: scope.schoolId } });
    if (!subject) return NextResponse.json({ error: "Subject not found." }, { status: 404 });

    const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : subject.name;
    const code = typeof body.code === "string" ? body.code.trim().replace(/\s+/g, " ").toUpperCase() || null : subject.code;
    const departmentIds = Array.isArray(body.departmentIds)
      ? body.departmentIds.filter((idItem: unknown): idItem is string => typeof idItem === "string" && Boolean(idItem.trim()))
      : subject.departmentIds;
    const parentSubjectId = body.parentSubjectId !== undefined
      ? (typeof body.parentSubjectId === "string" && body.parentSubjectId.trim() ? body.parentSubjectId.trim() : null)
      : subject.parentSubjectId;

    if (!name || name.length > 80) return NextResponse.json({ error: "Enter a subject name of 1–80 characters." }, { status: 400 });
    if (code && code.length > 20) return NextResponse.json({ error: "Subject code must be 20 characters or fewer." }, { status: 400 });
    if (parentSubjectId && parentSubjectId !== subject.parentSubjectId) {
      if (parentSubjectId === id) return NextResponse.json({ error: "A subject cannot be its own parent." }, { status: 400 });
      const parentExists = await prisma.subject.findFirst({ where: { id: parentSubjectId, schoolId: scope.schoolId }, select: { id: true } });
      if (!parentExists) return NextResponse.json({ error: "Selected parent subject does not exist." }, { status: 400 });
    }

    const existing = await prisma.subject.findMany({ where: { schoolId: scope.schoolId, id: { not: id } }, select: { name: true } });
    if (existing.some((item) => normalizeName(item.name) === normalizeName(name))) {
      return NextResponse.json({ error: "That subject or sub-subject already exists in this school." }, { status: 409 });
    }

    const updated = await prisma.subject.update({
      where: { id },
      data: { name, code, departmentIds, parentSubjectId },
      include: {
        departments: { select: { id: true, name: true } },
        parentSubject: { select: { id: true, name: true } },
        subSubjects: { select: { id: true, name: true, code: true, departmentIds: true } },
        offerings: { where: { schoolId: scope.schoolId }, select: { classId: true } },
      },
    });
    return NextResponse.json({
      subject: {
        id: updated.id,
        name: updated.name,
        code: updated.code,
        departmentIds: updated.departmentIds || [],
        departments: updated.departments || [],
        parentSubjectId: updated.parentSubjectId || null,
        parentSubject: updated.parentSubject || null,
        subSubjects: updated.subSubjects || [],
        classIds: (updated.offerings || []).map(({ classId }) => classId),
      }
    });
  } catch (error) {
    console.error("Teacher subject update failed:", error);
    return NextResponse.json({ error: "Unable to update the subject." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const scope = await getTeacherScope();
  if (!scope) return NextResponse.json({ error: "Unable to establish a school data scope." }, { status: 500 });

  try {
    const { id } = await params;
    const subject = await prisma.subject.findFirst({ where: { id, schoolId: scope.schoolId }, select: { id: true } });
    if (!subject) return NextResponse.json({ error: "Subject not found." }, { status: 404 });

    const topics = await prisma.topic.findMany({ where: { subjectId: id }, select: { id: true } });
    const topicIds = topics.map(({ id: topicId }) => topicId);
    await prisma.subjectOffering.deleteMany({ where: { schoolId: scope.schoolId, subjectId: id } });
    if (topicIds.length) {
      await Promise.all([
        prisma.question.updateMany({ where: { topicId: { in: topicIds } }, data: { topicId: null } }),
        prisma.test.updateMany({ where: { topicId: { in: topicIds }, schoolId: scope.schoolId }, data: { topicId: null } }),
        prisma.media.updateMany({ where: { topicId: { in: topicIds }, schoolId: scope.schoolId }, data: { topicId: null } }),
      ]);
      await prisma.topic.deleteMany({ where: { subjectId: id } });
    }
    await prisma.subject.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Teacher subject deletion failed:", error);
    return NextResponse.json({ error: "Unable to delete the subject." }, { status: 500 });
  }
}
