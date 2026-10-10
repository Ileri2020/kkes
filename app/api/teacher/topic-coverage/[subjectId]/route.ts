import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { getTeacherScope } from "@/lib/teacher-scope";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ subjectId: string }> };

/** GET /api/teacher/topic-coverage/[subjectId]
 *  Returns the sub-subject metadata + all coverage rows ordered by week.
 */
export async function GET(_req: Request, { params }: RouteContext) {
  const scope = await getTeacherScope();
  if (!scope) return NextResponse.json({ error: "Unable to establish a school data scope." }, { status: 500 });

  try {
    const { subjectId } = await params;

    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, schoolId: scope.schoolId, parentSubjectId: { not: null } },
      include: {
        parentSubject: { select: { id: true, name: true } },
        topicCoverages: { orderBy: { week: "asc" } },
      },
    });
    if (!subject) return NextResponse.json({ error: "Sub-subject not found." }, { status: 404 });

    let recommendedTopics: { topic: string | null; subtopics: string[] }[] = [];
    const subjectSlug = subject.parentSubject.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (subjectSlug) {
      try {
        const data = JSON.parse(
          await readFile(path.join(process.cwd(), "pq", "jamb", "topics", `${subjectSlug}.json`), "utf8"),
        );
        recommendedTopics = Array.isArray(data.subject?.recommended_topics)
          ? data.subject.recommended_topics
              .filter((item: unknown) => item && typeof item === "object")
              .map((item: { topic?: unknown; subtopics?: unknown }) => ({
                topic: typeof item.topic === "string" ? item.topic : null,
                subtopics: Array.isArray(item.subtopics)
                  ? item.subtopics.filter((subtopic): subtopic is string => typeof subtopic === "string")
                  : [],
              }))
          : [];
      } catch (error) {
        console.warn(`No JAMB topic recommendations found for ${subject.parentSubject.name}:`, error);
      }
    }

    return NextResponse.json({
      subject: {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        parentSubject: subject.parentSubject,
      },
      coverages: subject.topicCoverages.map((c) => ({
        id: c.id,
        week: c.week,
        topic: c.topic,
        subtopic: c.subtopic,
        covered: c.covered,
        description: c.description,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      recommendedTopics,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Topic coverage detail load failed:", error);
    return NextResponse.json({ error: "Unable to load coverage entries." }, { status: 500 });
  }
}

/** POST /api/teacher/topic-coverage/[subjectId]
 *  Creates a new coverage row. Body: { week, topic, subtopic?, covered?, description? }
 */
export async function POST(request: Request, { params }: RouteContext) {
  const scope = await getTeacherScope();
  if (!scope) return NextResponse.json({ error: "Unable to establish a school data scope." }, { status: 500 });

  try {
    const { subjectId } = await params;
    const body = await request.json();

    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, schoolId: scope.schoolId, parentSubjectId: { not: null } },
      select: { id: true },
    });
    if (!subject) return NextResponse.json({ error: "Sub-subject not found." }, { status: 404 });

    const week = typeof body.week === "number" ? Math.round(body.week) : parseInt(String(body.week), 10);
    const topic = typeof body.topic === "string" ? body.topic.trim() : "";
    const subtopic = typeof body.subtopic === "string" && body.subtopic.trim() ? body.subtopic.trim() : null;
    const covered = typeof body.covered === "boolean" ? body.covered : false;
    const description = typeof body.description === "string" && body.description.trim() ? body.description.trim() : null;

    if (!week || week < 1 || week > 52) {
      return NextResponse.json({ error: "Week must be a number between 1 and 52." }, { status: 400 });
    }
    if (!topic || topic.length > 200) {
      return NextResponse.json({ error: "Topic is required and must be under 200 characters." }, { status: 400 });
    }
    if (subtopic && subtopic.length > 300) {
      return NextResponse.json({ error: "Subtopic must be under 300 characters." }, { status: 400 });
    }

    const existing = await prisma.topicCoverage.findUnique({ where: { subjectId_week: { subjectId, week } } });
    if (existing) {
      return NextResponse.json({ error: `Week ${week} already has a topic assigned.` }, { status: 409 });
    }

    const coverage = await prisma.topicCoverage.create({
      data: { schoolId: scope.schoolId, subjectId, week, topic, subtopic, covered, description },
    });

    return NextResponse.json({ coverage }, { status: 201 });
  } catch (error) {
    console.error("Topic coverage create failed:", error);
    return NextResponse.json({ error: "Unable to create coverage entry." }, { status: 500 });
  }
}
