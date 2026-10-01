const fs = require("node:fs");
const path = require("node:path");
const { PDFParse } = require("pdf-parse");

const PQ_DIR = path.join(__dirname, "../pq");
const OUTPUT_FILE = path.join(PQ_DIR, "past_questions_db.json");

const QUESTION_START = /^(?:question\s*)?(\d{1,3})(?:\s*[.):]+\s*|\s+)(.*)$/i;
const MIN_QUESTION_NUMBER_FOR_YEAR_RESET = 35;
const MIN_QUESTIONS_PER_JAMB_YEAR = 35;
const OPTION_START = /(?:^|\s|\()([A-Ea-e])\s*[.)]\s*/gi;
const ANSWER_LINE = /^(?:answer|ans(?:wer)?|correct\s+option)\s*[:.)-]?\s*([A-Ea-e])\b(?:\s*[-:]\s*(.*))?/i;
const NOTE_LINE = /^(?:note|explanation|solution)\s*[:.)-]?\s*(.*)/i;
const TOPIC_LINE = /^(?:topic|category)\s*[:.)-]?\s*(.*)/i;
const VISUAL_CUE = /\b(?:fig(?:ure)?\s*\.?\s*\d+|diagram|illustration|graph|map|shown\s+(?:below|above)|picture|photograph)\b/i;
const PASSAGE_HEADER = /^(?:passage|comprehension|read the|in (?:each of )?questions?|use the (?:passage|diagram|table|figure|text|chart|information))/i;

function normalizeSpacedDigits(value) {
  let normalized = value;
  while (/(?<=\d)\s+(?=\d)/.test(normalized)) {
    normalized = normalized.replace(/(?<=\d)\s+(?=\d)/g, "");
  }
  return normalized;
}

function findYearRange(text) {
  const normalized = normalizeSpacedDigits(text.replace(/[–—]/g, "-"));
  const match = normalized.match(/\b((?:19|20)\d{2})\s*-\s*((?:19|20)\d{2})\b/);
  if (!match) return null;
  const start = Number(match[1]);
  const end = Number(match[2]);
  return start <= end && end - start <= 80 ? { start, end } : null;
}

function namedYearFromHeader(line, subject) {
  const normalized = normalizeSpacedDigits(line).replace(/[–—]/g, "-").trim();
  const subjectAliases = {
    Biology: ["Biology"], Chemistry: ["Chemistry"], Commerce: ["Commerce"],
    Crk: ["CRK", "Christian Religious Knowledge"], Economics: ["Economics"],
    English: ["Use of English", "English"], Government: ["Government"],
    Literature: ["Literature", "Literature in English"], Mathematics: ["Mathematics"],
    Physics: ["Physics"], Accounts: ["Accounts", "Principles of Accounts"],
  };
  const aliases = subjectAliases[subject] ?? [subject];
  for (const alias of aliases) {
    const escaped = alias.trim().split(/\s+/).map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+");
    const match = normalized.match(new RegExp(`^${escaped}\\s+((?:19|20)\\d{2})(?!\\d)(?!\\s*[-–—]\\s*(?:19|20)\\d{2})(?:\\s+[^\\r\\n]*)?$`, "i"));
    if (match) return Number(match[1]);
  }
  return null;
}

