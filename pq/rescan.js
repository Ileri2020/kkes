const {
  QUESTION_START,
  MIN_MULTIPLE_CHOICE_OPTIONS,
  SUBJECT_RESCAN_PROFILES,
  isGroupedQuestionInstruction,
  normalizeSubjectRescanText,
  isAnswerKeyLine,
  isValidQuestionStart,
  findYearRange,
  MIN_QUESTIONS_PER_JAMB_YEAR,
} = require("./config");

const {
  extractSubjectOptions,
  finalizeQuestion,
  isNumberedSubItemLine,
  parsePageText,
  isValidQuestionNumber,
} = require("./parser");

function questionStartMatch(lines, index, subject) {
  const line = lines[index];
  const normalizedStart = line.replace(/^\s*[([{]\s*(?=\d)/, "");
  let direct = normalizedStart.match(QUESTION_START);
  if (direct && !direct[2].trim() && index + 1 < lines.length) {
    direct = [line, direct[1], lines[index + 1]];
  }
  if (isValidQuestionStart(line, direct, subject)) return direct;

  const isolatedNumber = line.match(/^(\d{1,3})\s*[.):]?\s*$/);
  const nextLine = lines[index + 1];
  if (!isolatedNumber || !nextLine) return null;
  const number = Number(isolatedNumber[1]);
  if (number < 1 || number > 100 || /^\d/.test(nextLine) || isAnswerKeyLine(nextLine)) return null;
  return [line, isolatedNumber[1], nextLine];
}

function findQuestionStarts(lines, subject) {
  const profile = SUBJECT_RESCAN_PROFILES[subject] ?? {};
  let currentPrompt = "";
  const starts = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = questionStartMatch(lines, index, subject);
    if (!match || isAnswerKeyLine(lines[index]) || isGroupedQuestionInstruction(subject, match[2])) continue;
    if (/^[A-E]$/i.test(match[2].trim())) continue;
    if (isNumberedSubItemLine(lines, index, subject, currentPrompt)) {
      currentPrompt += ` ${lines[index]}`;
      continue;
    }
    starts.push({ index, number: Number(match[1]), match });
    currentPrompt = match[2];
  }
  return starts;
}

function optionSetQuality(options) {
  return options.reduce((score, option) => {
    const text = String(option).replace(/^[A-E]\.\s*/i, "");
    if (/\b(?:use\s+(?:fig(?:ure)?\.?\s*\d*|the\s+(?:passage|diagram|figure|table|chart))|answer\s+questions?\s+\d+|questions?\s+\d+\s+(?:to|-)\s*\d+|www\.|download\s+the)\b/i.test(text)) {
      return score - 10;
    }
    if (/\b(?:myschoolgist|answer\s+key|answers?\s+key)\b/i.test(text)) return score - 20;
    return score;
  }, 0);
}

function rescanIncompleteQuestions(questions, pageText, subject = questions[0]?.subject ?? "General", options = {}) {
  const profile = SUBJECT_RESCAN_PROFILES[subject] ?? {};
  const lines = pageText.split(/\r?\n/).map((line) => normalizeSubjectRescanText(subject, line)).filter(Boolean);
  const questionStarts = findQuestionStarts(lines, subject);
  const usedLines = new Set();
  const located = [];

  for (const question of questions) {
    if (!isValidQuestionNumber(question.questionNumber)) continue;
    const questionWords = question.question
      .replace(/^\[[^\]]+\]\s*/, "")
      .toLowerCase()
      .match(/[a-z]{3,}/g)?.slice(0, 6) ?? [];
    let best = null;
    let tiedBest = false;
    let matchingStartCount = 0;

    for (const candidate of questionStarts) {
      const index = candidate.index;
      if (usedLines.has(index) || candidate.number !== question.questionNumber) continue;
      matchingStartCount += 1;
      const nextStart = questionStarts.find((start) => start.index > index)?.index ?? lines.length;
      const candidateText = lines.slice(index, nextStart).join(" ").slice(0, 4000).toLowerCase();
      const score = questionWords.filter((word) => candidateText.includes(word)).length;
      const optionCount = extractSubjectOptions(subject, candidateText).length;
      const rank = score * 10 + (profile.preferCompleteOptionCandidate ? Math.min(optionCount, 5) : 0);
      if (!best || rank > best.rank) {
        best = { index, score, rank, optionCount };
        tiedBest = false;
      } else if (rank === best.rank) {
        tiedBest = true;
      }
    }

    const hasUniqueNumberMatch = options.recoverUniqueNumberCandidate !== false && matchingStartCount === 1;
    const hasDistinctCompleteOptions = profile.preferCompleteOptionCandidate
      && best?.optionCount >= MIN_MULTIPLE_CHOICE_OPTIONS
      && questionStarts.filter((candidate) => candidate.number === question.questionNumber).every((candidate) => {
        const nextStart = questionStarts.find((start) => start.index > candidate.index)?.index ?? lines.length;
        return candidate.index === best.index || extractSubjectOptions(subject, lines.slice(candidate.index, nextStart).join(" ")).length < MIN_MULTIPLE_CHOICE_OPTIONS;
      });
    if (best && (!tiedBest || hasDistinctCompleteOptions) && (best.score > 0 || questionWords.length === 0 || hasUniqueNumberMatch || hasDistinctCompleteOptions)) {
      usedLines.add(best.index);
      located.push({ question, index: best.index });
    }
  }

  located.sort((left, right) => left.index - right.index);
  let recoveredCount = 0;
  for (let index = 0; index < located.length; index += 1) {
    const { question, index: start } = located[index];
    const end = questionStarts.find((questionStart) => questionStart.index > start)?.index ?? lines.length;
    const sourceSegment = lines.slice(start, end).join(" ");
    const recoveredOptions = extractSubjectOptions(subject, sourceSegment);
    if (recoveredOptions.length < MIN_MULTIPLE_CHOICE_OPTIONS) continue;
    const hasCompleteOptions = !question.needsRescan && question.options.length >= MIN_MULTIPLE_CHOICE_OPTIONS;
    const improvesOptions = hasCompleteOptions
      && JSON.stringify(recoveredOptions) !== JSON.stringify(question.options)
      && optionSetQuality(recoveredOptions) > optionSetQuality(question.options);
    if (hasCompleteOptions && !improvesOptions) continue;

    question.options = recoveredOptions;
    for (let optionIndex = 1; optionIndex <= 5; optionIndex += 1) {
      delete question[`option${optionIndex}`];
    }
    for (const option of recoveredOptions) {
      const label = option.match(/^([A-E])\./i)?.[1]?.toUpperCase();
      if (label) question[`option${label.charCodeAt(0) - 64}`] = option;
    }
    question.needsRescan = false;
    question.note = question.note
      ?.split(" | ")
      .filter((note) => !note.startsWith("Needs rescan: malformed option set below the required four-choice minimum"))
      .join(" | ") || null;
    recoveredCount += 1;
  }

  return { questions, recoveredCount };
}

