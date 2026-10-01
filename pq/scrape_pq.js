const fs = require("node:fs");
const path = require("node:path");
const { PDFParse } = require("pdf-parse");

// CLI composition root: this module links config, parser, rescans, and media,
// then calls the scraper when invoked directly with `node pq/scrape_pq.js`.
const {
  PDF_DIR,
  OUTPUT_FILE,
  MIN_QUESTIONS_PER_JAMB_YEAR,
  MIN_MULTIPLE_CHOICE_OPTIONS,
  findYearRange,
  namedYearFromHeader,
  yearFromHeader,
  isAnswerKeyLine,
  SUBJECT_RESCAN_PROFILES,
} = require("./config");

const {
  finalizeQuestion,
  isValidQuestionNumber,
  parsePageText,
  splitStoredOptions,
  normalizeQuestionOptions,
  extractEmbeddedOptions,
} = require("./parser");

const {
  normalizeSubjectFilters,
  detectFileMetadata,
  validateQuestionNumberCoverage,
  reloadSubjectQuestions,
  rescanIncompleteQuestions,
  rescanIncompleteQuestionsAcrossPages,
  rescanMissingQuestionNumbers,
  summarizeByYear,
  getQuestionGapSamples,
  getIncompleteOptionSamples,
  parseQuestionsFromText,
} = require("./rescan");

const {
  getCloudinary,
  uploadVisualPages,
  deduplicateQuestions,
  writeJsonAtomically,
  writeSubjectJsonFiles,
} = require("./media");

function formatPageNumbers(pages) {
  const sorted = [...new Set(pages.filter(Number.isInteger))].sort((left, right) => left - right);
  if (!sorted.length) return "none identified";
  const ranges = [];
  let start = sorted[0];
  let end = start;
  for (const page of sorted.slice(1)) {
    if (page === end + 1) {
      end = page;
      continue;
    }
    ranges.push(start === end ? `${start}` : `${start}-${end}`);
    start = page;
    end = page;
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);
  return ranges.join(", ");
}

function getIncompleteOptionPageSummary(questions) {
  const questionsByPage = new Map();
  for (const question of questions) {
    if (!(question.needsRescan || (question.options?.length ?? 0) < MIN_MULTIPLE_CHOICE_OPTIONS)) continue;
    const page = Number.isInteger(question._sourcePage) ? question._sourcePage : null;
    if (!questionsByPage.has(page)) questionsByPage.set(page, []);
    questionsByPage.get(page).push(`${question.year ?? "Unknown"}#${question.questionNumber}`);
  }
  return [...questionsByPage.entries()]
    .sort(([left], [right]) => (left ?? Number.MAX_SAFE_INTEGER) - (right ?? Number.MAX_SAFE_INTEGER))
    .map(([page, questionRefs]) => {
      const pageLabel = page === null
        ? "page unknown"
        : `page ${page} (also inspect adjacent pages ${formatPageNumbers([page - 1, page, page + 1, page + 2].filter((number) => number > 0))})`;
      return `${pageLabel}: ${questionRefs.join(", ")}`;
    });
}

function getQuestionNumberPageSummary(questions) {
  const questionsByPage = new Map();
  for (const question of questions) {
    const page = Number.isInteger(question._sourcePage) ? question._sourcePage : null;
    if (!questionsByPage.has(page)) questionsByPage.set(page, []);
    questionsByPage.get(page).push(`${question.year ?? "Unknown"}#${question.questionNumber}`);
  }
  return [...questionsByPage.entries()]
    .sort(([left], [right]) => (left ?? Number.MAX_SAFE_INTEGER) - (right ?? Number.MAX_SAFE_INTEGER))
    .map(([page, questionRefs]) => `page ${page ?? "unknown"}: ${questionRefs.join(", ")}`);
}