function yearFromHeader(line, subject, previousLine) {
  const normalized = normalizeSpacedDigits(line).replace(/[–—]/g, "-").trim();
  const namedYear = namedYearFromHeader(normalized, subject);
  if (namedYear) return namedYear;
  const examHeading = normalized.match(/\b(?:UTME|JAMB|WAEC|NECO)\s+((?:19|20)\d{2})\b/i);
  if (examHeading) return Number(examHeading[1]);
  const standaloneMatch = normalized.match(/^(?:(?:YEAR|JAMB|WAEC|NECO)\s*)?((?:19|20)\d{2})\s*$/i);
  if (!standaloneMatch) return null;
  const prior = normalizeSpacedDigits(previousLine ?? "").trim();
  const subjectAliases = {
    Biology: ["Biology"], Chemistry: ["Chemistry"], Commerce: ["Commerce"],
    Crk: ["CRK", "Christian Religious Knowledge"], Economics: ["Economics"],
    English: ["Use of English", "English"], Government: ["Government"],
    Literature: ["Literature", "Literature in English"], Mathematics: ["Mathematics"],
    Physics: ["Physics"], Accounts: ["Accounts", "Principles of Accounts"],
  };
  const subjectLabels = subjectAliases[subject] ?? [subject];
  const isSubjectLabel = subjectLabels.some((label) => prior.toLowerCase() === label.toLowerCase());
  const isExamLabel = /^(?:UTME|JAMB|WAEC|NECO|YEAR)$/i.test(prior);
  return isSubjectLabel || isExamLabel ? Number(standaloneMatch[1]) : null;
}

function createQuestion(number, firstLine, context) {
  let promptText = firstLine.trim();
  if (context.pendingPassage) {
    promptText = `[${context.pendingPassage}] ${promptText}`;
  }
  return {
    year: context.year ?? null,
    questionNumber: number,
    question: promptText,
    image: null,
    type: context.examType,
    subject: context.subject,
    topic: context.topic,
    option1: null,
    option2: null,
    option3: null,
    option4: null,
    option5: null,
    options: [],
    answer: null,
    note: null,
    _sourcePage: context.page,
    _needsImage: VISUAL_CUE.test(firstLine),
  };
}

function finalizeQuestion(question) {
  question.question = question.question.replace(/\s+/g, " ").trim();
  question.note = question.note ? question.note.replace(/\s+/g, " ").trim() : null;
  question._needsImage ||= VISUAL_CUE.test(`${question.question} ${question.options.join(" ")}`);
  if (!question.option5) delete question.option5;
  return question;
}

