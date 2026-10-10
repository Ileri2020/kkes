#!/usr/bin/env node

const {
  fs,
  path,
  dotenv,
  GoogleGenerativeAI,
  PDFParse,
  ROOT,
  DEFAULT_MODEL,
  DEFAULT_OPENROUTER_MODEL,
  GEMINI_BATCH_SIZE,
  OPENROUTER_BATCH_SIZE,
  OPENROUTER_MIN_REQUEST_INTERVAL_MS,
  getProviderBatchSize,
  usage,
  parseArgs,
  normalize,
  sameSubject,
  getExamPaths,
  readJson,
  findTopicFile,
  loadQuestionFile,
  getPendingQuestions,
  isPreviouslyUnresolved,
  isRetryableApiError,
  isRequestTooLargeError,
  isPendingQuestionError,
  retryDelayFromError,
  generateContentWithRateLimit,
  getGeminiApiKeys,
  getOpenRouterApiKeys,
  createOpenRouterModel,
  OPENROUTER_ROUND_ROBIN_PASSES,
} = require("./enrich_pq_utils");

const {
  normalizeOptions,
  normalizeAnswer,
  getTopicPair,
  registerSuggestedSubtopic,
  buildPageContext,
  buildPrompt,
  buildBatchPrompt,
  screenshotPage,
  callGeminiBatch: callGeminiBatchFromAI,
  mergeEnrichment: mergeEnrichmentFromAI,
} = require("./enrich_pq_ai");

const callGeminiBatch = callGeminiBatchFromAI;
const mergeEnrichment = mergeEnrichmentFromAI;

function atomicWrite(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  fs.renameSync(temporary, filePath);
}

function markQuestionUnresolved(question, reason, extraNote) {
  const message = String(reason ?? "AI could not resolve this question after the retry limit.").trim();
  const noteParts = [question?.note, message, extraNote].filter((value) => value !== undefined && value !== null && String(value).trim() !== "");
  return {
    ...question,
    question: String(question?.question ?? "").trim() || question?.question || null,
    passage: question?.passage ?? null,
    context: question?.context ?? null,
    options: Array.isArray(question?.options) ? question.options : [],
    answer: question?.answer ?? null,
    topic: question?.topic ?? null,
    subtopic: question?.subtopic ?? null,
    needsImage: Boolean(question?.needsImage),
    needsRescan: true,
    aiReviewed: false,
    aiResolved: false,
    aiAttempted: true,
    note: noteParts.map((part) => String(part).trim()).join(" | ") || null,
  };
}

function mergeAndPersistSuggestedSubtopic(question, result, topics, topicFilePath) {
  const enriched = mergeEnrichment(question, result, topics);
  if (enriched.topic !== null || !enriched.subtopic) return enriched;

  const registration = registerSuggestedSubtopic(topics, enriched.subtopic);
  enriched.subtopic = registration.subtopic;
  if (registration.added) {
    atomicWrite(topicFilePath, topics);
    console.log(`Added suggested subtopic to ${topicFilePath}: ${registration.subtopic}`);
  }
  return enriched;
}

async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) return usage();
  if (options.all) return runAll(options);
  return runYear(options);
}

function discoverAllSubjectYears(paths) {
  const sourceFiles = fs.readdirSync(paths.jsonDirectory)
    .filter((file) => file.toLowerCase().endsWith(".json"))
    .sort((left, right) => left.localeCompare(right));
  const records = sourceFiles.flatMap((filename) => {
    const data = readJson(path.join(paths.jsonDirectory, filename));
    return Array.isArray(data) ? data : [];
  });
  const topicFiles = fs.readdirSync(paths.topicsDirectory)
    .filter((file) => file.toLowerCase().endsWith(".json"))
    .sort((left, right) => left.localeCompare(right));
  const tasks = [];

  for (const filename of topicFiles) {
    const topicFilePath = path.join(paths.topicsDirectory, filename);
    const topics = readJson(topicFilePath);
    const subject = String(topics.subject?.name || topics.subject?.code || path.basename(filename, path.extname(filename))).trim();
    if (!subject || !Array.isArray(topics.subject?.recommended_topics) || topics.subject.recommended_topics.length === 0) {
      console.warn(`Skipping taxonomy without a subject name or recommended topics: ${topicFilePath}`);
      continue;
    }

    const countsByYear = new Map();
    for (const question of records) {
      const year = Number(question.year);
      if (!sameSubject(question.subject, subject) || !Number.isInteger(year) || year < 1900 || year > 2100) continue;
      countsByYear.set(year, (countsByYear.get(year) ?? 0) + 1);
    }
    for (const [year, count] of countsByYear) {
      tasks.push({ subject, year, count, topicFilePath });
    }
  }

  return tasks.sort((left, right) => right.year - left.year || left.subject.localeCompare(right.subject));
}

