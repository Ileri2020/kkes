import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTeacherScope } from "@/lib/teacher-scope";

export const runtime = "nodejs";

const DEFAULT_SUBJECTS = [
  "Agricultural Science",
  "Basic Science",
  "Basic Technology",
  "Biology",
  "Business Studies",
  "Chemistry",
  "Christian Religious Studies",
  "Civic Education",
  "Commerce",
  "Computer Studies",
  "Economics",
  "English Language",
  "Fine Arts",
  "French",
  "Government",
  "Home Economics",
  "Igbo",
  "Islamic Religious Studies",
  "Literature in English",
  "Mathematics",
  "Music",
  "Physical and Health Education",
  "Physics",
  "Security Education",
  "Social Studies",
  "Yoruba",
];

function normalizeSubject(name: string) {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export async function GET() {
  const scope = await getTeacherScope();
  if (!scope) return NextResponse.json({ error: "Unable to establish a school data scope." }, { status: 500 });

  try {
    const subjects = await prisma.subject.findMany({
      where: { schoolId: scope.schoolId },
      orderBy: { name: "asc" },
      include: {
        departments: { select: { id: true, name: true } },
        parentSubject: { select: { id: true, name: true } },
        subSubjects: { select: { id: true, name: true, code: true, departmentIds: true } },
        offerings: { where: { schoolId: scope.schoolId }, select: { classId: true } },
      },
    });
    return NextResponse.json({
      subjects: subjects.map(({ id, name, code, departmentIds, departments, parentSubjectId, parentSubject, subSubjects, offerings }) => ({
        id,
        name,
        code,
        departmentIds: departmentIds || [],
        departments: departments || [],
        parentSubjectId: parentSubjectId || null,
        parentSubject: parentSubject || null,
        subSubjects: subSubjects || [],
        classIds: offerings.map(({ classId }) => classId),
      })),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Teacher subjects load failed:", error);
    return NextResponse.json({ error: "Unable to load subjects from the question bank." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const scope = await getTeacherScope();
  if (!scope) return NextResponse.json({ error: "Unable to establish a school data scope." }, { status: 500 });

  try {
    const body = await request.json();

    // Batch creation mode
    if (Array.isArray(body.items)) {
      const parentSubjectId = typeof body.parentSubjectId === "string" && body.parentSubjectId.trim()
        ? body.parentSubjectId.trim()
        : null;
      if (parentSubjectId) {
        const parentExists = await prisma.subject.findFirst({
          where: { id: parentSubjectId, schoolId: scope.schoolId },
          select: { id: true },
        });
        if (!parentExists) {
          return NextResponse.json({ error: "Selected parent subject does not exist." }, { status: 400 });
        }
      }

      const existingSubjects = await prisma.subject.findMany({
        where: { schoolId: scope.schoolId },
        select: { name: true },
      });
      const existingNames = new Set(existingSubjects.map((s) => normalizeSubject(s.name)));

      const createdSubjects = [];
      for (const item of body.items) {
        const itemName = typeof item.name === "string" ? item.name.trim().replace(/\s+/g, " ") : "";
        const itemCode = typeof item.code === "string" && item.code.trim()
          ? item.code.trim().replace(/\s+/g, " ").toUpperCase()
          : null;
        const itemDeptIds = Array.isArray(item.departmentIds)
          ? item.departmentIds.filter((idItem: unknown): idItem is string => typeof idItem === "string" && Boolean(idItem.trim()))
          : [];

        if (!itemName || itemName.length > 80 || existingNames.has(normalizeSubject(itemName))) {
          continue;
        }
        existingNames.add(normalizeSubject(itemName));

        const subject = await prisma.subject.create({
          data: {
            schoolId: scope.schoolId,
            name: itemName,
            code: itemCode,
            departmentIds: itemDeptIds,
            parentSubjectId,
          },
          include: {
            departments: { select: { id: true, name: true } },
            parentSubject: { select: { id: true, name: true } },
            subSubjects: { select: { id: true, name: true, code: true, departmentIds: true } },
          },
        });

        createdSubjects.push({
          id: subject.id,
          name: subject.name,
          code: subject.code,
          departmentIds: subject.departmentIds || [],
          departments: subject.departments || [],
          parentSubjectId: subject.parentSubjectId || null,
          parentSubject: subject.parentSubject || null,
          subSubjects: subject.subSubjects || [],
          classIds: [],
        });
      }

      return NextResponse.json({ subjects: createdSubjects }, { status: 201 });
    }

    // Single subject creation mode
    const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
    const code = typeof body.code === "string" && body.code.trim()
      ? body.code.trim().replace(/\s+/g, " ").toUpperCase()
      : null;
    const departmentIds = Array.isArray(body.departmentIds)
      ? body.departmentIds.filter((id: unknown): id is string => typeof id === "string" && Boolean(id.trim()))
      : [];
    const parentSubjectId = typeof body.parentSubjectId === "string" && body.parentSubjectId.trim()
      ? body.parentSubjectId.trim()
      : null;

    if (!name || name.length > 80) {
      return NextResponse.json({ error: "Enter a subject name of 1–80 characters." }, { status: 400 });
    }
    if (code && code.length > 20) {
      return NextResponse.json({ error: "Subject code must be 20 characters or fewer." }, { status: 400 });
    }
    if (parentSubjectId) {
      const parentExists = await prisma.subject.findFirst({
        where: { id: parentSubjectId, schoolId: scope.schoolId },
        select: { id: true },
      });
      if (!parentExists) {
        return NextResponse.json({ error: "Selected parent subject does not exist." }, { status: 400 });
      }
    }

    const existing = await prisma.subject.findMany({ where: { schoolId: scope.schoolId }, select: { id: true, name: true } });
    if (existing.some((subject) => normalizeSubject(subject.name) === normalizeSubject(name))) {
      return NextResponse.json({ error: "That subject or sub-subject already exists in this school." }, { status: 409 });
    }

    const subject = await prisma.subject.create({
      data: {
        schoolId: scope.schoolId,
        name,
        code,
        departmentIds,
        parentSubjectId,
      },
      include: {
        departments: { select: { id: true, name: true } },
        parentSubject: { select: { id: true, name: true } },
        subSubjects: { select: { id: true, name: true, code: true, departmentIds: true } },
      },
    });
    return NextResponse.json({
      subject: {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        departmentIds: subject.departmentIds || [],
        departments: subject.departments || [],
        parentSubjectId: subject.parentSubjectId || null,
        parentSubject: subject.parentSubject || null,
        subSubjects: subject.subSubjects || [],
        classIds: [],
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Teacher subject creation failed:", error);
    return NextResponse.json({ error: "Unable to create the subject." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const scope = await getTeacherScope();
  if (!scope) return NextResponse.json({ error: "Unable to establish a school data scope." }, { status: 500 });

  try {
    const body = await request.json();
    const subjectId = typeof body.subjectId === "string" ? body.subjectId : "";
    const classIds = Array.isArray(body.classIds)
      ? [...new Set(body.classIds.filter((id: unknown): id is string => typeof id === "string"))]
      : null;
    if (!subjectId || !classIds) {
      return NextResponse.json({ error: "A subject and a list of classes are required." }, { status: 400 });
    }

    const [subject, classes] = await Promise.all([
      prisma.subject.findFirst({ where: { id: subjectId, schoolId: scope.schoolId }, select: { id: true } }),
      prisma.schoolClass.findMany({ where: { id: { in: classIds }, schoolId: scope.schoolId }, select: { id: true } }),
    ]);
    if (!subject) return NextResponse.json({ error: "Subject not found for this school." }, { status: 404 });
    if (classes.length !== classIds.length) {
      return NextResponse.json({ error: "One or more selected classes do not belong to this school." }, { status: 400 });
    }

    if (classIds.length) {
      await prisma.subjectOffering.deleteMany({
        where: { schoolId: scope.schoolId, subjectId, classId: { notIn: classIds } },
      });
      await Promise.all(classIds.map((classId) => prisma.subjectOffering.upsert({
        where: { classId_subjectId: { classId, subjectId } },
        update: {},
        create: { schoolId: scope.schoolId, subjectId, classId },
      })));
    } else {
      await prisma.subjectOffering.deleteMany({ where: { schoolId: scope.schoolId, subjectId } });
    }

    return NextResponse.json({ success: true, classIds });
  } catch (error) {
    console.error("Teacher subject assignment failed:", error);
    return NextResponse.json({ error: "Unable to save subject classes." }, { status: 500 });
  }
}