function parsePageText(text, context) {
  const found = [];
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  let current = context.currentQuestion ?? null;
  let topic = context.topic;
  let previousQuestionNumber = context.lastQuestionNumber ?? 0;
  let currentYear = context.year;
  let inferredYearResets = context.inferredYearResets ?? 0;
  let inAnswerKey = false;
  let pendingPassage = context.pendingPassage || null;

  const finish = () => {
    if (!current) return;
    const question = finalizeQuestion(current);
    if (question.question && (question.options.length > 0 || question.answer)) {
      found.push(question);
    }
    current = null;
  };

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const originalLine = lines[lineIndex];
    const line = originalLine.replace(/[\u200B\uFEFF]/g, "").replace(/\s+/g, " ").trim();
    const previousLine = lines[lineIndex - 1] ?? context.previousLine;
    const lower = line.toLowerCase();
    if (lower.includes("myschoolgist") || /^--\s*\d+\s+of\s+\d+\s*--$/i.test(line)) continue;

    if (/^answer\s+keys?\s*:?\s*$/i.test(line)) {
      finish();
      inAnswerKey = true;
      continue;
    }

    const explicitYear = yearFromHeader(line, context.subject, previousLine);
    if (explicitYear) {
      inAnswerKey = false;
      const isNamedYear = /[A-Za-z]/.test(line);
      if (current && previousQuestionNumber < MIN_QUESTION_NUMBER_FOR_YEAR_RESET) continue;
      if (!isNamedYear && !current && context.page === 1 && context.yearRange && (explicitYear === context.yearRange.start || explicitYear === context.yearRange.end)) continue;
      finish();
      currentYear = explicitYear;
      previousQuestionNumber = 0;
      continue;
    }
    if (inAnswerKey) continue;

    if (PASSAGE_HEADER.test(line) && !current) {
      pendingPassage = line;
      continue;
    }

    const topicMatch = line.match(TOPIC_LINE);
    if (topicMatch && !current) {
      topic = topicMatch[1].trim() || topic;
      continue;
    }

    let numberMatch = line.match(QUESTION_START);
    if (!numberMatch && /^\d{1,3}[\.\):]+$/.test(line) && lineIndex + 1 < lines.length) {
      const num = line.match(/^(\d{1,3})/)[1];
      numberMatch = [line, num, lines[lineIndex + 1]];
      lineIndex += 1;
    }

    if (numberMatch) {
      finish();
      const questionNumber = Number(numberMatch[1]);
      if (context.inferYearsFromResets !== false && questionNumber === 1 && previousQuestionNumber >= MIN_QUESTION_NUMBER_FOR_YEAR_RESET && context.yearRange && currentYear !== null && currentYear < context.yearRange.end) {
        currentYear += 1;
        inferredYearResets += 1;
      }
      currentYear ??= context.yearRange?.start ?? null;
      current = createQuestion(questionNumber, numberMatch[2], {
        year: currentYear,
        examType: context.examType,
        subject: context.subject,
        topic,
        page: context.page,
        pendingPassage,
      });
      pendingPassage = null;
      previousQuestionNumber = questionNumber;
      continue;
    }

    if (!current) continue;
    if (VISUAL_CUE.test(line)) {
      current._needsImage = true;
      current._sourcePage = context.page;
    }

    const answerMatch = line.match(ANSWER_LINE);
    if (answerMatch) {
      current.answer = answerMatch[1].toUpperCase();
      if (answerMatch[2]) current.note = [current.note, answerMatch[2]].filter(Boolean).join(" ");
      continue;
    }

    const noteMatch = line.match(NOTE_LINE);
    if (noteMatch) {
      current.note = noteMatch[1];
      continue;
    }

    const optionMatches = [...line.matchAll(OPTION_START)];
    if (optionMatches.length) {
      const firstOptionAt = optionMatches[0].index ?? 0;
      const leadingText = line.slice(0, firstOptionAt).trim();
      const lastOptionLetter = current.options.at(-1)?.match(/^([A-E])[\.\)]/i)?.[1];
      let expectedLetterIndex = lastOptionLetter ? (lastOptionLetter.toUpperCase().charCodeAt(0) - 64 + 1) : 1;
      const validOptionMatches = [];
      for (let i = 0; i < optionMatches.length; i += 1) {
        const match = optionMatches[i];
        const letter = (match[1] || match[2] || "").toUpperCase();
        const letterIndex = letter.charCodeAt(0) - 64;
        if (letterIndex !== expectedLetterIndex) continue;
        validOptionMatches.push({ match, index: i, letter });
        expectedLetterIndex += 1;
      }

      if (validOptionMatches.length > 0) {
        if (leadingText && current.options.length === 0) current.question += ` ${leadingText}`;
        for (let validIndex = 0; validIndex < validOptionMatches.length; validIndex += 1) {
          const { match, letter } = validOptionMatches[validIndex];
          const start = match.index ?? 0;
          const contentStart = start + match[0].length;
          const end = validIndex + 1 < validOptionMatches.length ? validOptionMatches[validIndex + 1].match.index : line.length;
          const optionText = line.slice(contentStart, end).trim();
          const option = `${letter}. ${optionText}`.trim();
          current.options.push(option);
          current[`option${letter.charCodeAt(0) - 64}`] = option;
        }
        continue;
      }
    }

    if (current.options.length === 0 && !current.answer) {
      current.question += ` ${line}`;
    } else if (current.note) {
      current.note += ` ${line}`;
    } else if (current.options.length > 0 && !current.answer) {
      const lastIdx = current.options.length - 1;
      const lastLetter = current.options[lastIdx].match(/^([A-E])\./)?.[1];
      current.options[lastIdx] += ` ${line}`;
      if (lastLetter) {
        const propName = `option${lastLetter.charCodeAt(0) - 64}`;
        current[propName] = (current[propName] || "") + ` ${line}`;
      }
    }
  }

  return { questions: found, year: currentYear, lastQuestionNumber: previousQuestionNumber, topic, currentQuestion: current, previousLine: lines.at(-1) ?? context.previousLine, inferredYearResets, pendingPassage };
}

