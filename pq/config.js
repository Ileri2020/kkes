const fs = require("node:fs");
const path = require("node:path");
const { PDFParse } = require("pdf-parse");

const PQ_DIR = __dirname;
const PDF_DIR = path.join(PQ_DIR, "jamb");
const PROJECT_ROOT = path.resolve(PQ_DIR, "..");
const OUTPUT_FILE = path.join(PQ_DIR, "past_questions_db.json");
const SUBJECT_JSON_DIR = path.join(PQ_DIR, "json");

// Load local credentials for optional Cloudinary uploads and -db imports.
try {
  require("dotenv").config({ path: path.join(PROJECT_ROOT, ".env") });
  require("dotenv").config({ path: path.join(PROJECT_ROOT, ".env.local"), override: true });
} catch {
  // The local JSON scraper remains usable without dotenv.
}

const QUESTION_START = /^(?:(?:question|q)\s*[.:#-]?\s*)?(\d{1,3})(?:(?:\s*[.):]+\s*)|(?:\s+)|(?=[A-Za-z]))(.*)$/i;
const MAX_QUESTION_NUMBER = 150;
const MIN_QUESTION_NUMBER_FOR_YEAR_RESET = 40;
const MIN_QUESTIONS_PER_JAMB_YEAR = 40;
const MIN_MULTIPLE_CHOICE_OPTIONS = 4;
const OPTION_START = /(?:^|\s|[([{])([A-Ea-e\u0410\u0412\u0421\u0415\u0430\u0432\u0441\u0435\u00c0\u00c1\u00c2\u00c4\u00e0\u00e1\u00e2\u00e4])(?:\s*([.)])\s*|\s+)/gi;
const ANSWER_LINE = /^(?:answer|ans(?:wer)?|correct\s+option)\s*[:.)-]?\s*([A-Ea-e])\b(?:\s*[-:]\s*(.*))?/i;
const ANSWER_KEY_HEADER = /\b(?:answer\s+keys?|keys?\s+to\s+answers?)\b/i;
const NOTE_LINE = /^(?:(?:note|explanation)\s*[:.)-]?\s*(.*)|solution(?:\s*[:.)-]\s*(.*)|\s*$))/i;
const TOPIC_LINE = /^(?:topic|category)\s*[:.)-]?\s*(.*)/i;
const VISUAL_CUE = /\b(?:fig(?:ure)?\s*\.?\s*\d+|diagram|illustration|graph|map|shown\s+(?:below|above)|picture|photograph)\b/i;
const PASSAGE_HEADER = /^(?:passage|comprehension|read\s+the|in (?:each of )?questions?|use the (?:passage|diagram|table|figure|text|chart|information))/i;
const CONTEXT_HEADER = /^(?:context|similarity|quote|quotation|reference|excerpt|based on\s+the\s+passage|read\s+the\s+(?:passage|text)|in\s+the\s+passage|from\s+the\s+passage)/i;
const GROUPED_QUESTION_INSTRUCTION = /^(?:to|and)\s+\d{1,3}\s+(?:are|is|were|will|should|must|can|could|would|may|might|shall|have|has|had|based|answer|refer)/i;
const SUBJECT_RESCAN_PROFILES = {
  English: { joinLineWrappedWords: true, groupedQuestions: true, ignoreBareAnswerRows: true, preserveNumberedListItems: true, preferCompleteOptionCandidate: true, recoverOutOfOrderOptions: true, normalizeAccentedOptionLabels: true, normalizeBracketedOptionLabels: true, recoverWrappedOptionLabels: true, repairRepeatedOptionLabels: true, recoverQuotedOptionLabels: true, recoverFusedOptionLabels: true },
  Literature: { joinLineWrappedWords: true, groupedQuestions: true, ignoreBareAnswerRows: true, preserveNumberedListItems: true, preferCompleteOptionCandidate: true, recoverInlineQuestionStarts: true, recoverOutOfOrderOptions: true, normalizeAccentedOptionLabels: true, normalizeBracketedOptionLabels: true, recoverWrappedOptionLabels: true, repairRepeatedOptionLabels: true, recoverQuotedOptionLabels: true, recoverFusedOptionLabels: true },
  Mathematics: { joinLineWrappedWords: true, groupedQuestions: false, ignoreBareAnswerRows: true, preserveNumberedListItems: true, preferCompleteOptionCandidate: true, recoverEqualsDelimitedOptions: true, recoverOutOfOrderOptions: true, normalizeAccentedOptionLabels: false, normalizeBracketedOptionLabels: false, recoverWrappedOptionLabels: true, recoverColonDashOptions: true, recoverFusedOptionLabels: true },
  Physics: { joinLineWrappedWords: true, groupedQuestions: false, ignoreBareAnswerRows: true, preserveNumberedListItems: true, preferCompleteOptionCandidate: true, recoverEqualsDelimitedOptions: true, recoverOutOfOrderOptions: true, normalizeAccentedOptionLabels: false, normalizeBracketedOptionLabels: false, recoverWrappedOptionLabels: true, recoverColonDashOptions: true, recoverFusedOptionLabels: true },
  Chemistry: { joinLineWrappedWords: true, groupedQuestions: false, ignoreBareAnswerRows: true, preserveNumberedListItems: true, preferCompleteOptionCandidate: true, recoverOutOfOrderOptions: true, normalizeAccentedOptionLabels: true, normalizeBracketedOptionLabels: false, recoverWrappedOptionLabels: true, repairRepeatedOptionLabels: true, recoverColonDashOptions: true, recoverQuotedOptionLabels: true, recoverFusedOptionLabels: true },
  Biology: { joinLineWrappedWords: true, groupedQuestions: false, ignoreBareAnswerRows: true, preserveNumberedListItems: true, preferCompleteOptionCandidate: true, recoverOutOfOrderOptions: true, normalizeAccentedOptionLabels: false, normalizeBracketedOptionLabels: false, recoverWrappedOptionLabels: true, repairRepeatedOptionLabels: true, recoverQuotedOptionLabels: true, recoverFusedOptionLabels: true },
  Economics: { joinLineWrappedWords: true, groupedQuestions: false, ignoreBareAnswerRows: true, preserveNumberedListItems: true, preferCompleteOptionCandidate: true, recoverOutOfOrderOptions: true, normalizeAccentedOptionLabels: true, normalizeBracketedOptionLabels: false, recoverWrappedOptionLabels: true, repairRepeatedOptionLabels: true, recoverColonDashOptions: true, recoverFusedOptionLabels: true },
  Government: { joinLineWrappedWords: true, groupedQuestions: false, ignoreBareAnswerRows: true, preserveNumberedListItems: true, preferCompleteOptionCandidate: true, recoverOutOfOrderOptions: true, normalizeAccentedOptionLabels: true, normalizeBracketedOptionLabels: false, recoverWrappedOptionLabels: true, repairRepeatedOptionLabels: true, recoverColonDashOptions: true, recoverQuotedOptionLabels: true, recoverFusedOptionLabels: true },
  Commerce: { joinLineWrappedWords: true, groupedQuestions: false, ignoreBareAnswerRows: true, preserveNumberedListItems: true, preferCompleteOptionCandidate: true, recoverOutOfOrderOptions: true, normalizeAccentedOptionLabels: false, normalizeBracketedOptionLabels: false, recoverWrappedOptionLabels: true, repairRepeatedOptionLabels: true, recoverColonDashOptions: true, recoverFusedOptionLabels: true },
  Accounts: { joinLineWrappedWords: true, groupedQuestions: false, ignoreBareAnswerRows: true, preserveNumberedListItems: true, preferCompleteOptionCandidate: true, recoverEqualsDelimitedOptions: true, recoverOutOfOrderOptions: true, normalizeAccentedOptionLabels: true, normalizeBracketedOptionLabels: false, recoverWrappedOptionLabels: true, repairRepeatedOptionLabels: true, recoverColonDashOptions: true, recoverQuotedOptionLabels: true, recoverFusedOptionLabels: true },
  Crk: { joinLineWrappedWords: true, groupedQuestions: false, ignoreBareAnswerRows: true, preserveNumberedListItems: true, preferCompleteOptionCandidate: true, recoverOutOfOrderOptions: true, normalizeAccentedOptionLabels: true, normalizeBracketedOptionLabels: false, recoverWrappedOptionLabels: true, repairRepeatedOptionLabels: true, recoverColonDashOptions: true, recoverQuotedOptionLabels: true, recoverFusedOptionLabels: true },
};

