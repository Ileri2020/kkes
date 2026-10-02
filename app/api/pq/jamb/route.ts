import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const dataDirectory = path.resolve(process.cwd(), "pq", "json");
const subjects = {
  accounts: { label: "Accounts", file: "accounts.json" },
  biology: { label: "Biology", file: "biology.json" },
  chemistry: { label: "Chemistry", file: "chemistry.json" },
  commerce: { label: "Commerce", file: "commerce.json" },
  crk: { label: "CRK", file: "crk.json" },
  economics: { label: "Economics", file: "economics.json" },
  english: { label: "English", file: "english.json" },
  government: { label: "Government", file: "government.json" },
  literature: { label: "Literature", file: "literature.json" },
  mathematics: { label: "Mathematics", file: "mathematics.json" },
  physics: { label: "Physics", file: "physics.json" },
} as const;

type SubjectKey = keyof typeof subjects;
type ExtractedQuestion = {
  year?: number | null;
  questionNumber?: number;
  question?: string;
  options?: unknown;
  option1?: string | null;
  option2?: string | null;
  option3?: string | null;
  option4?: string | null;
  option5?: string | null;
  type?: string;
  passage?: string | null;
  context?: string | null;
  image?: { localUrl?: string | null; cloudinaryUrl?: string | null } | string | null;
};

function questionOptions(question: ExtractedQuestion): string[] {
  const options = Array.isArray(question.options)
    ? question.options
    : [question.option1, question.option2, question.option3, question.option4, question.option5];
  return options.filter((option): option is string => typeof option === "string" && option.trim().length > 0);
}

function isUsableQuestion(question: ExtractedQuestion): boolean {
  return question.type?.toLowerCase() === "jamb"
    && typeof question.year === "number"
    && Number.isInteger(question.year)
    && typeof question.question === "string"
    && question.question.trim().length > 0
    && questionOptions(question).length >= 2;
}

async function readSubjectQuestions(subject: SubjectKey): Promise<ExtractedQuestion[]> {
  const contents = await readFile(path.join(dataDirectory, subjects[subject].file), "utf8");
  const questions: unknown = JSON.parse(contents);
  if (!Array.isArray(questions)) return [];
  return questions.filter((question): question is ExtractedQuestion =>
    typeof question === "object" && question !== null && isUsableQuestion(question as ExtractedQuestion),
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("mode") === "years") {
    const availability = await Promise.all(
      Object.entries(subjects).map(async ([key, subject]) => {
        const data = await readSubjectQuestions(key as SubjectKey);
        const counts = new Map<number, number>();
        for (const question of data) {
          if (question.year !== null && question.year !== undefined) {
            counts.set(question.year, (counts.get(question.year) ?? 0) + 1);
          }
        }
        return {
          key,
          label: subject.label,
          years: [...counts.entries()]
            .sort(([left], [right]) => right - left)
            .map(([year, count]) => ({ year, count })),
        };
      }),
    );
    return Response.json({ subjects: availability }, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const subject = searchParams.get("subject")?.toLowerCase() as SubjectKey | undefined;
  const year = Number(searchParams.get("year"));
  if (!subject || !(subject in subjects) || !Number.isInteger(year)) {
    return Response.json({ error: "Choose a valid JAMB subject and year." }, { status: 400 });
  }

  try {
    const allQuestions = await readSubjectQuestions(subject);
    const yearQuestions = allQuestions.filter((question) => question.year === year);
    const requiredCount = subject === "english" ? 60 : 40;
    if (yearQuestions.length < requiredCount) {
      return Response.json({
        error: `${subjects[subject].label} ${year} has only ${yearQuestions.length} usable questions; ${requiredCount} are required.`,
      }, { status: 422 });
    }

    // Shuffle so repeated practice sessions do not always begin with the same items.
    for (let index = yearQuestions.length - 1; index > 0; index -= 1) {
      const otherIndex = Math.floor(Math.random() * (index + 1));
      [yearQuestions[index], yearQuestions[otherIndex]] = [yearQuestions[otherIndex], yearQuestions[index]];
    }

    const questions = yearQuestions.slice(0, requiredCount).map((question) => {
      const image = typeof question.image === "string" ? question.image : question.image?.localUrl || question.image?.cloudinaryUrl || null;
      return {
        year: question.year,
        questionNumber: question.questionNumber ?? null,
        question: question.question,
        passage: question.passage || question.context || null,
        options: questionOptions(question),
        image,
      };
    });
    return Response.json({ subject: subjects[subject].label, year, questions }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "Unable to load the selected JAMB questions." }, { status: 500 });
  }
}
