import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTeacherScope } from "@/lib/teacher-scope";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ subjectId: string; entryId: string }> };

/** PATCH /api/teacher/topic-coverage/[subjectId]/[entryId]
 *  Updates week, topic, subtopic, covered status, and/or description.
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  const scope = await getTeacherScope();
  if (!scope) return NextResponse.json({ error: "Unable to establish a school data scope." }, { status: 500 });

  try {
    const { subjectId, entryId } = await params;
    const body = await request.json();

    const current = await prisma.topicCoverage.findFirst({
      where: { id: entryId, subjectId, schoolId: scope.schoolId },
    });
    if (!current) return NextResponse.json({ error: "Coverage entry not found." }, { status: 404 });

    const week = body.week !== undefined
      ? (typeof body.week === "number" ? Math.round(body.week) : parseInt(String(body.week), 10))
      : current.week;
    const topic = typeof body.topic === "string" ? body.topic.trim() : current.topic;
    const subtopic = body.subtopic === null
      ? null
      : typeof body.subtopic === "string"
        ? body.subtopic.trim() || null
        : current.subtopic;
    const covered = typeof body.covered === "boolean" ? body.covered : current.covered;
    const description = body.description === null
      ? null
      : typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : current.description;

    if (!week || week < 1 || week > 52) {
      return NextResponse.json({ error: "Week must be between 1 and 52." }, { status: 400 });
    }
    if (!topic || topic.length > 200) {
      return NextResponse.json({ error: "Topic is required and must be under 200 characters." }, { status: 400 });
    }
    if (subtopic && subtopic.length > 300) {
      return NextResponse.json({ error: "Subtopic must be under 300 characters." }, { status: 400 });
    }

    // Check week conflict with another entry
    if (week !== current.week) {
      const conflict = await prisma.topicCoverage.findUnique({ where: { subjectId_week: { subjectId, week } } });
      if (conflict) return NextResponse.json({ error: `Week ${week} is already taken.` }, { status: 409 });
    }

    const updated = await prisma.topicCoverage.update({
      where: { id: entryId },
      data: { week, topic, subtopic, covered, description },
    });

    return NextResponse.json({ coverage: updated });
  } catch (error) {
    console.error("Topic coverage update failed:", error);
    return NextResponse.json({ error: "Unable to update coverage entry." }, { status: 500 });
  }
}

/** DELETE /api/teacher/topic-coverage/[subjectId]/[entryId] */
export async function DELETE(_req: Request, { params }: RouteContext) {
  const scope = await getTeacherScope();
  if (!scope) return NextResponse.json({ error: "Unable to establish a school data scope." }, { status: 500 });

  try {
    const { subjectId, entryId } = await params;

    const entry = await prisma.topicCoverage.findFirst({
      where: { id: entryId, subjectId, schoolId: scope.schoolId },
      select: { id: true },
    });
    if (!entry) return NextResponse.json({ error: "Coverage entry not found." }, { status: 404 });

    await prisma.topicCoverage.delete({ where: { id: entryId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Topic coverage delete failed:", error);
    return NextResponse.json({ error: "Unable to delete coverage entry." }, { status: 500 });
  }
}