function parseQuestionsFromText(text, subject, examType) {
  const all = [];
  let context = { subject, examType: examType.toLowerCase(), topic: subject, page: 1, year: null, yearRange: findYearRange(text), lastQuestionNumber: 0, currentQuestion: null };
  for (const [pageIndex, pageText] of text.split(/\n--\s*\d+\s+of\s+\d+\s*--\n/).entries()) {
    const parsed = parsePageText(pageText, { ...context, page: pageIndex + 1 });
    all.push(...parsed.questions);
    context = { ...context, year: parsed.year, topic: parsed.topic, lastQuestionNumber: parsed.lastQuestionNumber, currentQuestion: parsed.currentQuestion, previousLine: parsed.previousLine, pendingPassage: parsed.pendingPassage };
  }
  if (context.currentQuestion) {
    const q = finalizeQuestion(context.currentQuestion);
    if (q.question && (q.options.length > 0 || q.answer)) all.push(q);
  }
  return all;
}

function detectFileMetadata(file) {
  const normalized = file.toLowerCase();
  const examType = normalized.includes("waec") ? "waec" : normalized.includes("neco") ? "neco" : "jamb";
  const fileBase = file.replace(/[-_]/g, " ").toUpperCase();
  const subjects = [
    ["USE OF ENGLISH", "English"], ["LITERATURE", "Literature"], ["ENGLISH", "English"],
    ["PRINCIPLES OF ACCOUNTS", "Accounts"], ["ACCOUNTS", "Accounts"], ["BIOLOGY", "Biology"],
    ["CHEMISTRY", "Chemistry"], ["PHYSICS", "Physics"], ["MATHEMATICS", "Mathematics"],
    ["COMMERCE", "Commerce"], ["GOVERNMENT", "Government"], ["ECONOMICS", "Economics"], ["CRK", "Crk"],
  ];
  const subject = subjects.find(([label]) => fileBase.includes(label))?.[1] ?? "General";
  return { examType, subject };
}

function summarizeByYear(questions, yearRange) {
  const counts = new Map();
  for (const question of questions) {
    const year = question.year ?? "Unknown";
    counts.set(year, (counts.get(year) ?? 0) + 1);
  }
  if (yearRange) {
    for (let year = yearRange.start; year <= yearRange.end; year += 1) counts.set(year, counts.get(year) ?? 0);
  }
  return [...counts.entries()].sort(([a], [b]) => String(a).localeCompare(String(b), undefined, { numeric: true }));
}

function validateQuestionNumberCoverage(questions, examType, yearRange = null) {
  const byYear = new Map();
  for (const question of questions) {
    const year = question.year ?? "Unknown";
    if (!byYear.has(year)) byYear.set(year, new Map());
    if (Number.isInteger(question.questionNumber) && question.questionNumber > 0) {
      const counts = byYear.get(year);
      counts.set(question.questionNumber, (counts.get(question.questionNumber) ?? 0) + 1);
    }
  }

  if (yearRange) {
    for (let year = yearRange.start; year <= yearRange.end; year += 1) {
      if (!byYear.has(year)) byYear.set(year, new Map());
    }
  }

  return [...byYear.entries()]
    .map(([year, numberCounts]) => {
      const numbers = [...numberCounts.keys()].sort((a, b) => a - b);
      const maximum = numbers.at(-1) ?? 0;
      const missing = [];
      for (let expected = 1; expected <= maximum; expected += 1) {
        if (!numberCounts.has(expected)) missing.push(expected);
      }
      const duplicates = [...numberCounts.entries()].filter(([, count]) => count > 1).map(([number]) => number);
      const minimum = String(examType).toLowerCase() === "jamb" ? MIN_QUESTIONS_PER_JAMB_YEAR : null;
      const belowMinimum = minimum !== null && year !== "Unknown" && numbers.length < minimum;
      const expectedEnd = Math.min(maximum, String(examType).toLowerCase() === "jamb" ? 50 : 60);
      const missingWithinMinimum = [];
      for (let expected = 1; expected <= expectedEnd; expected += 1) {
        if (!numberCounts.has(expected)) missingWithinMinimum.push(expected);
      }
      return {
        year,
        questionCount: numbers.length,
        firstQuestion: numbers[0] ?? null,
        lastQuestion: maximum || null,
        missingQuestionNumbers: missing.length ? missing : missingWithinMinimum,
        duplicateQuestionNumbers: duplicates,
        belowMinimum,
        complete: !belowMinimum && missingWithinMinimum.length === 0 && duplicates.length === 0,
      };
    })
    .sort((a, b) => String(a.year).localeCompare(String(b.year), undefined, { numeric: true }));
}

