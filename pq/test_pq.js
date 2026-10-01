const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { PDFParse } = require("pdf-parse");
const { extractSubjectOptions } = require("./parser");
const { findYearRange, namedYearFromHeader, yearFromHeader, splitStoredOptions, rescanIncompleteQuestions, reloadSubjectQuestions, rescanIncompleteQuestionsAcrossPages, rescanMissingQuestionNumbers, getIncompleteOptionSamples, getQuestionGapSamples, isAnswerKeyLine, parsePageText, detectFileMetadata, validateQuestionNumberCoverage, formatPageNumbers, getIncompleteOptionPageSummary, getQuestionNumberPageSummary, parseArgs, writeSubjectJsonFiles } = require("./scrape_pq");

async function testScraper() {
  console.log("=== PQ scraper verification ===");
  const defaults = parseArgs([]);
  for (const subject of ["Biology", "Economics", "Mathematics", "Physics", "Accounts"]) {
    const groupedFragment = parsePageText("2. and 3.\n4. A normal subsequent question with enough prompt text", {
      subject, examType: "jamb", topic: subject, page: 1,
      year: 2020, yearRange: null, lastQuestionNumber: 1,
    });
    if (groupedFragment.questions.some((question) => question.questionNumber === 2)
      || groupedFragment.currentQuestion?.questionNumber === 2) {
      throw new Error(`${subject} treated a grouped-direction continuation as question 2.`);
    }
  }
  const inlineLiterature = parsePageText([
    "39. Which statement about the character is correct? A. first choice B. second choice 46.In the play, the gods are portrayed as",
    "A. Saviours of mankind B. architects of man's destiny C. helpless D. amorous",
  ].join("\n"), {
    subject: "Literature", examType: "jamb", topic: "Literature", page: 41,
    year: 2015, yearRange: null, lastQuestionNumber: 38,
  });
  const inlineQuestion = inlineLiterature.questions.find((question) => question.questionNumber === 46);
  if (!inlineQuestion?.question.includes("the gods are portrayed") || inlineQuestion.options.length !== 4) {
    throw new Error(`An inline next question after two choices was not separated: ${JSON.stringify(inlineLiterature.questions)}`);
  }
  if (formatPageNumbers([1, 2, 3, 5, 7, 8]) !== "1-3, 5, 7-8"
    || formatPageNumbers([]) !== "none identified") {
    throw new Error("Source page numbers were not formatted as compact page ranges.");
  }
  const optionPageSummary = getIncompleteOptionPageSummary([
    { year: 2020, questionNumber: 4, options: [], needsRescan: true, _sourcePage: 2 },
    { year: null, questionNumber: 5, options: ["A. one"], needsRescan: true, _sourcePage: 2 },
    { year: 2021, questionNumber: 6, options: ["A. one", "B. two", "C. three", "D. four"], needsRescan: false, _sourcePage: 3 },
  ]);
  if (optionPageSummary.length !== 1 || optionPageSummary[0] !== "page 2 (also inspect adjacent pages 1-4): 2020#4, Unknown#5") {
    throw new Error(`Incomplete-option diagnostics did not group affected question numbers by source page: ${JSON.stringify(optionPageSummary)}`);
  }
  if (getQuestionNumberPageSummary([{ year: 2020, questionNumber: 3, _sourcePage: 9 }])[0] !== "page 9: 2020#3") {
    throw new Error("Recovered question diagnostics did not retain the source page.");
  }
  const earlyGapQuestions = [
    { year: 2020, questionNumber: 1 },
    { year: 2020, questionNumber: 2 },
    { year: 2020, questionNumber: 4 },
  ];
  const earlyGapDiagnostic = rescanMissingQuestionNumbers(earlyGapQuestions, [
    { page: 9, text: "OCR text contains no recognizable question start.", years: new Set([2020]) },
  ], validateQuestionNumberCoverage(earlyGapQuestions, "jamb"), { subject: "Government", examType: "jamb" });
  if (earlyGapDiagnostic.unresolved[0]?.questionNumber !== 3
    || earlyGapDiagnostic.unresolved[0]?.candidateSourcePages.length !== 0
    || earlyGapDiagnostic.unresolved[0]?.searchedSourcePages.join(",") !== "9") {
    throw new Error(`Unresolved-number diagnostics did not retain the inspected source page: ${JSON.stringify(earlyGapDiagnostic.unresolved)}`);
  }
  if (!defaults.skipImageUpload || defaults.uploadImages) throw new Error("Image uploads should be skipped by default.");
  const uploadsEnabled = parseArgs(["--upload-images"]);
  if (!uploadsEnabled.uploadImages || uploadsEnabled.skipImageUpload) throw new Error("--upload-images should enable Cloudinary uploads.");
  const skipOverridesUpload = parseArgs(["--upload-images", "--skip-image-upload"]);
  if (skipOverridesUpload.uploadImages) throw new Error("--skip-image-upload should take precedence over --upload-images.");
  if (!parseArgs(["-db"]).importDb) throw new Error("-db should select local JSON database import mode.");
  if (parseArgs(["-db", "--input=existing.json"]).inputFile !== "existing.json") throw new Error("-db should accept the path to a previously saved JSON file.");
  const subjectOutputDir = fs.mkdtempSync(path.join(os.tmpdir(), "pq-subject-json-"));
  try {
    const writtenSubjectFiles = writeSubjectJsonFiles([
      { subject: "English", question: "One" },
      { subject: "English", question: "Two" },
      { subject: "Crk", question: "Three" },
    ], subjectOutputDir);
    const englishFile = path.join(subjectOutputDir, "english.json");
    if (writtenSubjectFiles.length !== 2
      || !fs.existsSync(englishFile)
      || JSON.parse(fs.readFileSync(englishFile, "utf8")).length !== 2
      || !fs.existsSync(path.join(subjectOutputDir, "crk.json"))) {
      throw new Error(`Per-subject JSON output was not grouped and named correctly: ${JSON.stringify(writtenSubjectFiles)}`);
    }
  } finally {
    fs.rmSync(subjectOutputDir, { recursive: true, force: true });
  }
  const filteredRescan = parseArgs(["--rescan-subject=english,mathematics", "--rescan-subject=Physics"]);
  if (filteredRescan.rescanSubjects.join(",") !== "English,Mathematics,Physics") throw new Error(`Subject rescan filter did not normalize requested subjects: ${JSON.stringify(filteredRescan.rescanSubjects)}`);
  console.log("✅ CLI verification: uploads skipped by default; --upload-images opts in; -db imports local JSON.");
  if (namedYearFromHeader("Biology 1983-2004", "Biology") !== null) throw new Error("A cover year range must not be parsed as a single named year.");
  if (namedYearFromHeader("Biology 1983", "Biology") !== 1983) throw new Error("Named subject/year headings should be detected.");
  if (yearFromHeader("JAMB 1983-2004", "Biology") !== null) throw new Error("An exam cover year range must not be parsed as a single year.");
  if (yearFromHeader("JAMB 1983", "Biology") !== 1983) throw new Error("A named exam/year heading should be detected.");

  const syntheticLines = Array.from({ length: 40 }, (_, index) => `${index + 1}. Sample question ${index + 1}`);
  syntheticLines.push("1. First question of the next year");
  const reset = parsePageText(syntheticLines.join("\n"), {
    subject: "Biology",
    examType: "jamb",
    topic: "Biology",
    page: 1,
    year: 1983,
    yearRange: { start: 1983, end: 2004 },
    lastQuestionNumber: 0,
  });
  if (reset.year !== 1984 || reset.inferredYearResets !== 1) throw new Error(`Expected a reset after question 40 to advance the year once; got year ${reset.year}, resets ${reset.inferredYearResets}.`);
  const resetWithoutCoverRange = parsePageText(syntheticLines.concat("1. First question of the next year").join("\n"), {
    subject: "Chemistry", examType: "jamb", topic: "Chemistry", page: 1,
    year: 1983, yearRange: null, lastQuestionNumber: 0,
  });
  if (resetWithoutCoverRange.year !== 1984 || resetWithoutCoverRange.inferredYearResets !== 1) {
    throw new Error(`A 40-to-1 reset should advance the known year without a cover range: ${JSON.stringify({ year: resetWithoutCoverRange.year, resets: resetWithoutCoverRange.inferredYearResets })}`);
  }
  const shortSequence = parsePageText(Array.from({ length: 39 }, (_, index) => `${index + 1}. Sample`).concat("1. Numbered sub-item").join("\n"), {
    subject: "Biology", examType: "jamb", topic: "Biology", page: 1, year: 1983,
    yearRange: { start: 1983, end: 2004 }, lastQuestionNumber: 0,
  });
  if (shortSequence.year !== 1983 || shortSequence.inferredYearResets !== 0) throw new Error("A short 40-to-1 reset should not advance the inferred year.");
  console.log("✅ Year reset verification: question 40 → question 1 advances the inferred year; shorter sets do not.");

    const shortSectionWithYearLikeLine = parsePageText([
      "1. First question", "2. Second question", "3. Third question", "4. Fourth question",
      "5. Fifth question", "6. Sixth question", "7. Seventh question", "Use of English 1983",
      "8. Eighth question",
    ].join("\n"), {
      subject: "English", examType: "jamb", topic: "English", page: 1,
      year: 2020, yearRange: null, lastQuestionNumber: 0,
    });
    if (shortSectionWithYearLikeLine.year !== 2020 || shortSectionWithYearLikeLine.lastQuestionNumber !== 8 || shortSectionWithYearLikeLine.inferredYearResets !== 0) {
      throw new Error(`A year-like line inside a short set must not reset the question/year: ${JSON.stringify({ year: shortSectionWithYearLikeLine.year, lastQuestionNumber: shortSectionWithYearLikeLine.lastQuestionNumber, inferredYearResets: shortSectionWithYearLikeLine.inferredYearResets })}`);
    }

  const optionQuestion = parsePageText([
    "1. X is a crystalline sodium salt. X is",
    "A. Na2,CO3 B. NaHCO3 C. sodium chloride D. sodium sulfate E. sodium nitrate",
    "2. Next question",
  ].join("\n"), {
    subject: "Chemistry", examType: "jamb", topic: "Chemistry", page: 1,
    year: 2020, yearRange: { start: 2020, end: 2020 }, lastQuestionNumber: 0,
  }).questions[0];
  const expectedOptions = ["A. Na2,CO3", "B. NaHCO3", "C. sodium chloride", "D. sodium sulfate", "E. sodium nitrate"];
  if (JSON.stringify(optionQuestion.options) !== JSON.stringify(expectedOptions)) {
    throw new Error(`Concatenated options were not split into A–E in order: ${JSON.stringify(optionQuestion.options)}`);
  }
  const chemistryWrappedOptions = parsePageText([
    "13. which of the following mixtures would result in a",
    "solution of pH greater than 7?",
    "A. 25.00 cm3 of 0.05 M H2SO4 and 25.00 cm3 of",
    "0.50 m Na2CO3",
    "B. 25.00 cm3 of 0.50 M H2SO4 and 25;00 cm3 of",
    "0.10 M NaHCO3",
    "C. 25.00 cm3 of 0.11 M H2SO4 and 25.00 cm3 of",
    "0.10 M NaOH",
    "D. 25.00 cm3 of 0.11 M H2SO4 and 50.00 cm3 of",
    "0.50 M NaOH",
    "E. 25.00 cm3 of 0.25 MH2SO4 and 50.00 cm3 of) .20",
    "M NaOH",
    "14. In which reaction does hydrogen peroxide act as a reducing agent?",
  ].join("\n"), {
    subject: "Chemistry", examType: "jamb", topic: "Chemistry", page: 1,
    year: 1984, yearRange: null, lastQuestionNumber: 12,
  }).questions[0];
  if (!chemistryWrappedOptions.question.includes("solution of pH greater than 7")
    || chemistryWrappedOptions.options.length !== 5
    || !chemistryWrappedOptions.options[0].endsWith("0.50 m Na2CO3")
    || !chemistryWrappedOptions.options[4].endsWith("M NaOH")
    || chemistryWrappedOptions.note !== null) {
    throw new Error(`Chemistry “solution of pH” continuation was misclassified or wrapped options were truncated: ${JSON.stringify(chemistryWrappedOptions)}`);
  }
  const chemistryElectronConfiguration = parsePageText([
    "5. If an element has the lectronic configuration 1s2 2s2 2p6",
    "3s2 3p2, it is",
    "A. a metal",
    "B. an alkaline earth metal",
    "C. an s-block element",
    "D. a p-block element",
    "E. a transition element",
    "6. Some copper sulphate was heated.",
  ].join("\n"), {
    subject: "Chemistry", examType: "jamb", topic: "Chemistry", page: 2,
    year: 1983, yearRange: null, lastQuestionNumber: 4,
  }).questions[0];
  if (chemistryElectronConfiguration.questionNumber !== 5
    || !chemistryElectronConfiguration.question.includes("3s2 3p2")
    || chemistryElectronConfiguration.options.length !== 5
    || chemistryElectronConfiguration.needsRescan) {
    throw new Error(`Chemistry orbital notation was mistaken for a skipped question and detached its choices: ${JSON.stringify(chemistryElectronConfiguration)}`);
  }
  const mathematicsEquationContinuation = parsePageText([
    "4. Solve the following equations",
    "4x - 3 = 3x + y = 2y + 5x - 12",
    "A. x = 5, y = 2 B. x = 2, y = 5 C. x = -2, y = -5",
    "D. x = 5, y = -2 E. x = -5, y = -2",
    "5. If x = 1 is a root of the equation",
  ].join("\n"), {
    subject: "Mathematics", examType: "jamb", topic: "Mathematics", page: 2,
    year: 1983, yearRange: null, lastQuestionNumber: 3,
  }).questions[0];
  if (mathematicsEquationContinuation.questionNumber !== 4
    || !mathematicsEquationContinuation.question.includes("4x - 3")
    || mathematicsEquationContinuation.options.length !== 5
    || mathematicsEquationContinuation.needsRescan) {
    throw new Error(`Mathematics equation line was mistaken for a new question and detached its choices: ${JSON.stringify(mathematicsEquationContinuation)}`);
  }
  const mathematicsComparisonContinuation = parsePageText([
    "9. If a number is written in standard form, find A and B.",
    "1 £ A < 10, where A is the coefficient.",
    "A. A = 9, B = 6 B. A = 6.38, B = -9 C. A = 6.38, B = 9 D. A = 6.38, B = -1 E. A = 6.38, B = 1",
    "10. The next question asks about factors.",
  ].join("\n"), {
    subject: "Mathematics", examType: "jamb", topic: "Mathematics", page: 2,
    year: 1983, yearRange: null, lastQuestionNumber: 8,
  }).questions[0];
  if (mathematicsComparisonContinuation.questionNumber !== 9
    || !mathematicsComparisonContinuation.question.includes("1 £ A < 10")
    || mathematicsComparisonContinuation.options.length !== 5) {
    throw new Error(`Mathematics numeric constraint was treated as a skipped question: ${JSON.stringify(mathematicsComparisonContinuation)}`);
  }
  const mathematicsPolynomialContinuation = parsePageText([
    "10. If x + 2 and x - 1 are factors of the expression lx +",
    "2kx2 + 24, find the values of l and k",
    "A. l = -6, k = -9 B. l = -2, k = 1 C. l = -2, k = -1",
    "D. l = 0, k = 1 E. l = 6, k = 0",
    "11. Make T the subject of the equation",
  ].join("\n"), {
    subject: "Mathematics", examType: "jamb", topic: "Mathematics", page: 2,
    year: 1983, yearRange: null, lastQuestionNumber: 9,
  }).questions[0];
  if (mathematicsPolynomialContinuation.questionNumber !== 10
    || !mathematicsPolynomialContinuation.question.includes("2kx2 + 24")
    || mathematicsPolynomialContinuation.options.length !== 5) {
    throw new Error(`Mathematics polynomial term was mistaken for a new question: ${JSON.stringify(mathematicsPolynomialContinuation)}`);
  }
  const mathematicsWrappedFractionOptions = parsePageText([
    "15. Simplify the following expression.",
    "A. x/(x - 3)(x + 7) B. (x + 3)(x + 7)/x C. x/(x - 3)(x -",
    "7)",
    "D. x/(x + 3)(x + 7) E. x/(x + 4)(x + 7)",
    "16. Next question.",
  ].join("\n"), {
    subject: "Mathematics", examType: "jamb", topic: "Mathematics", page: 2,
    year: 1983, yearRange: null, lastQuestionNumber: 14,
  }).questions[0];
  if (mathematicsWrappedFractionOptions.questionNumber !== 15
    || mathematicsWrappedFractionOptions.options.length !== 5
    || !mathematicsWrappedFractionOptions.options[2].includes("(x - 7)")) {
    throw new Error(`Mathematics denominator continuation was mistaken for a question boundary: ${JSON.stringify(mathematicsWrappedFractionOptions)}`);
  }
  const pageOneQuestion = parsePageText([
    "1. Choices continue onto the following page.",
    "A. first B. second",
  ].join("\n"), {
    subject: "English", examType: "jamb", topic: "English", page: 1,
    year: 2010, yearRange: null, lastQuestionNumber: 0, deferTrailingQuestion: true,
  });
  if (pageOneQuestion.questions.length || !pageOneQuestion.currentQuestion) {
    throw new Error("A trailing question must remain open when PDF page parsing is configured to defer finalization.");
  }
  const pageTwoQuestions = parsePageText([
    "C. third D. fourth E. fifth",
    "2. Next question",
  ].join("\n"), {
    subject: "English", examType: "jamb", topic: "English", page: 2,
    year: pageOneQuestion.year, yearRange: null, lastQuestionNumber: pageOneQuestion.lastQuestionNumber,
    currentQuestion: pageOneQuestion.currentQuestion, deferTrailingQuestion: true,
  });
  if (pageTwoQuestions.questions[0]?.options.length !== 5 || pageTwoQuestions.questions[0]?.needsRescan) {
    throw new Error(`Choices split across PDF pages should be reassembled before finalization: ${JSON.stringify(pageTwoQuestions.questions[0])}`);
  }
  const storedOptions = splitStoredOptions(["A. Elisha B. Ezekiel C. Elijah", "D. Obadiah E. Nehemiah"]);
  const expectedStoredOptions = ["A. Elisha", "B. Ezekiel", "C. Elijah", "D. Obadiah", "E. Nehemiah"];
  if (JSON.stringify(storedOptions) !== JSON.stringify(expectedStoredOptions)) {
    throw new Error(`Combined saved choices were not separated correctly: ${JSON.stringify(storedOptions)}`);
  }
  const punctuationFreeOptions = splitStoredOptions(["A. Guinea B U.S.A. C Great Britain"]);
  if (JSON.stringify(punctuationFreeOptions) !== JSON.stringify(["A. Guinea", "B. U.S.A.", "C. Great Britain"])) {
    throw new Error(`Choices without punctuation were not separated without splitting abbreviations: ${JSON.stringify(punctuationFreeOptions)}`);
  }
  if (optionQuestion.option1 !== expectedOptions[0] || optionQuestion.option2 !== expectedOptions[1] || optionQuestion.option3 !== expectedOptions[2]) {
    throw new Error("Answer choices were not assigned to their corresponding option fields.");
  }
  const cyrillicOptionLabels = parsePageText([
    "1. Select the correct statement.",
    "А. First В. Second С. Third D. Fourth Е. Fifth",
    "2. A question with no extracted choices",
  ].join("\n"), {
    subject: "English", examType: "jamb", topic: "English", page: 1,
    year: 2020, yearRange: { start: 2020, end: 2020 }, lastQuestionNumber: 0,
  }).questions;
  if (JSON.stringify(cyrillicOptionLabels[0]?.options) !== JSON.stringify([
    "A. First", "B. Second", "C. Third", "D. Fourth", "E. Fifth",
  ])) {
    throw new Error(`Cyrillic OCR lookalikes in option labels were not normalized: ${JSON.stringify(cyrillicOptionLabels[0]?.options)}`);
  }
  if (cyrillicOptionLabels.length !== 2 || !cyrillicOptionLabels[1].needsRescan) {
    throw new Error("A question with no answer choices was silently dropped instead of being retained for rescan.");
  }
  const literatureGroups = parsePageText([
    "5. The previous question is complete.",
    "6. to 10 are based on Shakespeare's play.",
    "11. Which character speaks first? A. Romeo B. Juliet C. Benvolio D. Mercutio",
  ].join("\n"), {
    subject: "Literature", examType: "jamb", topic: "Literature", page: 1,
    year: 2011, yearRange: { start: 2010, end: 2018 }, lastQuestionNumber: 4,
  });
  if (literatureGroups.questions.some((question) => question.questionNumber === 6)
    || !literatureGroups.questions.some((question) => question.questionNumber === 11)) {
    throw new Error(`Literature grouped-question directions were counted as a question: ${JSON.stringify(literatureGroups.questions)}`);
  }
  const numberedBiologyItems = parsePageText([
    "28. In what order do the following structures develop during metamorphosis?",
    "1. Hind limbs appear",
    "2. Fore limbs appear",
    "3. Tail is absorbed",
    "A. 1, 2, 3 B. 2, 1, 3 C. 3, 2, 1 D. 1, 3, 2",
    "29. The next biology question asks about cells.",
  ].join("\n"), {
    subject: "Biology", examType: "jamb", topic: "Biology", page: 1,
    year: 1983, yearRange: null, lastQuestionNumber: 27,
  });
  if (numberedBiologyItems.questions.length !== 2
    || numberedBiologyItems.questions[0].questionNumber !== 28
    || !numberedBiologyItems.questions[0].question.includes("1. Hind limbs")
    || numberedBiologyItems.questions[0].options.length !== 4
    || numberedBiologyItems.questions[1].questionNumber !== 29
    || numberedBiologyItems.lastQuestionNumber !== 29) {
    throw new Error(`Biology numbered statement items were mistaken for separate skipped questions: ${JSON.stringify(numberedBiologyItems)}`);
  }
  const numberedBiologyReload = reloadSubjectQuestions([{
    year: 1983, questionNumber: 28,
    question: "In what order do the following structures develop during the metamorphosis of the toad?",
    options: [], needsRescan: true,
  }], [
    "28. In what order do the following structures develop during the metamorphosis of the toad?",
    "1. External gills 2. Internal gills 3. Forelimbs 4. Hindlimbs 5. Mouth.",
    "A. 1 2 3 4 5 B.1 5 2 4 3 C. 1 3 4 5 D. 5 3 4 1 2 E. 5 4 3 2 1.",
    "29. The next biology question asks about cells.",
  ].join("\n"), "Biology");
  if (numberedBiologyReload.recoveredCount !== 1
    || numberedBiologyReload.questions[0].options.map((option) => option[0]).join("") !== "ABCDE") {
    throw new Error(`Biology reload boundaries split numbered list content from answer choices: ${JSON.stringify(numberedBiologyReload)}`);
  }
  const biologyClottingSequence = parsePageText([
    "40. Which of the following sequences represents the",
    "process of blood clotting? 1. Fibrin forms a network of",
    "threads 2 Red blood cells are caught and a clot is formed",
    "3. Fibrinogen in plasma changes into soluble fibrin 4.",
    "Blood is exposed to air.",
    "A. 4,3,2,1 B. 4,3,1,2 C. 3,1,4,2 D. 1,2,3,4",
    "E. 3,1,2,4.",
    "41. Green plants are important in the ecosystem.",
  ].join("\n"), {
    subject: "Biology", examType: "jamb", topic: "Biology", page: 2,
    year: 1984, yearRange: null, lastQuestionNumber: 39,
  });
  if (biologyClottingSequence.questions[0]?.questionNumber !== 40
    || biologyClottingSequence.questions[0]?.options.length !== 5
    || !biologyClottingSequence.questions[0]?.question.includes("Fibrinogen")) {
    throw new Error(`Biology clotting-sequence items split the actual question before its answer choices: ${JSON.stringify(biologyClottingSequence.questions)}`);
  }
  const literatureAnswerRows = parsePageText([
    "1. Which literature paper type is shown?",
    "A. Type A B. Type B C. Type C D. Type D",
    "1. D",
    "2. B",
    "Questions 3 to 5 are based on the passage.",
    "3. Who speaks in the passage?",
    "A. A narrator B. A child C. A teacher D. A traveller",
  ].join("\n"), {
    subject: "Literature", examType: "jamb", topic: "Literature", page: 1,
    year: 2010, yearRange: null, lastQuestionNumber: 0,
  });
  if (literatureAnswerRows.questions.length !== 2
    || literatureAnswerRows.questions.map((question) => question.questionNumber).join(",") !== "1,3"
    || literatureAnswerRows.questions.some((question) => question.question.trim() === "D" || question.question.trim() === "B")) {
    throw new Error(`Literature answer-only rows were treated as question prompts: ${JSON.stringify(literatureAnswerRows.questions)}`);
  }
  if (!isAnswerKeyLine("1.D, 2.A, 3.E, 4.C, 5.D, 6.B, 7.A, 8.B")) {
    throw new Error("A compact numbered answer-key row was not identified.");
  }
  const answerKeyPageOne = parsePageText("1. Last question before the key\nANSWER KEYS:", {
    subject: "Government", examType: "jamb", topic: "Government", page: 1,
    year: null, yearRange: null, lastQuestionNumber: 0,
  });
  const answerKeyPageTwo = parsePageText("1.D, 2.A, 3.E, 4.C, 5.D, 6.B, 7.A, 8.B", {
    subject: "Government", examType: "jamb", topic: "Government", page: 2,
    year: null, yearRange: null, lastQuestionNumber: answerKeyPageOne.lastQuestionNumber,
    inAnswerKey: answerKeyPageOne.inAnswerKey,
  });
  if (answerKeyPageTwo.questions.length || !answerKeyPageTwo.inAnswerKey) {
    throw new Error("Answer-key rows across page boundaries were treated as questions.");
  }
  const rawRescanPage = [
    "1. A fused label example",
    "A. first choice B. second choice C. third choice D. fourth choiceE. fifth choice",
    "2. Next prompt",
  ].join("\n");
  const needsOptionRescan = parsePageText(rawRescanPage, {
    subject: "Government", examType: "jamb", topic: "Government", page: 1,
    year: 2020, yearRange: { start: 2020, end: 2020 }, lastQuestionNumber: 0,
  }).questions[0];
  needsOptionRescan.options = ["A. first choice", "B. second choice"];
  needsOptionRescan.option1 = needsOptionRescan.options[0];
  needsOptionRescan.option2 = needsOptionRescan.options[1];
  needsOptionRescan.needsRescan = true;
  const rescanResult = rescanIncompleteQuestions([needsOptionRescan], rawRescanPage);
  if (rescanResult.recoveredCount !== 1 || rescanResult.questions[0].options.length !== 5 || rescanResult.questions[0].needsRescan) {
    throw new Error(`Targeted page rescan did not recover a verified A–E option set: ${JSON.stringify(rescanResult)}`);
  }
  const crkQuotedLabels = reloadSubjectQuestions([{
    year: 2000, questionNumber: 31, question: "Jesus replied to the Devil.", options: [], needsRescan: true,
  }], [
    "31. Jesus replied to the Devil.",
    "A\u201cMan shall not live by bread alone\u201d B. You shall worship the Lord C. He will give his angels charge D. Do not put the Lord to the test",
  ].join("\n"), "Crk");
  const crkExtractedOptions = extractSubjectOptions("Crk", [
    "31. Jesus replied to the Devil.",
    "A\u201cMan shall not live by bread alone\u201d B. You shall worship the Lord C. He will give his angels charge D. Do not put the Lord to the test",
  ].join("\n"));
  if (crkQuotedLabels.recoveredCount !== 1 || crkQuotedLabels.questions[0].options.length !== 4) {
    throw new Error(`CRK reload did not recover quoted answer labels: ${JSON.stringify({ crkQuotedLabels, crkExtractedOptions })}`);
  }
  const fusedOptionLabels = reloadSubjectQuestions([{
    year: 1994, questionNumber: 31, question: "Which item has the shortest effect?", options: [], needsRescan: true,
  }], [
    "31. Which item has the shortest effect?",
    "A. Fashion B. Innovation.C. Fad D. Attribute.",
  ].join("\n"), "Commerce");
  if (fusedOptionLabels.recoveredCount !== 1 || fusedOptionLabels.questions[0].options.map((option) => option[0]).join("") !== "ABCD") {
    throw new Error(`Commerce reload did not separate fused OCR option labels: ${JSON.stringify(fusedOptionLabels)}`);
  }
  const economicsNumericLabel = reloadSubjectQuestions([{
    year: 1983, questionNumber: 44, question: "Which age group is relevant?", options: [], needsRescan: true,
  }], [
    "44. Which age group is relevant?",
    "A. 1-15 B. 15-65 C. 30-40 D. 40-65E. 65 and above",
  ].join("\n"), "Economics");
  if (economicsNumericLabel.recoveredCount !== 1
    || economicsNumericLabel.questions[0].options.map((option) => option[0]).join("") !== "ABCDE") {
    throw new Error(`Economics reload did not separate a label fused to a numeric range: ${JSON.stringify(economicsNumericLabel)}`);
  }
  const figureInstructionBoundary = reloadSubjectQuestions([{
    year: 1983, questionNumber: 1, question: "Identify the root structure.",
    options: ["A. root apex", "B. epidermis", "C. bundles", "D. endodermis", "E. pericycle Use Fig. 1 to answer questions 2-4"],
    needsRescan: false,
  }], [
    "1. Identify the root structure.",
    "A. root apex B. epidermis C. vascular bundles D. endodermis E. pericycle Use Fig. 1 to answer questions 2-4",
  ].join("\n"), "Biology");
  if (figureInstructionBoundary.recoveredCount !== 1
    || figureInstructionBoundary.questions[0].options[4] !== "E. pericycle") {
    throw new Error(`Biology reload did not clean a complete option set contaminated by a figure instruction: ${JSON.stringify(figureInstructionBoundary)}`);
  }
  const splitPageQuestion = {
    year: 2020,
    questionNumber: 1,
    question: "Choose the correct statement about a sample.",
    options: ["A. first", "B. second"],
    needsRescan: true,
    _sourcePage: 1,
  };
  const splitPageRescan = rescanIncompleteQuestionsAcrossPages([splitPageQuestion], [
    { page: 1, text: "1. Choose the correct statement about a sample.\nA. first B. second" },
    { page: 2, text: "C. third D. fourth\n2. The next question" },
  ], "Biology");
  if (splitPageRescan.recoveredCount !== 1 || splitPageQuestion.options.length !== 4 || splitPageQuestion.needsRescan) {
    throw new Error(`Cross-page reload failed to reunite split answer choices: ${JSON.stringify(splitPageRescan)}`);
  }
  const fourChoicesWithOcrGap = parsePageText([
    "1. Select the correct statement.",
    "A. first choice B. second choice C. third choice E. fifth choice",
  ].join("\n"), {
    subject: "Government", examType: "jamb", topic: "Government", page: 1,
    year: 2020, yearRange: null, lastQuestionNumber: 0,
  }).questions[0];
  if (fourChoicesWithOcrGap.options.length !== 4 || fourChoicesWithOcrGap.needsRescan
    || fourChoicesWithOcrGap.option5 !== "E. fifth choice") {
    throw new Error(`Four ordered choices should be retained when OCR misses label D: ${JSON.stringify(fourChoicesWithOcrGap)}`);
  }
  const isolatedReloadQuestion = {
    year: 2020,
    questionNumber: 1,
    question: "First prompt asks for its own choices",
    options: [],
    needsRescan: true,
  };
  const isolatedReload = reloadSubjectQuestions([isolatedReloadQuestion], [
    "1. First prompt asks for its own choices",
    "2. Neighbor prompt has choices A. one B. two C. three D. four",
  ].join("\n"), "Biology");
  if (isolatedReload.recoveredCount !== 0 || isolatedReloadQuestion.options.length !== 0) {
    throw new Error(`Subject reload attached the next question's options to an incomplete prompt: ${JSON.stringify(isolatedReload)}`);
  }
  const columnOrderQuestion = {
    year: 2020,
    questionNumber: 1,
    question: "Choose the correct statement about the sample.",
    options: [],
    needsRescan: true,
  };
  const columnOrderReload = reloadSubjectQuestions([columnOrderQuestion], [
    "1. Choose the correct statement about the sample.",
    "A. alpha C. gamma B. beta D. delta",
  ].join("\n"), "Mathematics");
  if (columnOrderReload.recoveredCount !== 1 || columnOrderQuestion.options.map((option) => option[0]).join("") !== "ABCD") {
    throw new Error(`Subject reload did not recover explicitly labeled choices in OCR column order: ${JSON.stringify(columnOrderReload)}`);
  }
  const bracketedOptionQuestion = {
    year: 2020,
    questionNumber: 1,
    question: "Select the correct statement about the sample.",
    options: [],
    needsRescan: true,
  };
  const bracketedOptionReload = reloadSubjectQuestions([bracketedOptionQuestion], [
    "1. Select the correct statement about the sample.",
    "[A. alpha B. beta C. gamma D. delta]",
  ].join("\n"), "English");
  if (bracketedOptionReload.recoveredCount !== 1 || bracketedOptionQuestion.options.length !== 4) {
    throw new Error(`English reload did not recover bracketed options: ${JSON.stringify(bracketedOptionReload)}`);
  }
  const physicsOptionQuestion = {
    year: 2020,
    questionNumber: 1,
    question: "Choose the correct relationship for the quantities.",
    options: [],
    needsRescan: true,
  };
  const physicsOptionReload = reloadSubjectQuestions([physicsOptionQuestion], [
    "1. Choose the correct relationship for the quantities.",
    "A: v = u + at B - s = ut + 1/2at² C: v² = u² + 2as D - a = (v-u)/t",
  ].join("\n"), "Physics");
  if (physicsOptionReload.recoveredCount !== 1 || physicsOptionQuestion.options.map((option) => option[0]).join("") !== "ABCD") {
    throw new Error(`Physics reload did not recover colon/dash-delimited formula options: ${JSON.stringify(physicsOptionReload)}`);
  }
  const accountsEqualsOptions = reloadSubjectQuestions([{
    year: 1995, questionNumber: 17, question: "Calculate the amount to be depreciated.", options: [], needsRescan: true,
  }], [
    "17. Calculate the amount to be depreciated.",
    "A = N25,000 B = N50,000 C = N75,000 D = N100,000",
  ].join("\n"), "Accounts");
  if (accountsEqualsOptions.recoveredCount !== 1
    || accountsEqualsOptions.questions[0].options.map((option) => option[0]).join("") !== "ABCD") {
    throw new Error(`Accounts reload did not recover equals-delimited monetary choices: ${JSON.stringify(accountsEqualsOptions)}`);
  }
  const biologyOptionQuestion = {
    year: 2020,
    questionNumber: 1,
    question: "Identify the correct biological process.",
    options: [],
    needsRescan: true,
  };
  const biologyOptionReload = reloadSubjectQuestions([biologyOptionQuestion], [
    "1. Identify the correct biological process.",
    "(A) first process (B) second process (C) third process (D) fourth process",
  ].join("\n"), "Biology");
  if (biologyOptionReload.recoveredCount !== 1 || biologyOptionQuestion.options.length !== 4) {
    throw new Error(`Biology reload did not recover parenthesized OCR options: ${JSON.stringify(biologyOptionReload)}`);
  }
  const biologyRepeatedOptionLabels = reloadSubjectQuestions([{
    year: 1993, questionNumber: 41, question: "Which plants are adapted to salty marshes?", options: [], needsRescan: true,
  }], [
    "41. Which plants are adapted to salty marshes?",
    "A. hydrophytes B. xerophytes B. halophytes D. epiphytes.",
  ].join("\n"), "Biology");
  if (biologyRepeatedOptionLabels.recoveredCount !== 1
    || biologyRepeatedOptionLabels.questions[0].options.map((option) => option[0]).join("") !== "ABCD") {
    throw new Error(`Biology reload did not repair a duplicated B label while preserving the four choices: ${JSON.stringify(biologyRepeatedOptionLabels)}`);
  }
  const articleBeforeOptions = {
    year: 1995,
    questionNumber: 100,
    question: "A citizen in a democracy can…[A. turn up B. bring out",
    options: ["A. citizen in a democracy can…[A. turn up", "B. bring out"],
    needsRescan: true,
  };
  const articleBeforeOptionReload = reloadSubjectQuestions([articleBeforeOptions], [
    "100. A citizen in a democracy can…[A. turn up B. bring out",
    "C. bring up D. turn to] the law if he or she wants to correct an injustice.",
  ].join("\n"), "English");
  if (articleBeforeOptionReload.recoveredCount !== 1
    || articleBeforeOptions.options.map((option) => option[0]).join("") !== "ABCD"
    || !articleBeforeOptions.options[0].includes("turn up")) {
    throw new Error(`English reload treated a leading article as option A instead of preferring explicit answer labels: ${JSON.stringify(articleBeforeOptionReload)}`);
  }
  const repeatedEnglishLabelQuestion = {
    year: 1987,
    questionNumber: 94,
    question: "The man insisted on giving unsolicited advice.",
    options: ["A. advice", "B. advices", "D. advise", "D. advises."],
    needsRescan: true,
  };
  const repeatedEnglishLabelReload = reloadSubjectQuestions([repeatedEnglishLabelQuestion], [
    "94. The man insisted on giving unsolicited…",
    "A. advice B. advices D. advise D. advises.",
  ].join("\n"), "English");
  if (repeatedEnglishLabelReload.recoveredCount !== 1
    || repeatedEnglishLabelQuestion.options.map((option) => option[0]).join("") !== "ABCD") {
    throw new Error(`English reload did not repair an OCR-duplicated answer label: ${JSON.stringify(repeatedEnglishLabelReload)}`);
  }
  const accentedOptionQuestion = {
    year: 2020,
    questionNumber: 1,
    question: "Choose the correct economic statement.",
    options: [],
    needsRescan: true,
  };
  const accentedOptionReload = reloadSubjectQuestions([accentedOptionQuestion], [
    "1. Choose the correct economic statement.",
    "À. first choice B. second choice C. third choice D. fourth choice",
  ].join("\n"), "Economics");
  if (accentedOptionReload.recoveredCount !== 1 || accentedOptionQuestion.options.map((option) => option[0]).join("") !== "ABCD") {
    throw new Error(`Economics reload did not normalize the OCR-accented A label: ${JSON.stringify(accentedOptionReload)}`);
  }
  const damagedPromptQuestion = {
    year: 2020,
    questionNumber: 1,
    question: "The extracted prompt is unreadable.",
    options: [],
    needsRescan: true,
  };
  const uniqueNumberReload = reloadSubjectQuestions([damagedPromptQuestion], [
    "1. The source prompt was badly OCR damaged.",
    "A. first B. second C. third D. fourth",
  ].join("\n"), "Physics");
  if (uniqueNumberReload.recoveredCount !== 1 || damagedPromptQuestion.options.length !== 4) {
    throw new Error(`Unique source question number was not used to recover a badly OCR-damaged prompt: ${JSON.stringify(uniqueNumberReload)}`);
  }
  const duplicateNumberCandidate = reloadSubjectQuestions([{
    year: 2020, questionNumber: 1, question: "OCR damaged prompt", options: [], needsRescan: true,
  }], [
    "1. OCR damaged prompt without choices",
    "1. OCR damaged prompt A. first B. second C. third D. fourth",
  ].join("\n"), "Chemistry");
  if (duplicateNumberCandidate.recoveredCount !== 1
    || duplicateNumberCandidate.questions[0].options.length !== 4) {
    throw new Error(`Chemistry reload did not prefer the uniquely complete duplicate-number source candidate: ${JSON.stringify(duplicateNumberCandidate)}`);
  }
  const subjectReloads = ["English", "Literature", "Mathematics", "Physics", "Chemistry", "Biology", "Economics", "Government", "Commerce", "Accounts", "Crk"];
  for (const subject of subjectReloads) {
    const subjectReload = reloadSubjectQuestions([], "", subject);
    if (!Array.isArray(subjectReload.questions) || subjectReload.recoveredCount !== 0) {
      throw new Error(`Subject-specific reload was not registered for ${subject}: ${JSON.stringify(subjectReload)}`);
    }
  }
  const incompleteSampleInput = Array.from({ length: 12 }, (_, index) => ({
    year: 2020,
    questionNumber: index + 1,
    question: `Incomplete question ${index + 1}`,
    options: ["A. one", "B. two"],
    needsRescan: true,
  }));
  const incompleteSamples = getIncompleteOptionSamples(incompleteSampleInput);
  if (incompleteSamples.length !== 10 || incompleteSamples[0].questionNumber !== 1 || incompleteSamples[0].year !== 2020) {
    throw new Error(`Incomplete-option diagnostics should show the first ten unresolved records: ${JSON.stringify(incompleteSamples)}`);
  }
  const gapQuestions = [
    { year: 2020, questionNumber: 1, question: "First question" },
    { year: 2020, questionNumber: 2, question: "Second question" },
    { year: 2020, questionNumber: 4, question: "Fourth question" },
    { year: 2020, questionNumber: 5, question: "Fifth question" },
  ];
  const gapCoverage = validateQuestionNumberCoverage(gapQuestions, "jamb");
  const gapSamples = getQuestionGapSamples(gapQuestions, gapCoverage);
  if (gapSamples[0]?.unfoundQuestionNumber !== 3
    || gapSamples[0]?.before?.questionNumber !== 2
    || gapSamples[0]?.before?.question !== "Second question"
    || gapSamples[0]?.after?.questionNumber !== 4
    || gapSamples[0]?.after?.question !== "Fourth question") {
    throw new Error(`Unfound question diagnostics should include the nearest before/after records: ${JSON.stringify(gapSamples)}`);
  }
  const missingSourceText = [
    "3. Missing question with choices",
    "A. first B. second C. third D. fourth",
    "4. Next",
  ].join("\n");
  const missingRecovery = rescanMissingQuestionNumbers(gapQuestions.filter((question) => question.questionNumber !== 4), [
    { page: 1, text: missingSourceText, years: new Set([2019, 2020]) },
  ], validateQuestionNumberCoverage(gapQuestions.filter((question) => question.questionNumber !== 4), "jamb"), {
    subject: "Government", examType: "jamb",
  });
  if (missingRecovery.recovered.length !== 1
    || missingRecovery.recovered[0].questionNumber !== 3
    || missingRecovery.recovered[0].options.length !== 4) {
    throw new Error(`Missing-number rescan failed to recover the unique source question: ${JSON.stringify(missingRecovery)}`);
  }
  const isolatedNumberRecovery = rescanMissingQuestionNumbers(gapQuestions.filter((question) => question.questionNumber !== 4), [
    { page: 2, text: ["3.", "Question number was isolated by OCR and its prompt moved below.", "A. first B. second C. third D. fourth", "4. Next question"].join("\n"), years: new Set([2020]) },
  ], validateQuestionNumberCoverage(gapQuestions.filter((question) => question.questionNumber !== 4), "jamb"), {
    subject: "Government", examType: "jamb",
  });
  if (isolatedNumberRecovery.recovered.length !== 1 || isolatedNumberRecovery.recovered[0].questionNumber !== 3) {
    throw new Error(`Missing-number rescan did not recover a number separated from its prompt by OCR layout: ${JSON.stringify(isolatedNumberRecovery)}`);
  }
  const bracketedNumberRecovery = rescanMissingQuestionNumbers(gapQuestions.filter((question) => question.questionNumber !== 4), [
    { page: 3, text: ["(3) Missing prompt wrapped by OCR", "A. first B. second C. third D. fourth", "4. Next question"].join("\n"), years: new Set([2020]) },
  ], validateQuestionNumberCoverage(gapQuestions.filter((question) => question.questionNumber !== 4), "jamb"), {
    subject: "Government", examType: "jamb",
  });
  if (bracketedNumberRecovery.recovered.length !== 1 || bracketedNumberRecovery.recovered[0].questionNumber !== 3) {
    throw new Error(`Missing-number rescan did not recover a bracketed OCR question start: ${JSON.stringify(bracketedNumberRecovery)}`);
  }
  const inlineGapRecovery = rescanMissingQuestionNumbers(gapQuestions.filter((question) => question.questionNumber !== 4), [
    { page: 4, text: "The blank should read .... 3 .... [A. first choice B. second choice C. third choice D. fourth choice]", years: new Set([2020]) },
  ], validateQuestionNumberCoverage(gapQuestions.filter((question) => question.questionNumber !== 4), "jamb"), {
    subject: "English", examType: "jamb",
  });
  if (inlineGapRecovery.recovered.length !== 1 || inlineGapRecovery.recovered[0].questionNumber !== 3
    || inlineGapRecovery.recovered[0].options.length !== 4) {
    throw new Error(`English inline gap question was not recovered from its source page: ${JSON.stringify(inlineGapRecovery)}`);
  }
  const numericFragments = parsePageText([
    "1. The sample was measured carefully.",
    "A mass of 3.06 g was used in the experiment.",
    "0 M Na2CO3 was added to the solution.",
    "2. The next question has no choices.",
  ].join("\n"), {
    subject: "Chemistry", examType: "jamb", topic: "Chemistry", page: 1,
    year: 2020, yearRange: { start: 2020, end: 2020 }, lastQuestionNumber: 0,
  }).questions;
  if (numericFragments.length !== 2 || numericFragments[0].questionNumber !== 1 || !numericFragments[0].question.includes("3.06 g") || !numericFragments[0].question.includes("0 M Na2CO3")) {
    throw new Error(`Numeric values were misread as question headers: ${JSON.stringify(numericFragments)}`);
  }
  const coverText = parsePageText("1 9 83- 2 0 0 4 JAMB Past Questions", {
    subject: "Biology", examType: "jamb", topic: "Biology", page: 1,
    year: 1983, yearRange: { start: 1983, end: 2004 }, lastQuestionNumber: 0,
  });
  if (coverText.questions.length) throw new Error(`OCR-spaced cover text was mistaken for a question: ${JSON.stringify(coverText.questions)}`);
  const embeddedOptions = parsePageText([
    "1. Capitalism is an economic system in which A the economy of the State is centrally planned and controlled B Private persons are permitted to undertake enterprises C accumulation of private property is forbidden D that means of production are owned and controlled by the State E all big industries and the land are publicly owned for common good.",
    "2. Next question",
  ].join("\n"), {
    subject: "Government",
    examType: "jamb",
    topic: "Government",
    page: 1,
    year: 2020,
    yearRange: { start: 2020, end: 2020 },
    lastQuestionNumber: 0,
  }).questions[0];
  if (!embeddedOptions || embeddedOptions.options.length < 4) {
    throw new Error(`Embedded options in the prompt were not split into at least four valid choices: ${JSON.stringify(embeddedOptions)}`);
  }
  console.log("✅ Answer-option verification: concatenated choices are split and assigned sequentially to option1–option5.");

  const englishPassage = parsePageText([
    "Read the passage below.",
    "1. In the passage, the writer shows a sense of caution in the statement A. 'the storm was loud' B. 'we held our breath' C. 'the leaves shook violently' D. 'the old tree stood still' E. 'the path was clear'",
  ].join("\n"), {
    subject: "English",
    examType: "jamb",
    topic: "English",
    page: 1,
    year: 2020,
    yearRange: { start: 2020, end: 2020 },
    lastQuestionNumber: 0,
  }).questions[0];
  if (!englishPassage.passage || !englishPassage.context) {
    throw new Error(`Passage/context metadata was not captured for English questions: ${JSON.stringify(englishPassage)}`);
  }
  console.log("✅ English passage/context verification: question metadata retains its passage and contextual text.");

  const unpunctuatedQuestion = parsePageText("47In May the rain fell incessantly.", {
    subject: "English", examType: "jamb", topic: "English", page: 1,
    year: 1985, yearRange: { start: 1985, end: 1985 }, lastQuestionNumber: 46,
  });
  if (unpunctuatedQuestion.lastQuestionNumber !== 47 || !unpunctuatedQuestion.previousLine.startsWith("47In")) {
    throw new Error(`A question number without punctuation was not captured: ${JSON.stringify(unpunctuatedQuestion)}`);
  }
  const qPrefixedQuestion = parsePageText("Q. 1. A question captured with a Q prefix.\nA. first B. second C. third D. fourth", {
    subject: "Commerce", examType: "jamb", topic: "Commerce", page: 1,
    year: 2020, yearRange: null, lastQuestionNumber: 0,
  });
  if (qPrefixedQuestion.questions[0]?.questionNumber !== 1 || qPrefixedQuestion.questions[0]?.options.length !== 4) {
    throw new Error(`Q-prefixed question headings were not parsed: ${JSON.stringify(qPrefixedQuestion.questions[0])}`);
  }

  const coverage = validateQuestionNumberCoverage([
    { year: 2020, questionNumber: 1 },
    { year: 2020, questionNumber: 2 },
    { year: 2020, questionNumber: 4 },
    { year: 2020, questionNumber: 5 },
  ], "jamb")[0];
  if (!coverage.belowMinimum || coverage.missingQuestionNumbers.join(",") !== "3") {
    throw new Error(`Incomplete yearly question coverage was not detected: ${JSON.stringify(coverage)}`);
  }
  const yearRangeCoverage = validateQuestionNumberCoverage([
    { year: 2020, questionNumber: 1 },
    { year: 2020, questionNumber: 1 },
  ], "jamb", { start: 2020, end: 2021 });
  if (yearRangeCoverage.length !== 2 || yearRangeCoverage[1].questionCount !== 0 || !yearRangeCoverage[0].duplicateQuestionNumbers.includes(1)) {
    throw new Error(`Expected missing advertised years and duplicate question numbers to be reported: ${JSON.stringify(yearRangeCoverage)}`);
  }
  const mathematicsCoverage = validateQuestionNumberCoverage([
    { year: 2020, questionNumber: 1 },
    { year: 2020, questionNumber: 130 },
  ], "jamb", null, "Mathematics")[0];
  if (mathematicsCoverage.questionCount !== 1 || mathematicsCoverage.lastQuestion !== 1) {
    throw new Error(`Out-of-range mathematics table labels should not inflate question coverage: ${JSON.stringify(mathematicsCoverage)}`);
  }
  const englishCoverage = validateQuestionNumberCoverage([
    { year: 2020, questionNumber: 85 },
  ], "jamb", null, "English")[0];
  if (englishCoverage.questionCount !== 1 || englishCoverage.lastQuestion !== 85) {
    throw new Error(`English's 100-question numbering range should be preserved: ${JSON.stringify(englishCoverage)}`);
  }
  console.log("✅ Coverage verification: detects missing question numbers and JAMB years below 40 questions.");

  const sampleFile = path.join(__dirname, "jamb", "BIOLOGY-JAMB-Past-Questions.pdf");
  if (!fs.existsSync(sampleFile)) throw new Error(`Sample PDF not found: ${sampleFile}`);

  const parser = new PDFParse({ data: new Uint8Array(fs.readFileSync(sampleFile)) });
  try {
    const extracted = await parser.getText();
    const range = findYearRange(extracted.pages[0]?.text ?? "");
    const yearRange = range;
    const metadata = detectFileMetadata(path.basename(sampleFile));
    let context = { subject: "Biology", examType: "jamb", topic: "Biology", page: 1, year: null, yearRange, inferYearsFromResets: true, lastQuestionNumber: 0, currentQuestion: null, previousLine: null, inferredYearResets: 0 };
    const questions = [];
    for (const page of extracted.pages) {
      const parsed = parsePageText(page.text, { ...context, page: page.num });
      questions.push(...parsed.questions);
      context = { ...context, year: parsed.year, topic: parsed.topic, lastQuestionNumber: parsed.lastQuestionNumber, currentQuestion: parsed.currentQuestion, previousLine: parsed.previousLine, inferredYearResets: parsed.inferredYearResets };
    }
    if (context.currentQuestion) questions.push(context.currentQuestion);
    const counts = new Map();
    for (const question of questions) {
      const key = question.year ?? "Unknown";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    console.log(`PDF pages: ${extracted.total}`);
    console.log(`Extracted text: ${extracted.text.length.toLocaleString()} characters`);
    console.log(`Detected cover years: ${range ? `${range.start}-${range.end}` : "none"}`);
    console.log(`Parsed questions: ${questions.length}`);
    console.log(`Inferred year boundaries: ${context.inferredYearResets}`);
    console.log("Questions per detected year:");
    for (const [year, count] of [...counts].sort(([a], [b]) => String(a).localeCompare(String(b), undefined, { numeric: true }))) {
      console.log(`  ${year}: ${count}`);
    }
    const coverage = validateQuestionNumberCoverage(questions, "jamb", yearRange);
    console.log(`Years requiring coverage review: ${coverage.filter((entry) => !entry.complete).map((entry) => `${entry.year} (${entry.questionCount} questions)`).join(", ") || "none"}`);
    console.log(`Questions with figure/image cues: ${questions.filter((question) => question._needsImage).length}`);
    console.log("Sample:", JSON.stringify(questions.slice(0, 2).map(({ year, questionNumber, question, options }) => ({ year, questionNumber, question, options })), null, 2));

    if (!questions.length) throw new Error("No questions were parsed from the sample PDF.");
    console.log("✅ PQ scraper verification passed.");
  } finally {
    await parser.destroy();
  }
}

testScraper().catch((error) => {
  console.error("❌ PQ scraper verification failed:", error.stack || error.message);
  process.exitCode = 1;
});
