import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    const authUserId = session?.user?.id;

    // Also check query param for fallback/dev compatibility
    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get("userId");
    const userId = (authUserId && authUserId !== "nil") ? authUserId : queryUserId;

    let student = null;

    if (userId && userId !== "nil") {
      student = await prisma.schoolUser.findFirst({
        where: { userId, role: "STUDENT" },
        include: {
          user: true,
          class: true,
          set: true,
          school: true,
        },
      });
    }

    // Fallback for dev mode when user login is disabled
    if (!student) {
      student = await prisma.schoolUser.findFirst({
        where: { role: "STUDENT" },
        include: {
          user: true,
          class: true,
          set: true,
          school: true,
        },
      });
    }

    // If still no student in DB, create/seed a default student with Set & Class
    if (!student) {
      let school = await prisma.school.findFirst();
      if (!school) {
        school = await prisma.school.create({
          data: {
            name: "Default Academy",
            slug: "default-academy",
          },
        });
      }

      let set = await prisma.studentSet.findFirst({
        where: { schoolId: school.id },
      });
      if (!set) {
        set = await prisma.studentSet.create({
          data: {
            schoolId: school.id,
            name: "Achievers Set",
            entryYear: 2014,
            expectedGraduationYear: 2020,
            currentLevel: "SS3",
          },
        });
      }

      let schoolClass = await prisma.schoolClass.findFirst({
        where: { schoolId: school.id },
      });
      if (!schoolClass) {
        schoolClass = await prisma.schoolClass.create({
          data: {
            schoolId: school.id,
            name: "SS 1 B",
            level: "SS1",
            department: "Science",
            year: "2023/2024",
          },
        });
      }

      let user = await prisma.user.findFirst({
        where: { role: "STUDENT" },
      });
      if (!user) {
        user = await prisma.user.create({
          data: {
            name: "Alex Johnson",
            email: "student@school.edu",
            role: "STUDENT",
          },
        });
      }

      student = await prisma.schoolUser.create({
        data: {
          userId: user.id,
          schoolId: school.id,
          role: "STUDENT",
          classId: schoolClass.id,
          setId: set.id,
          entryLevel: "JSS1",
          entryYear: 2014,
        },
        include: {
          user: true,
          class: true,
          set: true,
          school: true,
        },
      });
    }

    return NextResponse.json({
      studentName: student.user?.name || "Student",
      studentEmail: student.user?.email || "",
      set: student.set
        ? {
            id: student.set.id,
            name: student.set.name,
            entryYear: student.set.entryYear,
            expectedGraduationYear: student.set.expectedGraduationYear,
            yearsSpan: `${student.set.entryYear} – ${student.set.expectedGraduationYear}`,
            currentLevel: student.set.currentLevel,
            status: student.set.status,
          }
        : {
            id: null,
            name: "Achievers Set",
            entryYear: 2014,
            expectedGraduationYear: 2020,
            yearsSpan: "2014 – 2020",
            currentLevel: "SS3",
            status: "ACTIVE",
          },
      registeredClass: student.class
        ? {
            id: student.class.id,
            name: student.class.name,
            level: student.class.level || "SS1",
            year: student.class.year || "2023/2024",
            department: student.class.department || "Science",
          }
        : {
            id: null,
            name: "SS 1 B",
            level: "SS1",
            year: "2023/2024",
            department: "Science",
          },
      entryDetails: {
        entryLevel: student.entryLevel || "JSS1",
        entryYear: student.entryYear || 2014,
      },
    });
  } catch (error: any) {
    console.error("Dashboard info error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