function createSubjectReloader(subject) {
  const profile = SUBJECT_RESCAN_PROFILES[subject] ?? {};
  return (questions, pageText) => {
    const normalizedPage = pageText
      .split(/\r?\n/)
      .map((line) => normalizeSubjectRescanText(subject, line))
      .join("\n");
    return rescanIncompleteQuestions(questions, normalizedPage, subject, {
      recoverUniqueNumberCandidate: profile.recoverUniqueNumberCandidate !== false,
    });
  };
}

function recoverInlineGapQuestion(questionNumber, pageText, pageRecord, metadata, year) {
  if (metadata.subject !== "English") return null;
  const markers = [...pageText.matchAll(/(?:\.{2,}|…{1,}|_{2,})\s*(\d{1,3})\s*(?:\.{2,}|…{1,}|_{2,})/g)];
  const matches = markers.filter((match) => Number(match[1]) === questionNumber);
  if (matches.length !== 1) return null;

  const marker = matches[0];
  const start = pageText.lastIndexOf("\n", marker.index ?? 0) + 1;
  const nextMarker = markers.find((candidate) => (candidate.index ?? 0) > (marker.index ?? 0));
  const end = nextMarker?.index ?? pageText.length;
  const chunk = pageText.slice(start, end);
  const markerOffset = (marker.index ?? 0) - start;
  const markerEnd = markerOffset + marker[0].length;
  const sourceText = `${chunk.slice(0, markerOffset)} ${chunk.slice(markerEnd)}`.replace(/\s+/g, " ").trim();
  if (!sourceText) return null;

  const parsed = parsePageText(`${questionNumber}. ${sourceText}`, {
    ...metadata,
    topic: metadata.subject,
    page: pageRecord.page,
    year,
    yearRange: null,
    inferYearsFromResets: false,
    lastQuestionNumber: 0,
  }).questions.find((question) => question.questionNumber === questionNumber);
  if (!parsed) return null;
  return reloadSubjectQuestions([parsed], `${questionNumber}. ${sourceText}`, metadata.subject).questions[0];
}

