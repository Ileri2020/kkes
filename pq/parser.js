const {
  QUESTION_START,
  MAX_QUESTION_NUMBER,
  MIN_QUESTION_NUMBER_FOR_YEAR_RESET,
  MIN_MULTIPLE_CHOICE_OPTIONS,
  OPTION_START,
  ANSWER_LINE,
  NOTE_LINE,
  TOPIC_LINE,
  VISUAL_CUE,
  PASSAGE_HEADER,
  CONTEXT_HEADER,
  getSubjectRescanProfile,
  isGroupedQuestionInstruction,
  normalizeSubjectRescanText,
  normalizeOptionLetter,
  normalizeOptionSpacing,
  isAnswerKeyLine,
  isQuestionContentLine,
  isValidQuestionStart,
  findYearRange,
  yearFromHeader,
} = require("./config");

function createQuestion(number, firstLine, context) {
  let promptText = firstLine.trim();
  if (context.pendingPassage) {
    promptText = `[${context.pendingPassage}] ${promptText}`;
  }
  return {
    year: context.year ?? null,
    questionNumber: number,
    pageNumber: Number.isInteger(context.page) ? context.page : null,
    pdfName: context.pdfName ?? null,
    question: promptText,
    image: { localUrl: null, cloudinaryUrl: null },
    type: context.examType,
    subject: context.subject,
    topic: context.topic,
    passage: context.pendingPassage ?? null,
    context: context.pendingContext ?? null,
    option1: null,
    option2: null,
    option3: null,
    option4: null,
    option5: null,
    options: [],
    answer: null,
    note: null,
    needsRescan: false,
    aiReviewed: false,
    needsImage: VISUAL_CUE.test(firstLine),
    _sourcePage: context.page,
    _needsImage: VISUAL_CUE.test(firstLine),
  };
}

