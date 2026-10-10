import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const SUBJECT_MAPPINGS: Record<string, { label: string; dbSubjectNames: string[] }> = {
  accounts: { label: "Accounts", dbSubjectNames: ["Principles of Accounts", "Accounts", "financial accounting"] },
  biology: { label: "Biology", dbSubjectNames: ["Biology"] },
  chemistry: { label: "Chemistry", dbSubjectNames: ["Chemistry"] },
  commerce: { label: "Commerce", dbSubjectNames: ["Commerce"] },
  crk: { label: "CRK", dbSubjectNames: ["CRK", "Christian Religious Knowledge"] },
  economics: { label: "Economics", dbSubjectNames: ["Economics"] },
  english: { label: "English", dbSubjectNames: ["English", "Use of English", "English Language"] },
  government: { label: "Government", dbSubjectNames: ["Government"] },
  literature: { label: "Literature", dbSubjectNames: ["Literature in English", "Literature"] },
  mathematics: { label: "Mathematics", dbSubjectNames: ["Mathematics"] },
  physics: { label: "Physics", dbSubjectNames: ["Physics"] },
};

type SubjectKey = keyof typeof SUBJECT_MAPPINGS;

function extractOptions(q: {
  option1?: string | null;
  option2?: string | null;
  option3?: string | null;
  option4?: string | null;
  option5?: string | null;
  options?: { label: string; text: string }[];
}): string[] {
  if (q.options && q.options.length > 0) {
    return q.options.map((opt) =>
      opt.text.startsWith(opt.label + ".") || opt.text.startsWith(opt.label + " ")
        ? opt.text
        : `${opt.label}. ${opt.text}`
    );
  }
  const opts = [q.option1, q.option2, q.option3, q.option4, q.option5];
  return opts.filter((o): o is string => typeof o === "string" && o.trim().length > 0);
}

function normalizeAnswer(answer: string | null | undefined): string {
  return (answer ?? "")
    .trim()
    .replace(/^[A-E](?:[.)]|\s)+/i, "")
    .trim()
    .toLocaleLowerCase();
}

function isCorrectAnswer(
  selectedIndex: number | null,
  options: string[],
  correctAnswer: string | null | undefined,
): boolean {
  if (selectedIndex === null || selectedIndex < 0 || selectedIndex >= options.length) return false;

  const answer = (correctAnswer ?? "").trim().toUpperCase();
  let correctIndex = -1;
  if (/^[A-E]$/.test(answer)) {
    correctIndex = options.findIndex((option) => option.trim().match(/^([A-E])(?:[.)]|\s)/i)?.[1]?.toUpperCase() === answer);
    if (correctIndex < 0) correctIndex = answer.charCodeAt(0) - "A".charCodeAt(0);
  } else {
    const normalizedAnswer = normalizeAnswer(correctAnswer);
    correctIndex = options.findIndex((option) => normalizeAnswer(option) === normalizedAnswer);
  }
  return correctIndex >= 0 && selectedIndex === correctIndex;
}

async function markQuestionsSeen(userId: string, questionIds: string[], incrementSeenCount = false) {
  await Promise.all(questionIds.map((questionId) =>
    prisma.questionSeen.upsert({
      where: { userId_questionId: { userId, questionId } },
      update: {
        seenAt: new Date(),
        ...(incrementSeenCount ? { seenCount: { increment: 1 } } : {}),
      },
      create: { userId, questionId },
    })
  ));
}

async function getJambResultOwnerId(): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  // Shared anonymous identity is only for local development while auth is disabled.
  // It is a data owner, not an authorization bypass or an admin identity.
  // if (process.env.NODE_ENV === "production") return null;

  const visitor = await prisma.user.upsert({
    where: { email: "visitor@local.test" },
    update: {},
    create: {
      email: "visitor@local.test",
      name: "Development Visitor",
      role: "VISITOR",
      status: "ACTIVE",
    },
    select: { id: true },
  });
  return visitor.id;
}