async function scrapePdfs(options = {}) {
  const outputFile = options.outputFile || OUTPUT_FILE;
  const uploadImages = options.uploadImages === true;
  const rescanSubjects = normalizeSubjectFilters(options.rescanSubjects);
  const files = fs.readdirSync(PDF_DIR).filter((name) => name.toLowerCase().endsWith(".pdf")).sort((a, b) => a.localeCompare(b));
  console.log("====================================================");
  console.log("🚀 STARTING PAST QUESTIONS PDF SCRAPE");
  console.log(`📁 Input directory: ${PDF_DIR}`);
  console.log(`📄 PDF files found: ${files.length}`);
  console.log(`☁️ Cloudinary images: ${uploadImages ? (getCloudinary() ? "enabled by --upload-images" : "requested, but credentials are missing") : "skipped by default (use --upload-images to enable)"}`);
  console.log(`🧰 Targeted subject rescans: ${rescanSubjects.length ? rescanSubjects.join(", ") : "all subjects"}`);
  console.log("====================================================\n");

  const allQuestions = [];
  const summary = [];
  if (!files.length) throw new Error(`No PDF files found in ${PDF_DIR}`);
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const filePath = path.join(PDF_DIR, file);
    const metadata = detectFileMetadata(file);
    let parser;
    console.log(`[${index + 1}/${files.length}] 📄 ${file}`);
    console.log(`   Subject: ${metadata.subject} | Exam: ${metadata.examType.toUpperCase()} | Size: ${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB`);
    try {
      parser = new PDFParse({ data: new Uint8Array(fs.readFileSync(filePath)) });
      const extracted = await parser.getText();
      const yearRange = findYearRange(extracted.pages.slice(0, 2).map((page) => page.text).join("\n"));
      console.log(`   Text extracted: ${extracted.text.length.toLocaleString()} chars across ${extracted.total} pages${yearRange ? ` | cover range ${yearRange.start}-${yearRange.end}` : " | no cover year range"}`);

      let context = { ...metadata, topic: metadata.subject, page: 1, year: null, yearRange, inferYearsFromResets: true, deferTrailingQuestion: true, lastQuestionNumber: 0, currentQuestion: null, previousLine: null, inferredYearResets: 0, pendingPassage: null, pendingContext: null, inAnswerKey: false };
      const questions = [];
      const pageRecords = [];
      const inferredYearResetPages = [];
      for (const page of extracted.pages) {
        const parsed = parsePageText(page.text, { ...context, page: page.num });
        if (parsed.inferredYearResets > context.inferredYearResets) inferredYearResetPages.push(page.num);
        const rescanned = reloadSubjectQuestions(parsed.questions, page.text, metadata.subject);
        questions.push(...rescanned.questions);
        const pageYears = new Set(rescanned.questions.map((question) => question.year).filter(Number.isInteger));
        if (Number.isInteger(parsed.year)) pageYears.add(parsed.year);
        if (Number.isInteger(context.year)) pageYears.add(context.year);
        pageRecords.push({ page: page.num, text: page.text, years: pageYears });
        context = { ...context, year: parsed.year, topic: parsed.topic, lastQuestionNumber: parsed.lastQuestionNumber, currentQuestion: parsed.currentQuestion, previousLine: parsed.previousLine, inferredYearResets: parsed.inferredYearResets, pendingPassage: parsed.pendingPassage, pendingContext: parsed.pendingContext, inAnswerKey: parsed.inAnswerKey };
        if (page.num % 25 === 0 || page.num === extracted.total) {
          console.log(`   Progress: page ${page.num}/${extracted.total}; ${questions.length} questions found so far`);
        }
      }
      if (context.currentQuestion) {
        const q = finalizeQuestion(context.currentQuestion);
        if (q.question && isValidQuestionNumber(q.questionNumber)) questions.push(q);
      }

      const crossPageRescan = rescanIncompleteQuestionsAcrossPages(questions, pageRecords, metadata.subject);
      if (crossPageRescan.recoveredCount) {
        console.log(`   🔄 ${crossPageRescan.recoveredCount} incomplete option set(s) recovered from adjacent source pages using the ${metadata.subject} reload.`);
      }

      let recoveredMissingNumbers = [];
      let unresolvedMissingNumbers = [];
      if (!rescanSubjects.length || rescanSubjects.includes(metadata.subject)) {
        const initialCoverage = validateQuestionNumberCoverage(questions, metadata.examType, yearRange, metadata.subject);
        const missingRescan = rescanMissingQuestionNumbers(questions, pageRecords, initialCoverage, metadata);
        questions.splice(0, questions.length, ...missingRescan.questions);
        recoveredMissingNumbers = missingRescan.recovered;
        unresolvedMissingNumbers = missingRescan.unresolved;
      }
      if (recoveredMissingNumbers.length) {
        console.log(`   ✅ Recovered missing question source page(s) in ${file}:`);
        for (const pageSummary of getQuestionNumberPageSummary(recoveredMissingNumbers)) console.log(`      ${pageSummary}`);
      }

      if (uploadImages) await uploadVisualPages(parser, questions, file);
      const yearCounts = summarizeByYear(questions, yearRange);
      const coverage = validateQuestionNumberCoverage(questions, metadata.examType, yearRange, metadata.subject);
      const unknownCount = questions.filter((question) => question.year === null).length;
      console.log(`   ✅ Parsed ${questions.length} questions; ${unknownCount} without a reliably detected year.`);
      console.log(`   🔁 Inferred year boundaries from question-number resets: ${context.inferredYearResets}`);
      if (inferredYearResetPages.length) console.log(`      Reset source page(s) in ${file}: ${formatPageNumbers(inferredYearResetPages)}.`);
      if (rescanSubjects.length && rescanSubjects.includes(metadata.subject)) console.log(`   🧭 Subject-specific rescans enabled for ${metadata.subject}.`);
      console.log("   📊 Question counts by year:");
      for (const [year, count] of yearCounts) console.log(`      ${year}: ${count}`);
      const incompleteYears = coverage.filter((entry) => !entry.complete);
      if (incompleteYears.length) {
        console.warn("   ⚠️ Year/question-number coverage needs review:");
        for (const entry of incompleteYears) {
          const issues = [];
          if (entry.belowMinimum) issues.push(`only ${entry.questionCount} questions (JAMB minimum ${MIN_QUESTIONS_PER_JAMB_YEAR})`);
          if (entry.missingQuestionNumbers.length) {
            const shown = entry.missingQuestionNumbers.slice(0, 12).join(", ");
            issues.push(`missing #${shown}${entry.missingQuestionNumbers.length > 12 ? ` (+${entry.missingQuestionNumbers.length - 12} more)` : ""}`);
          }
          if (entry.duplicateQuestionNumbers.length) {
            issues.push(`duplicate #${entry.duplicateQuestionNumbers.slice(0, 12).join(", ")}`);
          }
          console.warn(`      ${entry.year}: ${issues.join("; ")}`);
          const yearQuestionPages = questions.filter((question) => question.year === entry.year).map((question) => question._sourcePage);
          const yearPages = pageRecords.filter((record) => record.years.has(entry.year)).map((record) => record.page);
          console.warn(`         Source PDF page(s) for ${entry.year}: ${formatPageNumbers(yearPages.length ? yearPages : yearQuestionPages)}.`);
        }
        const missingQuestionSamples = getQuestionGapSamples(questions, incompleteYears, 10);
        if (missingQuestionSamples.length) {
          console.warn("   🔎 First 10 unfound question numbers with neighboring questions:");
          for (const sample of missingQuestionSamples) console.warn(`      ${JSON.stringify(sample)}`);
        }
      }
      if (yearRange && yearCounts.filter(([year, count]) => Number.isInteger(year) && count > 0).length < yearRange.end - yearRange.start + 1) {
        console.warn("   ⚠️ The PDF advertises a year range with years absent from the extracted text. Counts are shown as zero; check source labels before relying on inferred year boundaries.");
      }
      const unusualCounts = yearCounts.filter(([year, count]) => Number.isInteger(year) && count > 0 && (count < 20 || count > 75));
      if (unusualCounts.length) {
        console.warn(`   ⚠️ Unusual per-year counts (${unusualCounts.map(([year, count]) => `${year}: ${count}`).join(", ")}); this PDF may omit year labels or have incomplete year sections.`);
      }
      const missingImageCount = questions.filter((question) => question._needsImage && !question.image).length;
      if (missingImageCount) console.warn(`   ⚠️ ${missingImageCount} question(s) with figure/image cues have no Cloudinary URL.`);
      const incompleteOptionCount = questions.filter((question) => (question.options.length < MIN_MULTIPLE_CHOICE_OPTIONS) || question.needsRescan).length;
      if (incompleteOptionCount) {
        console.warn(`   ⚠️ ${incompleteOptionCount} question(s) have fewer than ${MIN_MULTIPLE_CHOICE_OPTIONS} valid answer choices and need rescan; source PDF: ${file}.`);
        for (const pageSummary of getIncompleteOptionPageSummary(questions)) console.warn(`      ${pageSummary}`);
      }
      const incompleteOptionSamples = getIncompleteOptionSamples(questions, 10);
      if (incompleteOptionSamples.length) {
        console.warn("   🔎 First 10 unresolved incomplete-option questions:");
        for (const sample of incompleteOptionSamples) console.warn(`      ${JSON.stringify(sample)}`);
      }
      if (unresolvedMissingNumbers.length) {
        console.warn(`   🔎 ${unresolvedMissingNumbers.length} missing question number(s) had no unique source match after the ${metadata.subject} reload; source PDF: ${file}.`);
        for (const missing of unresolvedMissingNumbers.slice(0, 12)) {
          const candidates = formatPageNumbers(missing.candidateSourcePages ?? []);
          const searched = formatPageNumbers(missing.searchedSourcePages ?? []);
          console.warn(`      ${missing.year} #${missing.questionNumber}: ${missing.matchingSourceCandidates} candidate(s); candidate page(s): ${candidates}; searched page(s): ${searched}`);
        }
      }
      if (unknownCount) {
        const unknownYearPages = questions.filter((question) => question.year === null).map((question) => question._sourcePage);
        console.warn(`   🗓️ Unknown-year source PDF page(s) in ${file}: ${formatPageNumbers(unknownYearPages)}.`);
      }
      summary.push({ file, subject: metadata.subject, type: metadata.examType, pages: extracted.total, questions: questions.length, recoveredQuestionNumbers: recoveredMissingNumbers.length, unresolvedQuestionNumbers: unresolvedMissingNumbers.length, unknownYear: unknownCount, inferredYearResets: context.inferredYearResets, incompleteYears: incompleteYears.length, incompleteOptions: incompleteOptionCount, years: Object.fromEntries(yearCounts) });
      allQuestions.push(...questions);
    } catch (error) {
      console.error(`   ❌ Failed: ${error.stack || error.message}`);
      summary.push({ file, subject: metadata.subject, type: metadata.examType, error: error.message, questions: 0 });
    } finally {
      if (parser) await parser.destroy().catch(() => {});
    }
  }

  const failedFiles = summary.filter((item) => item.error);
  if (failedFiles.length && !options.allowPartial) {
    throw new Error(`${failedFiles.length} PDF(s) failed; refusing to replace the existing JSON with a partial scrape. Re-run with --allow-partial to save successful PDFs only.`);
  }

  const uniqueQuestions = deduplicateQuestions(allQuestions);
  for (const question of uniqueQuestions) {
    delete question._sourcePage;
    delete question._needsImage;
  }
  writeJsonAtomically(outputFile, uniqueQuestions);
  const subjectFiles = writeSubjectJsonFiles(uniqueQuestions);

  const totals = summarizeByYear(uniqueQuestions);
  console.log("\n====================================================");
  console.log(`🎉 SCRAPE COMPLETE: ${uniqueQuestions.length.toLocaleString()} unique questions (${allQuestions.length.toLocaleString()} before duplicate removal)`);
  console.log(`💾 Local JSON: ${outputFile}`);
  console.log(`📚 Per-subject JSON files (${subjectFiles.length}): ${subjectFiles.map(({ file, count }) => `${file} (${count})`).join(", ") || "none"}`);
  console.log(`📊 Counts by exam year across all sources:`);
  for (const [year, count] of totals) console.log(`   ${year}: ${count}`);
  const diagnosticTotals = summary.reduce((totals, item) => ({
    recoveredQuestionNumbers: totals.recoveredQuestionNumbers + (item.recoveredQuestionNumbers ?? 0),
    unresolvedQuestionNumbers: totals.unresolvedQuestionNumbers + (item.unresolvedQuestionNumbers ?? 0),
    incompleteOptions: totals.incompleteOptions + (item.incompleteOptions ?? 0),
    incompleteYears: totals.incompleteYears + (item.incompleteYears ?? 0),
    unknownYear: totals.unknownYear + (item.unknownYear ?? 0),
  }), { recoveredQuestionNumbers: 0, unresolvedQuestionNumbers: 0, incompleteOptions: 0, incompleteYears: 0, unknownYear: 0 });
  console.log(`🧭 Rescan recovered ${diagnosticTotals.recoveredQuestionNumbers} missing question record(s) from unique source-page matches.`);
  console.log(`⚠️ Remaining: ${diagnosticTotals.incompleteOptions} question(s) need option review; ${diagnosticTotals.unresolvedQuestionNumbers} skipped question number(s) lack a unique source match; ${diagnosticTotals.incompleteYears} year section(s) have coverage warnings; ${diagnosticTotals.unknownYear} question(s) have unknown years.`);
  console.log("ℹ️ Missing/duplicate year numbers are not auto-filled: the source PDFs may omit sections or repeat them, so review the flagged page/source instead of generating guessed questions.");
  console.log("📋 File summary:");
  console.table(
    summary.map(({ file, subject, type, pages, questions, recoveredQuestionNumbers, unresolvedQuestionNumbers, unknownYear, inferredYearResets, incompleteYears, incompleteOptions, error }) => ({
      file,
      subject,
      type,
      pages,
      questions,
      recoveredQuestionNumbers,
      unresolvedQuestionNumbers,
      unknownYear,
      inferredYearResets,
      incompleteYears,
      incompleteOptions,
      status: error ? `FAILED (${error})` : "OK",
    }))
  );
  console.log("====================================================\n");
  return uniqueQuestions;
}