async function runAll(options) {
  const paths = getExamPaths(options.exam);
  for (const requiredDirectory of [paths.pdfDirectory, paths.jsonDirectory, paths.topicsDirectory]) {
    if (!fs.existsSync(requiredDirectory)) throw new Error(`Required input directory not found: ${requiredDirectory}`);
  }
  const tasks = discoverAllSubjectYears(paths);
  if (!tasks.length) throw new Error(`No subject/year questions matched topic files under ${paths.topicsDirectory}.`);

  console.log(`Found ${tasks.length} available subject/year combination(s) across ${new Set(tasks.map(({ subject }) => subject)).size} subject(s).`);
  console.log("Processing order: newest available year first, then subject name. Each subject/year is completed sequentially before the next starts.");
  if (options.check) {
    for (const [index, task] of tasks.entries()) {
      console.log(`${index + 1}. ${task.subject} ${task.year}: ${task.count} question(s)`);
    }
    console.log("All-mode input check passed. No AI requests were made.");
    return;
  }

  let completed = 0;
  const failedTasks = [];
  for (const [index, task] of tasks.entries()) {
    console.log(`\n=== All-mode ${index + 1}/${tasks.length}: ${task.subject} ${task.year} (${task.count} questions) ===`);
    try {
      await runYear({ ...options, all: false, subject: task.subject, year: task.year });
      completed += 1;
    } catch (error) {
      failedTasks.push({ task, error });
      console.error(`Could not finish ${task.subject} ${task.year} (${error.message}); its checkpoint is preserved where possible. Continuing with the next subject/year combination.`);
    }
  }
  console.log(`All-mode reached the end: ${completed}/${tasks.length} subject/year combinations completed; ${failedTasks.length} combination(s) need another attempt.`);
  if (failedTasks.length) {
    const failedLabels = failedTasks.map(({ task }) => `${task.subject} ${task.year}`).join(", ");
    const summaryError = new Error(`All-mode processed every combination but ${failedTasks.length} failed: ${failedLabels}. Rerun -all to resume those combinations.`);
    summaryError.code = "ALL_MODE_INCOMPLETE";
    throw summaryError;
  }
}

