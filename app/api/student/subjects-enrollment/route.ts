import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ─── GET: Fetch all data needed for the subject enrollment page ───────────────
export async function GET() {
  try {
    const session = await auth();
    const authUserId = session?.user?.id;

    // 1. Get current active academic session
    let currentSession = await prisma.academicSession.findFirst({
      where: { isCurrent: true },
      include: { terms: true },
    });

    if (!currentSession) {
      currentSession = await prisma.academicSession.findFirst({
        orderBy: { createdAt: "desc" },
        include: { terms: true },
      });
    }

    // 2. Find the logged-in student's SchoolUser record
    let student = null;
    if (authUserId && authUserId !== "nil") {
      student = await prisma.schoolUser.findFirst({
        where: { userId: authUserId, role: "STUDENT" },
        include: { class: true, school: true },
      });
    }

    // Dev/fallback: pick the first student in DB when not authenticated
    if (!student) {
      student = await prisma.schoolUser.findFirst({
        where: { role: "STUDENT" },
        include: { class: true, school: true },
      });
    }

    // 3. Available classes — scoped to the current session so the student sees
    //    only this year's class objects (each year has unique class records).
    //    If no session exists yet, fall back to all classes.
    const availableClasses = await prisma.schoolClass.findMany({
      where: currentSession
        ? { sessionId: currentSession.id }
        : undefined,
      orderBy: [{ level: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        level: true,
        department: true,
        year: true,
      },
    });

    // 4. Subjects offered by the student's current class
    let classOfferings: any[] = [];
    if (student?.classId) {
      const offerings = await prisma.subjectOffering.findMany({
        where: { classId: student.classId },
        include: {
          subject: {
            include: { parentSubject: true },
          },
        },
      });
      classOfferings = offerings.map((o) => o.subject);
    }

    // 5. All subjects in this school (used for the borrow table)
    const allSubjects = await prisma.subject.findMany({
      where: student?.schoolId ? { schoolId: student.schoolId } : {},
      include: {
        parentSubject: { select: { id: true, name: true } },
        offerings: { select: { classId: true } },
      },
      orderBy: { name: "asc" },
    });

    // 6. Existing student enrollments for current session
    let enrollments: any[] = [];
    if (student?.id) {
      enrollments = await prisma.studentSubjectEnrollment.findMany({
        where: {
          studentId: student.id,
          ...(currentSession ? { sessionId: currentSession.id } : {}),
        },
        select: { subjectId: true, isBorrowed: true },
      });
    }

    return NextResponse.json({
      studentId: student?.id ?? null,
      classId: student?.classId ?? null,
      currentClass: student?.class ?? null,
      availableClasses,
      classOfferings,
      allSubjects,
      enrollments,
      currentSession: currentSession
        ? { id: currentSession.id, name: currentSession.name }
        : null,
    });
  } catch (error: any) {
    console.error("Subjects enrollment GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST: Save student subject enrollment choices ────────────────────────────
export async function POST(request: Request) {
  try {
    const session = await auth();
    const authUserId = session?.user?.id;

    const body = await request.json();
    const { studentId, classId, selectedSubjectIds, borrowedSubjectIds } = body;

    // Resolve the SchoolUser record: prefer the logged-in user
    let targetStudent = null;
    if (authUserId && authUserId !== "nil") {
      targetStudent = await prisma.schoolUser.findFirst({
        where: { userId: authUserId, role: "STUDENT" },
      });
    }

    // Fallback: explicit studentId (dev / admin)
    if (!targetStudent && studentId) {
      targetStudent = await prisma.schoolUser.findUnique({
        where: { id: studentId },
      });
    }

    // Last resort dev fallback
    if (!targetStudent) {
      targetStudent = await prisma.schoolUser.findFirst({
        where: { role: "STUDENT" },
      });
    }

    if (!targetStudent) {
      return NextResponse.json(
        { error: "Student record not found" },
        { status: 400 }
      );
    }

    const targetStudentId = targetStudent.id;

    // Update student's classId if it changed
    if (classId && classId !== targetStudent.classId) {
      await prisma.schoolUser.update({
        where: { id: targetStudentId },
        data: { classId },
      });
    }

    // Get current academic session
    const currentSession = await prisma.academicSession.findFirst({
      where: { isCurrent: true },
    });
    const sessionId = currentSession?.id ?? null;

    // Clear existing enrollments for this student + session
    await prisma.studentSubjectEnrollment.deleteMany({
      where: {
        studentId: targetStudentId,
        ...(sessionId ? { sessionId } : { sessionId: null }),
      },
    });

    // Build new enrollment records
    const classEnrollments = (selectedSubjectIds ?? []).map(
      (subjectId: string) => ({
        studentId: targetStudentId,
        subjectId,
        sessionId,
        isBorrowed: false,
      })
    );

    const borrowedEnrollments = (borrowedSubjectIds ?? []).map(
      (subjectId: string) => ({
        studentId: targetStudentId,
        subjectId,
        sessionId,
        isBorrowed: true,
      })
    );

    const allEnrollments = [...classEnrollments, ...borrowedEnrollments];

    if (allEnrollments.length > 0) {
      await prisma.studentSubjectEnrollment.createMany({
        data: allEnrollments,
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Enrolled in ${classEnrollments.length} class sub-subjects and ${borrowedEnrollments.length} borrowed sub-subjects.`,
    });
  } catch (error: any) {
    console.error("Subjects enrollment POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
