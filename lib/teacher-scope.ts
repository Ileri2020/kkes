import { prisma } from "@/lib/prisma";

export async function getTeacherScope() {
  // Temporary development mode: teacher setup/list endpoints are intentionally
  // unauthenticated. Use the first school as the shared scope, creating a local
  // default school when the database has none yet.
  let school = await prisma.school.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!school) {
    const slug = "kith-and-kin-school";
    school = await prisma.school.findUnique({ where: { slug }, select: { id: true } });
    if (!school) {
      try {
        school = await prisma.school.create({
          data: { name: "Kith & Kin School", slug },
          select: { id: true },
        });
      } catch {
        // Another simultaneous setup request may have inserted this school.
        school = await prisma.school.findUnique({ where: { slug }, select: { id: true } });
      }
    }
  }

  return school ? { userId: null, schoolId: school.id } : null;
}

export function getCurrentAcademicYear(date = new Date()) {
  const year = date.getFullYear();
  const startYear = date.getMonth() >= 6 ? year : year - 1;
  return `${startYear}/${startYear + 1}`;
}