// Each PDF subject gets its own configured reload closure. The shared recovery
// engine remains conservative, while profile normalization handles subject-
// specific OCR such as wrapped words, bracketed English options, and accented A labels.
const SUBJECT_RELOADERS = Object.freeze(Object.fromEntries(
  Object.keys(SUBJECT_RESCAN_PROFILES).map((subject) => [subject, createSubjectReloader(subject)]),
));

function reloadSubjectQuestions(questions, pageText, subject = questions[0]?.subject ?? "General") {
  const reload = SUBJECT_RELOADERS[subject] ?? createSubjectReloader(subject);
  return reload(questions, pageText);
}

function rescanIncompleteQuestionsAcrossPages(questions, pageRecords, subject = questions[0]?.subject ?? "General") {
  let recoveredCount = 0;
  for (const question of questions) {
    if (!question.needsRescan && (question.options?.length ?? 0) >= MIN_MULTIPLE_CHOICE_OPTIONS) continue;
    if (!Number.isInteger(question._sourcePage)) continue;
    const firstPage = Math.max(1, question._sourcePage - 1);
    const lastPage = question._sourcePage + 2;
    const nearbyText = pageRecords
      .filter((record) => record.page >= firstPage && record.page <= lastPage)
      .map((record) => record.text)
      .join("\n");
    if (!nearbyText) continue;
    const result = reloadSubjectQuestions([question], nearbyText, subject);
    recoveredCount += result.recoveredCount;
  }
  return { questions, recoveredCount };
}