async function importLocalJsonToDatabase(file = OUTPUT_FILE) {
  if (!fs.existsSync(file)) throw new Error(`Local question JSON not found: ${file}. Run the scraper first without -db.`);
  if (!process.env.MONGODB_URL) throw new Error("MONGODB_URL is not configured; cannot import the local JSON into the database.");

  const questions = JSON.parse(fs.readFileSync(file, "utf8"));
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  let created = 0;
  let updated = 0;
  let skipped = 0;
  console.log(`📥 Importing ${questions.length.toLocaleString()} questions from ${file}`);
  try {
    const existingQuestions = await prisma.question.findMany({
      select: { id: true, year: true, questionNumber: true, examType: true, subject: true, prompt: true, imageUrl: true },
    });
    const keyOf = (question) => [
      question.year ?? "unknown",
      question.questionNumber ?? "unknown",
      String(question.examType || "jamb").toLowerCase(),
      String(question.subject || "General").trim().toLowerCase(),
      String(question.prompt || question.question || "").trim().toLowerCase().replace(/\s+/g, " "),
    ].join("|");
    const existingByKey = new Map(existingQuestions.map((question) => [keyOf(question), question]));
    const createQueue = [];
    const imageUpdates = [];

    for (let index = 0; index < questions.length; index += 1) {
      const question = questions[index];
      if (!question.question?.trim()) {
        skipped += 1;
        continue;
      }
      const data = {
        year: Number.isInteger(question.year) ? question.year : null,
        questionNumber: Number.isInteger(question.questionNumber) ? question.questionNumber : null,
        examType: question.type || "jamb",
        subject: question.subject || "General",
        topicName: question.topic || question.subject || "General",
        prompt: question.question.trim(),
        explanation: question.note || null,
        note: question.note || null,
        passage: question.passage || null,
        context: question.context || null,
        needsRescan: Boolean(question.needsRescan),
        imageUrl: question.image || null,
        type: "OBJECTIVE",
        option1: question.option1 || null,
        option2: question.option2 || null,
        option3: question.option3 || null,
        option4: question.option4 || null,
        option5: question.option5 || null,
        answer: question.answer || null,
      };
      const existing = existingByKey.get(keyOf(data));
      if (existing) {
        if (data.imageUrl && data.imageUrl !== existing.imageUrl) {
          imageUpdates.push({ id: existing.id, imageUrl: data.imageUrl });
        } else {
          skipped += 1;
        }
      } else {
        createQueue.push(data);
        existingByKey.set(keyOf(data), { id: null, imageUrl: data.imageUrl });
      }
    }

    console.log(`   Existing questions indexed: ${existingQuestions.length.toLocaleString()}`);
    for (let index = 0; index < createQueue.length; index += 250) {
      const batch = createQueue.slice(index, index + 250);
      await prisma.question.createMany({ data: batch });
      created += batch.length;
      console.log(`   DB create progress: ${Math.min(index + batch.length, createQueue.length)}/${createQueue.length} new questions`);
    }
    for (let index = 0; index < imageUpdates.length; index += 100) {
      const batch = imageUpdates.slice(index, index + 100);
      await Promise.all(batch.map(({ id, imageUrl }) => prisma.question.update({ where: { id }, data: { imageUrl } })));
      updated += batch.length;
      console.log(`   DB image progress: ${Math.min(index + batch.length, imageUpdates.length)}/${imageUpdates.length} updates`);
    }
  } finally {
    await prisma.$disconnect();
  }
  console.log(`✅ Database import complete: ${created} created, ${updated} updated, ${skipped} skipped.`);
}