async function runYear(options) {
  const paths = getExamPaths(options.exam);
  for (const requiredDirectory of [paths.pdfDirectory, paths.jsonDirectory, paths.topicsDirectory]) {
    if (!fs.existsSync(requiredDirectory)) throw new Error(`Required input directory not found: ${requiredDirectory}`);
  }

  const { matches } = loadQuestionFile(paths.jsonDirectory, options.subject, options.year);
  if (!matches.length) throw new Error(`No questions found for subject "${options.subject}" in ${options.year} under ${paths.jsonDirectory}.`);
  const topicFile = findTopicFile(paths.topicsDirectory, options.subject);
  const topics = topicFile.data;
  const selected = matches;

  const pdfFiles = new Set();
  for (const { question } of selected) {
    if (!question.pdfName || path.basename(question.pdfName) !== question.pdfName) {
      throw new Error(`Question ${question.questionNumber} has no safe pdfName; rerun the scraper with page/pdf metadata before enrichment.`);
    }
    const pdfPath = path.join(paths.pdfDirectory, question.pdfName);
    if (!fs.existsSync(pdfPath)) throw new Error(`Source PDF not found for question ${question.questionNumber}: ${pdfPath}`);
    if (!Number.isInteger(question.pageNumber) || question.pageNumber < 1) {
      throw new Error(`Question ${question.questionNumber} has no valid pageNumber; rerun the scraper before enrichment.`);
    }
    pdfFiles.add(question.pdfName);
  }

  const outputSubject = normalize(topics.subject?.name || options.subject);
  if (!outputSubject) throw new Error(`Could not derive a safe output folder name for subject "${options.subject}".`);
  const outputDirectory = path.join(paths.directory, "aijson", outputSubject);
  const outputFile = path.join(outputDirectory, `${outputSubject}${options.year}.json`);
  console.log(`Selected all ${selected.length} ${options.subject} ${options.year} question(s) from ${pdfFiles.size} source PDF(s).`);
  console.log(`Topic syllabus: ${topicFile.filePath}`);
  console.log(`All selected questions will be analyzed in batches of up to ${options.preferredProvider === "openrouter" ? OPENROUTER_BATCH_SIZE : GEMINI_BATCH_SIZE} with ${options.preferredProvider === "openrouter" ? "OpenRouter" : "Gemini"}; source JSON files will not be modified.`);
  console.log(`AI output: ${outputFile}`);
  if (options.check) {
    console.log("Input check passed. No AI requests were made.");
    return;
  }

  dotenv.config({ path: path.join(ROOT, ".env") });
  const apiKeys = getGeminiApiKeys();
  const openRouterKeys = getOpenRouterApiKeys();
  if (!apiKeys.length && !openRouterKeys.length) throw new Error("No Gemini or OpenRouter API key variables are configured in the project .env.");
  const modelPool = {
    preferredProvider: options.preferredProvider,
    fallbackEnabled: options.preferredProvider !== "openrouter",
    gemini: {
    models: apiKeys.map((apiKey) => new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: options.model })),
    nextKeyIndex: 0,
    lastRequestAt: 0,
    },
    openrouter: {
      models: openRouterKeys.map((apiKey) => createOpenRouterModel(apiKey, process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL)),
      providerName: "OpenRouter",
      exhaustedCode: "OPENROUTER_KEYS_EXHAUSTED",
      maxRounds: OPENROUTER_ROUND_ROBIN_PASSES,
      minIntervalMs: OPENROUTER_MIN_REQUEST_INTERVAL_MS,
      nextKeyIndex: 0,
      lastRequestAt: 0,
    },
  };
  console.log(`Loaded ${apiKeys.length} Gemini and ${openRouterKeys.length} OpenRouter API key(s); secret values are not displayed.`);
  console.log(`Preferred provider: ${options.preferredProvider === "openrouter" ? "OpenRouter" : "Gemini"}; the other provider is fallback.`);

  let enrichedQuestions = selected.map(({ question }) => ({
    ...question,
    needsRescan: question.needsRescan === true,
    aiReviewed: question.aiReviewed === true,
    aiResolved: question.aiResolved ?? (question.aiReviewed === true),
  }));
  if (fs.existsSync(outputFile)) {
    try {
      const previousOutput = readJson(outputFile);
      const matchesSource = Array.isArray(previousOutput)
        && previousOutput.length === selected.length
        && previousOutput.every((record, index) => {
          const source = selected[index].question;
          return record.year === source.year
            && record.questionNumber === source.questionNumber
            && record.pageNumber === source.pageNumber
            && record.pdfName === source.pdfName
            && sameSubject(record.subject, options.subject);
        });
      if (matchesSource) enrichedQuestions = previousOutput.map((question) => ({
        ...question,
        needsRescan: question.needsRescan === true,
      }));
      else console.warn("Existing AI output does not match the selected source records; starting a fresh analysis.");
    } catch {
      console.warn("Existing AI output is invalid JSON; starting a fresh analysis.");
    }
  }

  // Create the destination before expensive PDF parsing/API work. Each successful batch
  // overwrites this checkpoint, so an interrupted run can resume without losing progress.
  atomicWrite(outputFile, enrichedQuestions);
  console.log(`Initialized/resumed output file: ${outputFile}`);

  const pdfCache = new Map();
  const screenshotCache = new Map();
  try {
    const previouslyReviewed = enrichedQuestions.filter((question) => question.aiReviewed === true).length;
    const previouslyUnresolved = enrichedQuestions.filter(isPreviouslyUnresolved).length;
    const pending = getPendingQuestions(selected, enrichedQuestions, options.resolve === true);
    const unresolvedResumeMessage = options.resolve
      ? `retrying ${previouslyUnresolved} previously unresolved question(s) due to -resolve`
      : `skipping ${previouslyUnresolved} previously unresolved question(s)`;
    console.log(`Resume status: skipping ${previouslyReviewed} AI-reviewed question(s), ${unresolvedResumeMessage}; ${pending.length} remain.`);
    if (!pending.length) {
      console.log(`All ${selected.length} questions are already processed (AI-reviewed or marked unresolved) in ${outputFile}.`);
      return;
    }
    console.log(`Starting ${pending.length} pending question(s); batch size will be ${getProviderBatchSize(modelPool.preferredProvider)} for ${modelPool.preferredProvider === "openrouter" ? "OpenRouter" : "Gemini"}.`);
    let failedQuestions = 0;
    let offset = 0;
    let batchNumber = 0;
    while (offset < pending.length) {
      const currentBatchSize = getProviderBatchSize(modelPool.preferredProvider);
      const pendingBatch = pending.slice(offset, offset + currentBatchSize);
      batchNumber += 1;
      const batch = [];
      for (const { question, index } of pendingBatch) {
        const cacheKey = question.pdfName;
        if (!pdfCache.has(cacheKey)) {
          console.log(`Reading source PDF: ${question.pdfName}`);
          const parser = new PDFParse({ data: new Uint8Array(fs.readFileSync(path.join(paths.pdfDirectory, question.pdfName))) });
          const extracted = await parser.getText();
          pdfCache.set(cacheKey, { parser, pages: extracted.pages ?? [] });
        }
        const { parser, pages } = pdfCache.get(cacheKey);
        const pageText = buildPageContext(pages, question.pageNumber, options.margin);
        const screenshotKey = `${cacheKey}:${question.pageNumber}`;
        if (!screenshotCache.has(screenshotKey)) screenshotCache.set(screenshotKey, await screenshotPage(parser, question.pageNumber));
        const screenshot = screenshotCache.get(screenshotKey);
        if (!pageText && !screenshot) {
          console.warn(`Warning: no selectable text or rendered page image for ${question.pdfName} p.${question.pageNumber}; AI will receive the parsed JSON record only.`);
        }
        batch.push({ index, question, pageText, screenshot });
      }

      console.log(`Analyzing batch ${batchNumber} (${batch.length} question(s), ${modelPool.preferredProvider === "openrouter" ? "OpenRouter" : "Gemini"}); remaining questions will continue until all ${pending.length} pending questions are done...`);
      offset += pendingBatch.length;
      let aiResults;
      try {
        aiResults = await callGeminiBatch(modelPool, batch, topics);
      } catch (error) {
        for (const item of batch) {
          enrichedQuestions[item.index] = markQuestionUnresolved(item.question, error.message);
          failedQuestions += 1;
          console.warn(`Q${item.question.questionNumber} remains unresolved after AI batch failure (${error.message}); saved with aiResolved=false.`);
        }
        atomicWrite(outputFile, enrichedQuestions);
        console.warn(`Checkpoint saved after AI failure in batch ${batchNumber}; continuing with the next batch.`);
        continue;
      }
      const resultById = new Map();
      for (const result of aiResults) {
        if (!Number.isInteger(result?.id) || resultById.has(result.id)) {
          throw new Error(`AI batch ${batchNumber} returned a missing or duplicate question id.`);
        }
        resultById.set(result.id, result);
      }
      if (resultById.size !== batch.length || batch.some(({ index }) => !resultById.has(index))) {
        throw new Error(`AI batch ${batchNumber} did not return exactly one result for every question.`);
      }
      for (const item of batch) {
        let enriched;
        try {
          enriched = mergeAndPersistSuggestedSubtopic(item.question, resultById.get(item.index), topics, topicFile.filePath);
        } catch (firstError) {
          try {
            console.warn(`Q${item.question.questionNumber} returned invalid enrichment (${firstError.message}); retrying that question alone.`);
            const retryResults = await callGeminiBatch(modelPool, [item], topics);
            enriched = mergeAndPersistSuggestedSubtopic(item.question, retryResults[0], topics, topicFile.filePath);
          } catch (retryError) {
            failedQuestions += 1;
            const unresolved = markQuestionUnresolved(item.question, retryError?.message || "AI returned duplicate, skipped, or out-of-order option labels.");
            enrichedQuestions[item.index] = unresolved;
            atomicWrite(outputFile, enrichedQuestions);
            console.warn(`Q${item.question.questionNumber} remains pending after retry: ${retryError.message}`);
            console.warn(`Persisted unresolved question object at index ${item.index} with aiResolved=false.`);
            continue;
          }
        }
        enrichedQuestions[item.index] = enriched;
        console.log(`[${item.index + 1}/${selected.length}] Q${item.question.questionNumber}: ${enriched.topic ?? "unclassified"} > ${enriched.subtopic ?? "no subtopic"}; answer=${enriched.answer ?? "unresolved"}; options=${enriched.options.length}; needsImage=${enriched.needsImage}; review=${enriched.needsRescan}`);
      }
      atomicWrite(outputFile, enrichedQuestions);
      console.log(`Checkpoint saved (${enrichedQuestions.filter((question) => question.aiReviewed).length}/${selected.length} verified).`);
      if (options.delayMs && offset < pending.length) {
        await new Promise((resolve) => setTimeout(resolve, options.delayMs));
      }
    }

    atomicWrite(outputFile, enrichedQuestions);
    const completedCount = enrichedQuestions.filter((question) => question.aiReviewed === true).length;
    const unresolvedCount = enrichedQuestions.filter(isPreviouslyUnresolved).length;
    const processedCount = enrichedQuestions.filter((question) => question.aiReviewed === true || isPreviouslyUnresolved(question)).length;
    console.log(`Run finished: ${completedCount}/${selected.length} questions verified; ${unresolvedCount} marked unresolved; output checkpoint: ${outputFile}.`);
    if (failedQuestions > 0) {
      console.warn(`${failedQuestions} question(s) were marked unresolved; use -resolve to retry them on a later run.`);
    }
    if (processedCount < selected.length) {
      throw new Error(`${selected.length - processedCount} question(s) remain unprocessed. Rerun the same command to continue.`);
    }
    console.log(`Enrichment complete: all ${selected.length} questions are processed; unresolved questions are recorded with aiResolved=false.`);
  } finally {
    await Promise.all([...pdfCache.values()].map(({ parser }) => parser.destroy().catch(() => {})));
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`PQ enrichment stopped: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  main,
  discoverAllSubjectYears,
  markQuestionUnresolved,
  mergeAndPersistSuggestedSubtopic,
  parseArgs,
  normalize,
  sameSubject,
  buildPageContext,
  normalizeOptions,
  normalizeAnswer,
  getTopicPair,
  mergeEnrichment,
  loadQuestionFile,
  findTopicFile,
  buildBatchPrompt,
  getPendingQuestions,
  getProviderBatchSize,
  isRetryableApiError,
  isRequestTooLargeError,
  isPendingQuestionError,
  isPendingQuestionError,
  isPendingQuestionError,
  retryDelayFromError,
  getGeminiApiKeys,
  generateContentWithRateLimit,
  getOpenRouterApiKeys,
  createOpenRouterModel,
};