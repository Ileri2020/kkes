import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTeacherScope } from "@/lib/teacher-scope";

export const runtime = "nodejs";

/** GET /api/teacher/topic-coverage
 *  Returns all sub-subjects (parentSubjectId != null) grouped by parent subject.
 */
export async function GET() {
  const scope = await getTeacherScope();
  if (!scope) return NextResponse.json({ error: "Unable to establish a school data scope." }, { status: 500 });

  try {
    const subSubjects = await prisma.subject.findMany({
      where: { schoolId: scope.schoolId, parentSubjectId: { not: null } },
      orderBy: { name: "asc" },
      include: {
        departments: { select: { id: true, name: true } },
        parentSubject: {
          select: {
            id: true,
            name: true,
            departments: { select: { id: true, name: true } },
          },
        },
        _count: { select: { topicCoverages: true } },
      },
    });

    // Group by parent
    const parentMap = new Map<string, {
      id: string;
      name: string;
      departments: { id: string; name: string }[];
      subSubjects: typeof subSubjects;
    }>();
    for (const sub of subSubjects) {
      if (!sub.parentSubject) continue;
      if (!parentMap.has(sub.parentSubject.id)) {
        parentMap.set(sub.parentSubject.id, {
          id: sub.parentSubject.id,
          name: sub.parentSubject.name,
          departments: sub.parentSubject.departments,
          subSubjects: [],
        });
      }
      parentMap.get(sub.parentSubject.id)!.subSubjects.push(sub);
    }

    const groups = Array.from(parentMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ groups }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Topic coverage index load failed:", error);
    return NextResponse.json({ error: "Unable to load topic coverage data." }, { status: 500 });
  }
}