export async function POST(request: Request) {
  try {
    const userId = await getJambResultOwnerId();
    if (!userId) {
      return NextResponse.json({ error: "Sign in to submit your JAMB exam." }, { status: 401 });
    }

    const body = await request.json();
    const submissionKey = typeof body.submissionKey === "string" ? body.submissionKey.trim() : "";
    const submittedAnswers = Array.isArray(body.answers) ? body.answers : null;
    if (submissionKey.length < 8 || submissionKey.length > 100 || !submittedAnswers || submittedAnswers.length === 0) {
      return NextResponse.json({ error: "A valid exam submission is required." }, { status: 400 });
    }

    const existing = await prisma.jambResult.findFirst({
      where: { userId, submissionKey },
      include: { questionResults: true },
    });
    if (existing) {
      await markQuestionsSeen(userId, existing.questionResults.map((result) => result.questionId));
      return NextResponse.json({
        success: true,
        resultId: existing.id,
        score: existing.score,
        correctCount: existing.correctCount,
        incorrectCount: existing.incorrectCount,
        totalQuestions: existing.totalQuestions,
        questionResults: existing.questionResults.map((result) => ({
          questionId: result.questionId,
          isCorrect: result.isCorrect,
          selectedAnswer: result.selectedAnswer,
          correctAnswer: result.correctAnswer,
        })),
      });
    }

    const byQuestionId = new Map<string, number | null>();
    for (const item of submittedAnswers) {
      if (!item || typeof item.questionId !== "string" || !item.questionId.trim()) continue;
      const answerIndex = item.selectedAnswerIndex;
      byQuestionId.set(
        item.questionId,
        Number.isInteger(answerIndex) && answerIndex >= 0 && answerIndex <= 4 ? answerIndex : null,
      );
    }
    const questionIds = Array.from(byQuestionId.keys());
    if (!questionIds.length || questionIds.length > 250) {
      return NextResponse.json({ error: "The submitted exam must contain between 1 and 250 valid questions." }, { status: 400 });
    }

    const questions = await prisma.question.findMany({
      where: {
        id: { in: questionIds },
        examType: { equals: "jamb", mode: "insensitive" },
      },
      include: { options: { orderBy: { label: "asc" } } },
    });
    if (questions.length !== questionIds.length) {
      return NextResponse.json({ error: "Some submitted questions are unavailable or are not JAMB questions." }, { status: 400 });
    }

    const questionById = new Map<string, (typeof questions)[number]>();
    for (const question of questions) questionById.set(question.id, question);
    const outcomes = questionIds.map((questionId) => {
      const question = questionById.get(questionId)!;
      const selectedIndex = byQuestionId.get(questionId) ?? null;
      const options = extractOptions(question);
      const correct = isCorrectAnswer(selectedIndex, options, question.answer);
      const selectedAnswer = selectedIndex === null ? null : options[selectedIndex] ?? null;
      const correctAnswer = question.answer?.trim() || null;
      return {
        questionId,
        selectedAnswer,
        correctAnswer,
        isCorrect: correct,
        pointsAwarded: correct ? 1 : 0,
      };
    });

    const correctCount = outcomes.filter((outcome) => outcome.isCorrect).length;
    const subjectNames = Array.from(new Set(questions.map((question) => question.subject).filter((value): value is string => Boolean(value))));
    const examYears = Array.from(new Set(questions.map((question) => question.year).filter((value): value is number => value !== null)));
    const result = await prisma.jambResult.create({
      data: {
        userId,
        submissionKey,
        subject: subjectNames.length ? subjectNames.join(", ") : null,
        examYear: examYears.length === 1 ? examYears[0] : null,
        score: correctCount,
        totalQuestions: outcomes.length,
        correctCount,
        incorrectCount: outcomes.length - correctCount,
        questionResults: { create: outcomes },
      },
      include: { questionResults: true },
    });

    await markQuestionsSeen(userId, questionIds, true);

    return NextResponse.json({
      success: true,
      resultId: result.id,
      score: result.score,
      correctCount: result.correctCount,
      incorrectCount: result.incorrectCount,
      totalQuestions: result.totalQuestions,
      questionResults: result.questionResults.map((outcome) => ({
        questionId: outcome.questionId,
        isCorrect: outcome.isCorrect,
        selectedAnswer: outcome.selectedAnswer,
        correctAnswer: outcome.correctAnswer,
      })),
    }, { status: 201 });
  } catch (error) {
    console.error("JAMB submission persistence failed:", error);
    return NextResponse.json({ error: "Unable to save the JAMB exam result. Please retry submission." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");
    const subjectParam = searchParams.get("subject")?.toLowerCase() as SubjectKey | undefined;

    // ── Mode: Availability / Years Breakdown ──────────────────────────────────
    if (mode === "years") {
      const dbQuestions = await prisma.question.groupBy({
        by: ["subject", "year"],
        where: {
          examType: "jamb",
          year: { not: null },
        },
        _count: { id: true },
      });

      const availability = Object.entries(SUBJECT_MAPPINGS).map(([key, config]) => {
        const countsByYear = new Map<number, number>();
        const lowerDbNames = config.dbSubjectNames.map((n) => n.toLowerCase());

        for (const row of dbQuestions) {
          if (!row.subject || row.year === null) continue;
          if (lowerDbNames.includes(row.subject.toLowerCase())) {
            countsByYear.set(row.year, (countsByYear.get(row.year) ?? 0) + row._count.id);
          }
        }

        const years = [...countsByYear.entries()]
          .sort(([a], [b]) => b - a)
          .map(([year, count]) => ({ year, count }));

        return {
          key,
          label: config.label,
          years,
        };
      });

      return NextResponse.json({ subjects: availability }, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    // ── Mode: Topics & Subtopics Tree Breakdown ───────────────────────────────
    if (mode === "topics") {
      if (!subjectParam || !(subjectParam in SUBJECT_MAPPINGS)) {
        return NextResponse.json({ error: "Select a valid subject." }, { status: 400 });
      }
      const config = SUBJECT_MAPPINGS[subjectParam];

      // Fetch grouped topicName & subtopicName question counts
      const rawTopics = await prisma.question.groupBy({
        by: ["topicName", "subtopicName"],
        where: {
          examType: "jamb",
          subject: { in: config.dbSubjectNames, mode: "insensitive" },
        },
        _count: { id: true },
      });

      // Organize into hierarchical Topics -> Subtopics array
      const topicMap = new Map<string, { name: string; count: number; subtopicsMap: Map<string, number> }>();

      for (const row of rawTopics) {
        const topicName = row.topicName?.trim() || "General Topics";
        const subtopicName = row.subtopicName?.trim() || "General Subtopics";
        const count = row._count.id;

        if (!topicMap.has(topicName)) {
          topicMap.set(topicName, {
            name: topicName,
            count: 0,
            subtopicsMap: new Map(),
          });
        }

        const topicEntry = topicMap.get(topicName)!;
        topicEntry.count += count;
        topicEntry.subtopicsMap.set(
          subtopicName,
          (topicEntry.subtopicsMap.get(subtopicName) || 0) + count
        );
      }

      const topicsTree = Array.from(topicMap.values()).map((topic) => ({
        name: topic.name,
        count: topic.count,
        subtopics: Array.from(topic.subtopicsMap.entries()).map(([name, count]) => ({
          name,
          count,
        })).sort((a, b) => a.name.localeCompare(b.name)),
      })).sort((a, b) => a.name.localeCompare(b.name));

      return NextResponse.json({
        subject: config.label,
        topics: topicsTree,
      }, { headers: { "Cache-Control": "no-store" } });
    }

    // ── Mode: Fetch Questions for Subject (Year / Random / Custom) ───────────
    if (!subjectParam || !(subjectParam in SUBJECT_MAPPINGS)) {
      return NextResponse.json(
        { error: "Choose a valid JAMB subject." },
        { status: 400 }
      );
    }

    const config = SUBJECT_MAPPINGS[subjectParam];
    const yearVal = searchParams.get("year");

    // Support dynamic question target limits per subject (e.g., 45 each if English removed, or custom limit)
    const limitParam = searchParams.get("limit") || searchParams.get("count");
    const defaultRequired = subjectParam === "english" ? 60 : 40;
    const requiredCount = limitParam && !isNaN(Number(limitParam))
      ? Math.max(1, Number(limitParam))
      : defaultRequired;

    let whereClause: Record<string, unknown> = {
      examType: "jamb",
      subject: { in: config.dbSubjectNames, mode: "insensitive" },
    };

    if (yearVal && yearVal !== "random" && yearVal !== "custom" && !isNaN(Number(yearVal))) {
      whereClause.year = Number(yearVal);
    } else if (yearVal === "custom" || mode === "custom") {
      const selectedSubtopics = searchParams.getAll("subtopics").flatMap((s) => s.split(",")).filter(Boolean);
      const selectedTopics = searchParams.getAll("topics").flatMap((t) => t.split(",")).filter(Boolean);

      const conditions: Record<string, unknown>[] = [];
      if (selectedTopics.length > 0) {
        conditions.push({ topicName: { in: selectedTopics, mode: "insensitive" } });
      }
      if (selectedSubtopics.length > 0) {
        conditions.push({ subtopicName: { in: selectedSubtopics, mode: "insensitive" } });
      }

      if (conditions.length > 0) {
        whereClause.OR = conditions;
      }
    }

    // Fetch matching questions from Prisma database
    const rawQuestions = await prisma.question.findMany({
      where: whereClause,
      include: {
        options: {
          orderBy: { label: "asc" },
        },
      },
    });

    if (rawQuestions.length === 0) {
      return NextResponse.json(
        {
          error: `No questions found matching the selected criteria for ${config.label}.`,
        },
        { status: 404 }
      );
    }

    // Shuffle questions so repeated practice sessions get randomized order
    const shuffled = [...rawQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const countToPick = Math.min(shuffled.length, requiredCount);
    const selected = shuffled.slice(0, countToPick).map((q) => {
      const options = extractOptions(q);
      const imageStr =
        q.imageUrl ||
        (typeof q.image === "string"
          ? q.image
          : (q.image as { localUrl?: string; cloudinaryUrl?: string })?.cloudinaryUrl ||
            (q.image as { localUrl?: string })?.localUrl ||
            null);

      return {
        id: q.id,
        year: q.year,
        questionNumber: q.questionNumber ?? null,
        question: q.prompt,
        passage: q.passage || q.context || null,
        options,
        image: imageStr,
      };
    });

    return NextResponse.json(
      {
        subject: config.label,
        year: yearVal === "random" ? "Random" : yearVal === "custom" ? "Custom" : Number(yearVal) || "Random",
        totalAvailable: rawQuestions.length,
        questions: selected,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: unknown) {
    console.error("JAMB Questions API Error:", err);
    return NextResponse.json(
      { error: "Unable to load JAMB questions from database." },
      { status: 500 }
    );
  }
}