function rescanMissingQuestionNumbers(questions, pageRecords, coverage, metadata) {
  const present = new Set(questions.map((question) => `${question.year ?? "Unknown"}:${question.questionNumber}`));
  const recovered = [];
  const unresolved = [];

  for (const yearCoverage of coverage) {
    if (yearCoverage.year === "Unknown") continue;
    for (const questionNumber of yearCoverage.missingQuestionNumbers) {
      const key = `${yearCoverage.year}:${questionNumber}`;
      if (present.has(key)) continue;
      const candidates = [];
      const searchedSourcePages = [];
      const candidateSourcePages = new Set();

      for (const pageRecord of pageRecords) {
        if (!pageRecord.years.has(yearCoverage.year)) continue;
        searchedSourcePages.push(pageRecord.page);
        const lines = pageRecord.text.split(/\r?\n/).map((line) => normalizeSubjectRescanText(metadata.subject, line)).filter(Boolean);
        const starts = findQuestionStarts(lines, metadata.subject);
        for (const candidateStart of starts) {
          const { index: lineIndex, match } = candidateStart;
          if (candidateStart.number !== questionNumber) continue;
          const end = starts.find((start) => start.index > lineIndex)?.index ?? lines.length;
          const segmentLines = lines.slice(lineIndex, end);
          segmentLines[0] = segmentLines[0].replace(/^\s*[([{]\s*(?=\d)/, "");
          const isolatedNumber = segmentLines[0].match(/^(\d{1,3})\s*[.):]?\s*$/);
          const parseLines = isolatedNumber
            ? [`${isolatedNumber[1]}. ${segmentLines[1] ?? ""}`, ...segmentLines.slice(2)]
            : segmentLines;
          const parsed = parsePageText(parseLines.join("\n"), {
            ...metadata,
            topic: metadata.subject,
            page: pageRecord.page,
            year: yearCoverage.year,
            yearRange: null,
            inferYearsFromResets: false,
            lastQuestionNumber: 0,
          }).questions.find((question) => question.questionNumber === questionNumber);
          if (!parsed) continue;
          candidateSourcePages.add(pageRecord.page);

          const normalized = normalizeSubjectRescanText(metadata.subject, parsed.question);
          const meaningfulWords = normalized.match(/[A-Za-z]{2,}/g) ?? [];
          if (parsed.options.length < MIN_MULTIPLE_CHOICE_OPTIONS && (normalized.length < 14 || meaningfulWords.length < 3)) continue;
          const optionRescan = reloadSubjectQuestions([parsed], parseLines.join("\n"), metadata.subject);
          candidates.push(optionRescan.questions[0]);
        }

        const inlineGapQuestion = recoverInlineGapQuestion(questionNumber, pageRecord.text, pageRecord, metadata, yearCoverage.year);
        if (inlineGapQuestion) {
          candidates.push(inlineGapQuestion);
          candidateSourcePages.add(pageRecord.page);
        }
      }

      if (candidates.length === 1) {
        recovered.push(candidates[0]);
        present.add(key);
      } else {
        unresolved.push({
          year: yearCoverage.year,
          questionNumber,
          matchingSourceCandidates: candidates.length,
          candidateSourcePages: [...candidateSourcePages].sort((left, right) => left - right),
          searchedSourcePages,
        });
      }
    }
  }

  return { questions: [...questions, ...recovered], recovered, unresolved };
}

function parseQuestionsFromText(text, subject, examType) {
  const all = [];
  let context = { subject, examType: examType.toLowerCase(), topic: subject, page: 1, year: null, yearRange: findYearRange(text), deferTrailingQuestion: true, lastQuestionNumber: 0, currentQuestion: null, pendingPassage: null, pendingContext: null, inAnswerKey: false };
  for (const [pageIndex, pageText] of text.split(/\n--\s*\d+\s+of\s+\d+\s*--\n/).entries()) {
    const parsed = parsePageText(pageText, { ...context, page: pageIndex + 1 });
    const rescanned = rescanIncompleteQuestions(parsed.questions, pageText, subject);
    all.push(...rescanned.questions);
    context = { ...context, year: parsed.year, topic: parsed.topic, lastQuestionNumber: parsed.lastQuestionNumber, currentQuestion: parsed.currentQuestion, previousLine: parsed.previousLine, pendingPassage: parsed.pendingPassage, pendingContext: parsed.pendingContext, inAnswerKey: parsed.inAnswerKey };
  }
  if (context.currentQuestion) {
    const q = finalizeQuestion(context.currentQuestion);
    if (q.question && isValidQuestionNumber(q.questionNumber)) all.push(q);
  }
  return all;
}

function detectFileMetadata(file, defaultExamType = "jamb") {
  const normalized = file.toLowerCase();
  const detectedExamType = normalized.includes("waec") ? "waec" : normalized.includes("neco") ? "neco" : normalized.includes("jamb") || normalized.includes("utme") ? "jamb" : defaultExamType;
  const fileBase = file.replace(/[-_]/g, " ").toUpperCase();
  const subjects = [
    ["USE OF ENGLISH", "English"], ["LITERATURE", "Literature"], ["ENGLISH", "English"],
    ["PRINCIPLES OF ACCOUNTS", "Accounts"], ["ACCOUNTS", "Accounts"], ["BIOLOGY", "Biology"],
    ["CHEMISTRY", "Chemistry"], ["PHYSICS", "Physics"], ["MATHEMATICS", "Mathematics"],
    ["COMMERCE", "Commerce"], ["GOVERNMENT", "Government"], ["ECONOMICS", "Economics"], ["CRK", "Crk"],
  ];
  const subject = subjects.find(([label]) => fileBase.includes(label))?.[1] ?? "General";
  return { examType: detectedExamType, subject };
}

function normalizeSubjectFilters(subjects) {
  const knownSubjects = Object.keys(SUBJECT_RESCAN_PROFILES);
  const requested = new Set((subjects ?? []).flatMap((value) => String(value).split(",")).map((value) => value.trim().toLowerCase()).filter(Boolean));
  return knownSubjects.filter((subject) => requested.has(subject.toLowerCase()));
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

function validateQuestionNumberCoverage(questions, examType, yearRange = null, subject = "General") {
  const isJamb = String(examType).toLowerCase() === "jamb";
  const expectedQuestionLimit = isJamb ? (subject === "English" ? 100 : 50) : 60;
  const byYear = new Map();
  for (const question of questions) {
    const year = question.year ?? "Unknown";
    if (!byYear.has(year)) byYear.set(year, new Map());
    if (Number.isInteger(question.questionNumber) && question.questionNumber > 0 && question.questionNumber <= expectedQuestionLimit) {
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
      const minimum = isJamb ? MIN_QUESTIONS_PER_JAMB_YEAR : null;
      const belowMinimum = minimum !== null && year !== "Unknown" && numbers.length < minimum;
      const expectedEnd = Math.min(maximum, expectedQuestionLimit);
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

function getIncompleteOptionSamples(questions, limit = 10) {
  return questions
    .filter((question) => question.needsRescan || (question.options?.length ?? 0) < MIN_MULTIPLE_CHOICE_OPTIONS)
    .slice(0, limit)
    .map((question) => ({
      year: question.year ?? null,
      questionNumber: question.questionNumber,
      sourcePage: question._sourcePage ?? null,
      parsedOptions: question.options?.length ?? 0,
      options: (question.options ?? []).slice(0, 5),
      question: String(question.question ?? "").slice(0, 180),
    }));
}

function getQuestionGapSamples(questions, coverage, limit = 10) {
  const samples = [];
  for (const yearCoverage of coverage) {
    if (samples.length >= limit) break;
    const yearQuestions = questions
      .filter((question) => (question.year ?? "Unknown") === yearCoverage.year && Number.isInteger(question.questionNumber))
      .sort((left, right) => left.questionNumber - right.questionNumber);
    for (const questionNumber of yearCoverage.missingQuestionNumbers) {
      if (samples.length >= limit) break;
      const before = [...yearQuestions].reverse().find((question) => question.questionNumber < questionNumber);
      const after = yearQuestions.find((question) => question.questionNumber > questionNumber);
      const summarize = (question) => question ? ({
        year: question.year ?? null,
        questionNumber: question.questionNumber,
        sourcePage: question._sourcePage ?? null,
        question: String(question.question ?? "").slice(0, 180),
      }) : null;
      samples.push({ year: yearCoverage.year === "Unknown" ? null : yearCoverage.year, unfoundQuestionNumber: questionNumber, before: summarize(before), after: summarize(after) });
    }
  }
  return samples;
}


module.exports = {
  rescanIncompleteQuestions,
  reloadSubjectQuestions,
  rescanIncompleteQuestionsAcrossPages,
  SUBJECT_RELOADERS,
  rescanMissingQuestionNumbers,
  parseQuestionsFromText,
  detectFileMetadata,
  normalizeSubjectFilters,
  summarizeByYear,
  validateQuestionNumberCoverage,
  getIncompleteOptionSamples,
  getQuestionGapSamples,
};