function parseArgs(args) {
  const uploadImages = args.includes("--upload-images")
    && !args.includes("--skip-image-upload")
    && !args.includes("--no-images");
  const requestedRescanSubjects = args.filter((arg) => arg.startsWith("--rescan-subject=")).map((arg) => arg.slice("--rescan-subject=".length));
  const normalizedRescanSubjects = normalizeSubjectFilters(requestedRescanSubjects);
  const requestedNames = new Set(requestedRescanSubjects.flatMap((value) => value.split(",")).map((value) => value.trim().toLowerCase()).filter(Boolean));
  const normalizedNames = new Set(normalizedRescanSubjects.map((subject) => subject.toLowerCase()));
  const unknownSubjects = [...requestedNames].filter((subject) => !normalizedNames.has(subject));
  if (unknownSubjects.length) throw new Error(`Unknown --rescan-subject value(s): ${unknownSubjects.join(", ")}. Valid subjects: ${Object.keys(SUBJECT_RESCAN_PROFILES).join(", ")}.`);
  return {
    importDb: args.includes("-db") || args.includes("--db"),
    uploadImages,
    skipImageUpload: !uploadImages,
    outputFile: args.find((arg) => arg.startsWith("--output="))?.slice("--output=".length),
    inputFile: args.find((arg) => arg.startsWith("--input="))?.slice("--input=".length),
    rescanSubjects: normalizedRescanSubjects,
    allowPartial: args.includes("--allow-partial"),
  };
}

async function main(args = process.argv.slice(2)) {
  const options = parseArgs(args);
  if (options.importDb) return importLocalJsonToDatabase(options.inputFile || options.outputFile || OUTPUT_FILE);
  await scrapePdfs(options);
  if (args.includes("--import-after-scrape")) await importLocalJsonToDatabase();
}

if (require.main === module) {
  main().catch((error) => {
    console.error("\n❌ PQ scraper stopped:", error.stack || error.message);
    process.exitCode = 1;
  });
}

module.exports = { findYearRange, namedYearFromHeader, yearFromHeader, splitStoredOptions, normalizeQuestionOptions, extractEmbeddedOptions, rescanIncompleteQuestions, reloadSubjectQuestions, rescanIncompleteQuestionsAcrossPages, rescanMissingQuestionNumbers, getIncompleteOptionSamples, getQuestionGapSamples, isAnswerKeyLine, parseQuestionsFromText, parsePageText, detectFileMetadata, validateQuestionNumberCoverage, formatPageNumbers, getIncompleteOptionPageSummary, getQuestionNumberPageSummary, parseArgs, scrapePdfs, writeSubjectJsonFiles, importLocalJsonToDatabase, main };