function extractEmbeddedOptions(questionText) {
  const normalized = normalizeOptionSpacing(questionText.replace(/\s+/g, " ").trim());
  if (!normalized) return [];
  const matches = [...normalized.matchAll(/(?:^|\s|[([{])([A-Ea-e\u0410\u0412\u0421\u0415\u0430\u0432\u0441\u0435\u00c0\u00c1\u00c2\u00c4\u00e0\u00e1\u00e2\u00e4])(?:\s*[.)]\s*|\s+)(.+?)(?=(?:\s+[A-Ea-e\u0410\u0412\u0421\u0415\u0430\u0432\u0441\u0435\u00c0\u00c1\u00c2\u00c4\u00e0\u00e1\u00e2\u00e4](?:\s*[.)]\s*|\s+))|$)/gi)];
  if (matches.length < MIN_MULTIPLE_CHOICE_OPTIONS) return [];

  const orderedLetters = matches.map((match) => normalizeOptionLetter(match[1]));
  const hasOrderedMinimum = new Set(orderedLetters).size >= MIN_MULTIPLE_CHOICE_OPTIONS
    && orderedLetters.every((letter, index) => index === 0
      || letter.charCodeAt(0) > orderedLetters[index - 1].charCodeAt(0));
  if (!hasOrderedMinimum) return [];

  const byLetter = new Map();
  for (const match of matches) {
    const letter = normalizeOptionLetter(match[1]);
    const text = (match[2] || "").replace(/^[\s:;,-]+|[\s:;,-]+$/g, "").trim();
    if (!text) continue;
    byLetter.set(letter, `${letter}. ${text}`);
  }

  return [...byLetter.entries()].sort(([left], [right]) => left.charCodeAt(0) - right.charCodeAt(0)).map(([, option]) => option);
}

function normalizeQuestionOptions(question) {
  const sources = [];
  if (Array.isArray(question.options) && question.options.length) sources.push(question.options);
  const directOptions = [question.option1, question.option2, question.option3, question.option4, question.option5].filter(Boolean);
  if (directOptions.length) sources.push(directOptions);
  if (question.question) {
    const embedded = extractEmbeddedOptions(question.question);
    if (embedded.length >= MIN_MULTIPLE_CHOICE_OPTIONS) sources.push(embedded);
  }

  for (const candidate of sources) {
    const normalized = splitStoredOptions(candidate);
    if (normalized.length >= MIN_MULTIPLE_CHOICE_OPTIONS) return normalized;
  }

  return [];
}

function trimOptionAtSectionBoundary(value) {
  const boundary = value.search(/\b(?:use\s+(?:fig(?:ure)?\.?\s*\d*|the\s+(?:passage|diagram|figure|table|chart))|in\s+each\s+of\s+the\s+questions?\s+\d+|answer\s+questions?\s+\d+)\b/i);
  return (boundary >= 0 ? value.slice(0, boundary) : value).trim().replace(/[.;,]+$/, "").trim();
}

function extractSubjectOptions(subject, sourceText) {
  const normalized = normalizeSubjectRescanText(subject, sourceText);
  const profile = getSubjectRescanProfile(subject);
  if (profile.recoverOutOfOrderOptions) {
    let markedOptions = [...normalized.matchAll(/(?:^|\s|[([{])([A-E])\s*([.)])\s*/g)];
    const repeatedOptionAStarts = markedOptions
      .map((match, index) => ({ match, index }))
      .filter(({ match, index }) => match[1] === "A" && index > 0
        && markedOptions.slice(index).some((candidate) => candidate[1] === "D" || candidate[1] === "E"));
    if (repeatedOptionAStarts.length) {
      markedOptions = markedOptions.slice(repeatedOptionAStarts.at(-1).index);
    }
    const explicitlyMarked = new Map();
    const markedEntries = [];
    for (let index = 0; index < markedOptions.length; index += 1) {
      const match = markedOptions[index];
      const letter = match[1];
      const start = (match.index ?? 0) + match[0].length;
      const end = index + 1 < markedOptions.length ? markedOptions[index + 1].index : normalized.length;
      const text = trimOptionAtSectionBoundary(normalized.slice(start, end));
      if (text) markedEntries.push({ letter, text });
      if (text && !explicitlyMarked.has(letter)) explicitlyMarked.set(letter, `${letter}. ${text}`);
    }
    if (explicitlyMarked.size >= MIN_MULTIPLE_CHOICE_OPTIONS) {
      return [...explicitlyMarked.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([, option]) => option);
    }
    const repairedLetters = [];
    let expectedLetter = "A";
    for (const [index, { letter }] of markedEntries.entries()) {
      if (letter === expectedLetter) {
        repairedLetters.push(letter);
        expectedLetter = String.fromCharCode(expectedLetter.charCodeAt(0) + 1);
      } else if (letter < expectedLetter && markedEntries.length <= 5) {
        repairedLetters.push(expectedLetter);
        expectedLetter = String.fromCharCode(expectedLetter.charCodeAt(0) + 1);
      } else if (letter > expectedLetter && markedEntries.slice(index + 1).some((entry) => entry.letter === letter)) {
        repairedLetters.push(expectedLetter);
        expectedLetter = String.fromCharCode(expectedLetter.charCodeAt(0) + 1);
      } else {
        repairedLetters.length = 0;
        break;
      }
    }
    const repeatedLabelsAreRecoverable = markedEntries.length >= MIN_MULTIPLE_CHOICE_OPTIONS
      && repairedLetters.length === markedEntries.length
      && repairedLetters.at(-1) >= "D"
      && markedEntries.some(({ letter }, index) => letter !== repairedLetters[index]);
    if (profile.repairRepeatedOptionLabels && repeatedLabelsAreRecoverable) {
      return markedEntries.map(({ text }, index) => `${repairedLetters[index]}. ${text}`);
    }
  }

  if (profile.recoverWrappedOptionLabels) {
    const label = "[A-EАВСЕÀÁÂÄàáâä]";
    const quoteDelimiter = profile.recoverQuotedOptionLabels ? String.raw`|["'“”‘’]+\s*` : "";
    const extraDelimiters = [
      ...(profile.recoverColonDashOptions ? [String.raw`\s*[:–—-]\s*`] : []),
      ...(profile.recoverEqualsDelimitedOptions ? [String.raw`\s*=\s*`] : []),
      ...(quoteDelimiter ? [quoteDelimiter] : []),
    ].join("|");
    const delimiter = `(?:\\s*[.)]\\s*|\\s*[\\])}]\\s*|\\s+${extraDelimiters ? `|${extraDelimiters}` : ""})`;
    const markerPattern = new RegExp(`(?:^|\\s|[([{])(${label})${delimiter}`, "gi");
    let markers = [...normalized.matchAll(markerPattern)].map((match) => ({
      letter: normalizeOptionLetter(match[1]),
      start: match.index ?? 0,
      contentStart: (match.index ?? 0) + match[0].length,
    }));
    const laterOptionSetStarts = markers
      .map((marker, index) => ({ marker, index }))
      .filter(({ marker, index }) => marker.letter === "A" && index > 0
        && markers.slice(index).some((candidate) => candidate.letter === "D" || candidate.letter === "E"));
    if (laterOptionSetStarts.length) markers = markers.slice(laterOptionSetStarts.at(-1).index);

    const wrappedOptions = new Map();
    for (let index = 0; index < markers.length; index += 1) {
      const marker = markers[index];
      const end = markers[index + 1]?.start ?? normalized.length;
      const text = trimOptionAtSectionBoundary(normalized.slice(marker.contentStart, end));
      if (text && !wrappedOptions.has(marker.letter)) wrappedOptions.set(marker.letter, `${marker.letter}. ${text}`);
    }
    if (wrappedOptions.size >= MIN_MULTIPLE_CHOICE_OPTIONS) {
      return [...wrappedOptions.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([, option]) => option);
    }
  }

  const embedded = extractEmbeddedOptions(normalized);
  if (embedded.length >= MIN_MULTIPLE_CHOICE_OPTIONS) return embedded;

  const stored = splitStoredOptions([normalized]);
  const ordered = stored.map((option) => option.match(/^([A-E])\./i)?.[1]?.toUpperCase()).join("");
  if (new Set(ordered).size >= MIN_MULTIPLE_CHOICE_OPTIONS
    && [...ordered].every((letter, index) => index === 0 || letter > ordered[index - 1])
  ) return stored;

  return [];
}

function finalizeQuestion(question) {
  question.question = question.question.replace(/\s+/g, " ").trim();
  question.note = question.note ? question.note.replace(/\s+/g, " ").trim() : null;
  question.passage = question.passage ? question.passage.replace(/\s+/g, " ").trim() : null;
  question.context = question.context ? question.context.replace(/\s+/g, " ").trim() : null;
  question._needsImage ||= VISUAL_CUE.test(`${question.question} ${question.options.join(" ")}`);
  const hasImage = typeof question.image === "string"
    ? Boolean(question.image)
    : Boolean(question.image?.localUrl || question.image?.cloudinaryUrl);
  question.aiReviewed ??= false;
  question.needsImage = Boolean(question._needsImage && !hasImage);

  const normalizedOptions = normalizeQuestionOptions(question);
  if (normalizedOptions.length >= MIN_MULTIPLE_CHOICE_OPTIONS) {
    question.options = normalizedOptions;
    for (let index = 1; index <= 5; index += 1) {
      question[`option${index}`] = null;
    }
    for (const option of normalizedOptions) {
      const label = option.match(/^([A-E])\./i)?.[1]?.toUpperCase();
      if (label) question[`option${label.charCodeAt(0) - 64}`] = option;
    }
    question.needsRescan = false;
  } else {
    question.needsRescan = true;
    const optionCount = [question.option1, question.option2, question.option3, question.option4, question.option5].filter(Boolean).length;
    if (question.question && (question.question.match(/\b[A-E]\b/i) || optionCount > 0)) {
      question.note = [question.note, `Needs rescan: malformed option set below the required four-choice minimum (${Math.max(optionCount, question.options.length || 0)} parsed).`].filter(Boolean).join(" | ");
    }
  }

  if (!question.option5) delete question.option5;
  return question;
}

function findInlineQuestionStart(line, current, subject) {
  if (!current || !getSubjectRescanProfile(subject).recoverInlineQuestionStarts) return -1;
  const markers = /(?:^|\s)(\d{1,3})[.)]\s*(?=[A-Z“"'(])/g;
  for (const match of line.matchAll(markers)) {
    const number = Number(match[1]);
    if (number <= current.questionNumber || number > 100) continue;
    const markerOffset = (match.index ?? 0) + match[0].search(/\d/);
    const prefixLabels = new Set([...normalizeOptionSpacing(line.slice(0, markerOffset)).matchAll(/(?:^|\s|[([{])([A-E])\s*[.)]\s+/gi)]
      .map((option) => normalizeOptionLetter(option[1])));
    if (current.options.length < 2 && prefixLabels.size < 2) continue;
    const candidate = line.slice(markerOffset).replace(/^\d{1,3}[.)]\s*/, "");
    const words = candidate.match(/[A-Za-z]{2,}/g) ?? [];
    if (words.length < 4 || isGroupedQuestionInstruction(subject, candidate)) continue;
    if (isNumberedSubItemLine([current.question, `${number}. ${candidate}`], 1, subject, current.question)) continue;
    return markerOffset;
  }
  return -1;
}

function splitStoredOptions(values) {
  const byLetter = new Map();

  for (const value of values) {
    if (typeof value !== "string") continue;
    const normalizedValue = normalizeOptionSpacing(value);
    const matches = [...normalizedValue.matchAll(OPTION_START)];
    if (!matches.length) continue;

    const accepted = [];
    let segmentEnd = value.length;
    let highestLetter = 0;

    for (const match of matches) {
      const letter = normalizeOptionLetter(match[1]);
      const letterIndex = letter.charCodeAt(0) - 64;
      const explicitPunctuation = Boolean(match[2]);
      const atStart = (match.index ?? 0) === 0;
      if (letterIndex < 1 || letterIndex > 5) continue;
      if (letterIndex === 1 && highestLetter > 1) {
        segmentEnd = match.index ?? value.length;
        break;
      }
      if (atStart && highestLetter === 0) {
        accepted.push({ match, letter, letterIndex });
        highestLetter = letterIndex;
        continue;
      }
      if (letterIndex <= highestLetter) continue;
      if (letterIndex !== highestLetter + 1 && !explicitPunctuation) continue;
      accepted.push({ match, letter, letterIndex });
      highestLetter = letterIndex;
    }

    for (let index = 0; index < accepted.length; index += 1) {
      const { match, letter, letterIndex } = accepted[index];
      const start = (match.index ?? 0) + match[0].length;
      const end = index + 1 < accepted.length ? accepted[index + 1].match.index : segmentEnd;
      const text = normalizedValue.slice(start, end).trim();
      if (text && !byLetter.has(letterIndex)) byLetter.set(letterIndex, `${letter}. ${text}`);
    }
  }

  return [...byLetter.entries()].sort(([left], [right]) => left - right).map(([, option]) => option).filter((option) => /^(?:[A-E]\.)/i.test(option));
}

function parsePageText(text, context) {
  const found = [];
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  let current = context.currentQuestion ?? null;
  let topic = context.topic;
  let previousQuestionNumber = context.lastQuestionNumber ?? 0;
  let currentYear = context.year;
  let inferredYearResets = context.inferredYearResets ?? 0;
  let inAnswerKey = context.inAnswerKey ?? false;
  let pendingPassage = context.pendingPassage || null;
  let pendingContext = context.pendingContext || null;

  if (inAnswerKey && lines.some((line) => isQuestionContentLine(line, context.subject))) inAnswerKey = false;

  const finish = () => {
    if (!current) return;
    const question = finalizeQuestion(current);
    if (question.question && isValidQuestionNumber(question.questionNumber)) {
      found.push(question);
    }
    current = null;
  };

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const originalLine = lines[lineIndex];
    let line = originalLine.replace(/[\u200B\uFEFF]/g, "").replace(/\s+/g, " ").trim();
    const previousLine = lines[lineIndex - 1] ?? context.previousLine;
    const lower = line.toLowerCase();
    if (lower.includes("myschoolgist") || /^--\s*\d+\s+of\s+\d+\s*--$/i.test(line)) continue;

    const inlineQuestionStart = findInlineQuestionStart(line, current, context.subject);
    if (inlineQuestionStart > 0) {
      const trailingQuestion = line.slice(inlineQuestionStart).trim();
      lines.splice(lineIndex + 1, 0, trailingQuestion);
      line = line.slice(0, inlineQuestionStart).trim();
    }

    if (isAnswerKeyLine(line)) {
      finish();
      inAnswerKey = true;
      continue;
    }

    const lineQuestionMatch = line.match(QUESTION_START);
    if (isValidQuestionStart(line, lineQuestionMatch, context.subject) && isGroupedQuestionInstruction(context.subject, lineQuestionMatch[2])) {
      pendingContext = line;
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
    if (inAnswerKey && isQuestionContentLine(line, context.subject)) inAnswerKey = false;
    if (inAnswerKey) continue;

    if ((PASSAGE_HEADER.test(line) || CONTEXT_HEADER.test(line)) && !current) {
      pendingPassage = PASSAGE_HEADER.test(line) ? line : pendingPassage;
      pendingContext = CONTEXT_HEADER.test(line) ? line : pendingContext;
      continue;
    }

    const topicMatch = line.match(TOPIC_LINE);
    if (topicMatch && !current) {
      topic = topicMatch[1].trim() || topic;
      continue;
    }

    if (context.subject === "Mathematics"
      && current?.options.length
      && /^\d{1,2}\)$/.test(line)
      && /(?:\(|[-+*/])\s*$/.test(current.options.at(-1))) {
      const lastIndex = current.options.length - 1;
      const lastOption = `${current.options[lastIndex]} ${line}`;
      current.options[lastIndex] = lastOption;
      const label = lastOption.match(/^([A-E])\./)?.[1];
      if (label) current[`option${label.charCodeAt(0) - 64}`] = lastOption;
      continue;
    }

    let numberMatch = line.match(QUESTION_START);
    if (!numberMatch && /^\d{1,3}[\.\):]+$/.test(line) && lineIndex + 1 < lines.length) {
      const num = line.match(/^(\d{1,3})/)[1];
      if (Number(num) >= 1 && Number(num) <= MAX_QUESTION_NUMBER) {
        numberMatch = [line, num, lines[lineIndex + 1]];
        lineIndex += 1;
      }
    }

    const subjectProfile = getSubjectRescanProfile(context.subject);
    if (isValidQuestionStart(line, numberMatch, context.subject) && /^[A-E]$/i.test(numberMatch[2].trim())) continue;

    if (isValidQuestionStart(line, numberMatch, context.subject)
      && current
      && isNumberedSubItemLine(lines, lineIndex, context.subject, current.question)) {
      current.question += ` ${line}`;
      continue;
    }

    if (isValidQuestionStart(line, numberMatch, context.subject)) {
      finish();
      const questionNumber = Number(numberMatch[1]);
      if (context.inferYearsFromResets !== false && questionNumber === 1 && previousQuestionNumber >= MIN_QUESTION_NUMBER_FOR_YEAR_RESET && currentYear !== null) {
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
        pdfName: context.pdfName,
        pendingPassage,
        pendingContext: pendingContext ?? pendingPassage,
      });
      const inlineStart = findInlineQuestionStart(numberMatch[2], current, context.subject);
      if (inlineStart > 0) {
        const passagePrefix = pendingPassage ? `[${pendingPassage}] ` : "";
        current.question = `${passagePrefix}${numberMatch[2].slice(0, inlineStart).trim()}`.trim();
        lines.splice(lineIndex + 1, 0, numberMatch[2].slice(inlineStart).trim());
      }
      pendingPassage = null;
      pendingContext = null;
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
      current.note = noteMatch[1] ?? noteMatch[2] ?? "";
      continue;
    }

    // Split multiple choices on one line into separate options
    const optionLine = normalizeOptionSpacing(line);
      const optionMatches = [...optionLine.matchAll(OPTION_START)]
        .filter((match) => !subjectProfile.requirePunctuatedOptionLabels || Boolean(match[2]));
    if (optionMatches.length) {
      const firstOptionAt = optionMatches[0].index ?? 0;
      const leadingText = optionLine.slice(0, firstOptionAt).trim();
      const lastOptionLetter = current.options.at(-1)?.match(/^([A-E])[\.\)]/i)?.[1];
      let expectedLetterIndex = lastOptionLetter ? (lastOptionLetter.toUpperCase().charCodeAt(0) - 64 + 1) : 1;
      const validOptionMatches = [];
      for (let i = 0; i < optionMatches.length; i += 1) {
        const match = optionMatches[i];
        const letter = normalizeOptionLetter(match[1]);
        const letterIndex = letter.charCodeAt(0) - 64;
        const explicitPunctuation = Boolean(match[2]);
        if (letterIndex !== expectedLetterIndex && !(explicitPunctuation && letterIndex > expectedLetterIndex)) continue;
        validOptionMatches.push({ match, index: i, letter, explicitPunctuation });
        expectedLetterIndex = letterIndex + 1;
      }

      const isUnpunctuatedSingleA = current.options.length === 0
        && validOptionMatches.length === 1
        && validOptionMatches[0].letter === "A"
        && !validOptionMatches[0].explicitPunctuation;
      if (validOptionMatches.length > 0 && !isUnpunctuatedSingleA) {
        if (leadingText && current.options.length === 0) current.question += ` ${leadingText}`;
        for (let validIndex = 0; validIndex < validOptionMatches.length; validIndex += 1) {
          const { match, letter } = validOptionMatches[validIndex];
          const start = match.index ?? 0;
          const contentStart = start + match[0].length;
          const end = validIndex + 1 < validOptionMatches.length ? validOptionMatches[validIndex + 1].match.index : optionLine.length;
          const optionText = optionLine.slice(contentStart, end).trim();
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

  if (current && !context.deferTrailingQuestion) {
    const question = finalizeQuestion(current);
    if (question.question && isValidQuestionNumber(question.questionNumber)) found.push(question);
    current = null;
  }

  return { questions: found, year: currentYear, lastQuestionNumber: previousQuestionNumber, topic, currentQuestion: current, previousLine: lines.at(-1) ?? context.previousLine, inferredYearResets, pendingPassage, pendingContext, inAnswerKey };
}

function isNumberedSubItemLine(lines, index, subject, currentPrompt = "") {
  const profile = getSubjectRescanProfile(subject);
  if (!profile.preserveNumberedListItems || !currentPrompt) return false;
  const cues = /\b(?:orders?|sequences?|arrange|arrangement|following\s+(?:structures?|processes?|statements?|reactions?|equations?|steps?|items?)|which\s+of\s+the\s+following\s+(?:are|is))\b/i;
  if (!cues.test(currentPrompt)) return false;

  const item = String(lines[index] ?? "").match(/^\s*(\d{1,2})[.)]\s*(\S.*)$/);
  if (!item || Number(item[1]) > 10) return false;
  const inlineItems = [...String(lines[index] ?? "").matchAll(/(?:^|\s)(\d{1,2})[.)]\s*\S/g)].map((match) => Number(match[1]));
  if (inlineItems.length >= 2 && inlineItems[0] <= 5
    && inlineItems.slice(1).every((number, itemIndex) => number === inlineItems[itemIndex] + 1)) return true;
  const priorItems = [...currentPrompt.matchAll(/(?:^|\s)(\d{1,2})(?:[.)]\s*|\s+)(?=\S)/g)].map((match) => Number(match[1]));
  if (priorItems.length && Number(item[1]) === priorItems.at(-1) + 1) return true;
  const next = String(lines[index + 1] ?? "").match(/^\s*(\d{1,2})[.)]\s*(\S.*)$/);
  if (!next || Number(next[1]) !== Number(item[1]) + 1) return false;
  return !/^(?:which|what|who|when|where|why|how|is|are|was|were|does|do|did|has|have|can|could|should|would|will)\b/i.test(next[2]);
}

function isValidQuestionNumber(number) {
  return Number.isInteger(number) && number >= 1 && number <= MAX_QUESTION_NUMBER;
}


module.exports = {
  createQuestion,
  extractEmbeddedOptions,
  normalizeQuestionOptions,
  extractSubjectOptions,
  finalizeQuestion,
  splitStoredOptions,
  parsePageText,
  isNumberedSubItemLine,
  isValidQuestionNumber,
};