async function main() {
  const files = fs.readdirSync(PQ_DIR).filter((name) => name.toLowerCase().endsWith(".pdf")).sort((a, b) => a.localeCompare(b));
  console.log("====================================================");
  console.log("🚀 STARTING PAST QUESTIONS PDF SCRAPE");
  console.log(`📁 Input directory: ${PQ_DIR}`);
  console.log(`📄 PDF files found: ${files.length}`);
  console.log("====================================================\n");

  const allQuestions = [];
  const summary = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const filePath = path.join(PQ_DIR, file);
    const metadata = detectFileMetadata(file);
    let parser;
    console.log(`[${index + 1}/${files.length}] 📄 ${file}`);
    try {
      parser = new PDFParse({ data: new Uint8Array(fs.readFileSync(filePath)) });
      const extracted = await parser.getText();
      const yearRange = findYearRange(extracted.pages.slice(0, 2).map((page) => page.text).join("\n"));

      let context = { ...metadata, topic: metadata.subject, page: 1, year: null, yearRange, inferYearsFromResets: true, lastQuestionNumber: 0, currentQuestion: null, previousLine: null, inferredYearResets: 0, pendingPassage: null };
      const questions = [];
      for (const page of extracted.pages) {
        const parsed = parsePageText(page.text, { ...context, page: page.num });
        questions.push(...parsed.questions);
        context = { ...context, year: parsed.year, topic: parsed.topic, lastQuestionNumber: parsed.lastQuestionNumber, currentQuestion: parsed.currentQuestion, previousLine: parsed.previousLine, inferredYearResets: parsed.inferredYearResets, pendingPassage: parsed.pendingPassage };
      }
      if (context.currentQuestion) {
        const q = finalizeQuestion(context.currentQuestion);
        if (q.question && (q.options.length > 0 || q.answer)) questions.push(q);
      }

      const yearCounts = summarizeByYear(questions, yearRange);
      const coverage = validateQuestionNumberCoverage(questions, metadata.examType, yearRange);
      const unknownCount = questions.filter((question) => question.year === null).length;
      const incompleteOptionCount = questions.filter((question) => question.options.length < 2).length;

      console.log(`   ✅ Parsed ${questions.length} questions; ${unknownCount} without a reliably detected year.`);
      summary.push({ file, subject: metadata.subject, type: metadata.examType, pages: extracted.total, questions: questions.length, unknownYear: unknownCount, incompleteOptions: incompleteOptionCount });
      allQuestions.push(...questions);
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
    } finally {
      if (parser) await parser.destroy().catch(() => {});
    }
  }

  writeJsonAtomically(OUTPUT_FILE, allQuestions);
  console.log("\n====================================================");
  console.log(`🎉 SCRAPE COMPLETE: ${allQuestions.length.toLocaleString()} questions extracted.`);
  console.log(`💾 Saved to: ${OUTPUT_FILE}`);
  console.log("====================================================\n");
}

function writeJsonAtomically(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporaryFile = `${file}.tmp`;
  fs.writeFileSync(temporaryFile, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(temporaryFile, file);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { findYearRange, parseQuestionsFromText, parsePageText, detectFileMetadata, validateQuestionNumberCoverage };