function getSubjectRescanProfile(subject) {
  return SUBJECT_RESCAN_PROFILES[subject] ?? { joinLineWrappedWords: false, groupedQuestions: false };
}

function isGroupedQuestionInstruction(subject, prompt) {
  const normalizedPrompt = prompt.trim();
  if (/^(?:to|and)\s+\d{1,3}\b/i.test(normalizedPrompt)) return true;
  return getSubjectRescanProfile(subject).groupedQuestions && GROUPED_QUESTION_INSTRUCTION.test(normalizedPrompt);
}

function normalizeSubjectRescanText(subject, value) {
  const profile = getSubjectRescanProfile(subject);
  let normalized = normalizeOptionSpacing(value.replace(/[\u200B\uFEFF]/g, "").replace(/\s+/g, " ").trim());
  if (profile.normalizeAccentedOptionLabels) {
    normalized = normalized.replace(/(^|[\s([{])[ÀÁÂÄàáâä](?=\s*[.)]\s*)/g, "$1A");
  }
  if (profile.normalizeBracketedOptionLabels) {
    normalized = normalized.replace(/([\[(])\s*([A-E])(?=\s*[.)]\s)/gi, "$1$2");
  }
  if (profile.recoverQuotedOptionLabels) {
    normalized = normalized.replace(/(^|[\s([{])([A-E])(?=["'“”‘’])/g, "$1$2. ");
  }
  if (profile.recoverFusedOptionLabels) {
    normalized = normalized.replace(/(?<=[a-z0-9.])([A-E])(?=\s*[.)](?:\s|$))/g, " $1");
  }
  return profile.joinLineWrappedWords
    ? normalized.replace(/-\s+(?=[a-z])/g, "")
    : normalized;
}

function normalizeOptionLetter(letter) {
  return ({ "А": "A", "а": "A", "À": "A", "Á": "A", "Â": "A", "Ä": "A", "à": "A", "á": "A", "â": "A", "ä": "A", "В": "B", "в": "B", "С": "C", "с": "C", "Е": "E", "е": "E" })[letter] ?? letter.toUpperCase();
}

function normalizeOptionSpacing(value) {
  return value.replace(/(?<=[A-Za-z])([A-E\u0410\u0412\u0421\u0415\u0430\u0432\u0441\u0435])(?=\s*[.)](?:\s|$))/g, " $1");
}

function isAnswerKeyLine(line) {
  if (ANSWER_KEY_HEADER.test(line)) return true;
  const answerPairs = [...line.matchAll(/(?:^|[\s,;])\d{1,3}\s*[.):]?\s*[A-E](?=$|[\s,;.])/gi)];
  if (answerPairs.length < 5) return false;
  const remainder = line.replace(/(?:^|[\s,;])\d{1,3}\s*[.):]?\s*[A-E](?=$|[\s,;.])/gi, " ").replace(/[\s,;:.|/\\-]+/g, "");
  return remainder.length <= Math.max(8, Math.floor(line.length * 0.12));
}

function isQuestionContentLine(line, subject) {
  const match = line.match(QUESTION_START);
  if (!isValidQuestionStart(line, match, subject) || isAnswerKeyLine(line) || isGroupedQuestionInstruction(subject, match[2])) return false;
  if (/^[A-E]$/i.test(match[2].trim())) return false;
  const words = match[2].match(/[A-Za-z]{2,}/g) ?? [];
  return words.length >= 5;
}

function isValidQuestionStart(line, match, subject) {
  if (!match) return false;
  const number = Number(match[1]);
  // Decimal values (for example, 3.06 g) and zero-prefixed data are not question headings.
  if (number < 1 || number > MAX_QUESTION_NUMBER || /^\d{1,3}\s*\.\s*\d/.test(line) || /^\d{1,3}\s+\d/.test(line)) return false;
  // Chemistry electron configurations (for example, 3s2 3p2) often begin
  // with a digit and are otherwise mistaken for an OCR-damaged question label.
  if (subject === "Chemistry" && /^\d{1,2}\s*[spdf]\s*\d/i.test(line)) return false;
  return true;
}

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
  const examHeading = normalized.match(/\b(?:UTME|JAMB|WAEC|NECO)\s+((?:19|20)\d{2})\b(?!\s*-\s*(?:19|20)\d{2})/i);
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

module.exports = {
  PQ_DIR,
  PDF_DIR,
  PROJECT_ROOT,
  OUTPUT_FILE,
  SUBJECT_JSON_DIR,
  QUESTION_START,
  MAX_QUESTION_NUMBER,
  MIN_QUESTION_NUMBER_FOR_YEAR_RESET,
  MIN_QUESTIONS_PER_JAMB_YEAR,
  MIN_MULTIPLE_CHOICE_OPTIONS,
  OPTION_START,
  ANSWER_LINE,
  ANSWER_KEY_HEADER,
  NOTE_LINE,
  TOPIC_LINE,
  VISUAL_CUE,
  PASSAGE_HEADER,
  CONTEXT_HEADER,
  GROUPED_QUESTION_INSTRUCTION,
  SUBJECT_RESCAN_PROFILES,
  getSubjectRescanProfile,
  isGroupedQuestionInstruction,
  normalizeSubjectRescanText,
  normalizeOptionLetter,
  normalizeOptionSpacing,
  isAnswerKeyLine,
  isQuestionContentLine,
  isValidQuestionStart,
  normalizeSpacedDigits,
  findYearRange,
  namedYearFromHeader,
  yearFromHeader,
};
