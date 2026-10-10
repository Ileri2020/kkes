const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const modularUtils = require("./modularAIrefiner/enrich_pq_utils");
const modularAi = require("./modularAIrefiner/enrich_pq_ai");
const {
  parseArgs,
  getProviderBatchSize,
  buildPageContext,
  normalizeAnswer,
  getTopicPair,
  mergeEnrichment,
  loadQuestionFile,
  findTopicFile,
  buildBatchPrompt,
  getPendingQuestions,
  markQuestionUnresolved,
  mergeAndPersistSuggestedSubtopic,
  isRetryableApiError,
  isPendingQuestionError,
  isRequestTooLargeError,
  retryDelayFromError,
  getGeminiApiKeys,
  generateContentWithRateLimit,
} = require("./modularAIrefiner/enrich_pq");

const testArgs = process.argv.slice(2);
if (!testArgs.includes("--subject")) testArgs.push("--subject", "Economics");
if (!testArgs.includes("--year")) testArgs.push("--year", "1983");
if (!testArgs.includes("--check")) testArgs.push("--check");
const options = parseArgs(testArgs);
assert.equal(options.subject, options.subject.trim());
assert.equal(options.year, Number(options.year));
assert.equal(options.check, true);
assert.equal(options.limit, undefined);
assert.throws(() => parseArgs(["--subject", "Economics", "--year", "1983", "--limit", "20"]), /Unknown argument/);
assert.equal(parseArgs(["-all", "-openrouter"]).preferredProvider, "openrouter");
assert.equal(parseArgs(["-all", "-gemini"]).preferredProvider, "gemini");
assert.equal(parseArgs(["-all", "-resolve"]).resolve, true);
assert.equal(parseArgs(["--all", "--resolve"]).resolve, true);
assert.equal(getProviderBatchSize("gemini"), 20, "Gemini should process batches of 20");
assert.equal(getProviderBatchSize("openrouter"), 10, "OpenRouter should process batches of 10");
assert.throws(() => parseArgs(["-all", "-openrouter", "-gemini"]), /Choose only one preferred provider/);

const examRoot = path.resolve(__dirname, "../pq/jamb");
const loaded = loadQuestionFile(path.join(examRoot, "json"), options.subject, options.year);
assert.ok(loaded.matches.length > 0, `subject/year selector should find ${options.subject} records for ${options.year}`);
assert.ok(loaded.matches.every(({ question }) => Number(question.year) === options.year));

const topicsDirectory = path.resolve(__dirname, "../pq/jamb/topics");
const { data: topics } = findTopicFile(topicsDirectory, options.subject);
assert.ok(topics.subject.recommended_topics.length > 0, `${options.subject} should have topic/subtopic taxonomy`);
const topic = topics.subject.recommended_topics[0];
const original = {
  ...loaded.matches[0].question,
  year: options.year,
  questionNumber: 1,
  pageNumber: 2,
  question: "Short parsed prompt",
  options: ["A. one", "B. two", "C. three", "D. four"],
  answer: null,
  image: { localUrl: null, cloudinaryUrl: null },
  needsRescan: false,
  aiReviewed: false,
};
const enriched = mergeEnrichment(original, {
  question: "Complete prompt",
  passage: null,
  context: null,
  options: ["A. one", "B. two", "C. three", "D. four"],
  answer: "C. three",
  topic: topic.topic,
  subtopic: topic.subtopics[0],
  needsImage: false,
  needsHumanReview: false,
  reviewNote: null,
}, topics);
assert.equal(enriched.answer, "C");
assert.equal(enriched.question, "Complete prompt");
assert.equal(enriched.pageNumber, original.pageNumber);
assert.equal(enriched.pdfName, original.pdfName);
assert.equal(enriched.topic, topic.topic);
assert.equal(enriched.subtopic, topic.subtopics[0]);
assert.equal(enriched.aiReviewed, true);
assert.equal(enriched.needsRescan, false);
const resumeSelection = getPendingQuestions(
  [
    { question: { questionNumber: 1 } },
    { question: { questionNumber: 2 } },
    { question: { questionNumber: 3 } },
    { question: { questionNumber: 4 } },
  ],
  [
    { aiReviewed: true },
    { aiReviewed: false },
    {},
    { aiReviewed: false, aiResolved: false },
    { aiReviewed: false, aiResolved: false, aiAttempted: true, needsRescan: true, note: "AI returned invalid options" },
    { aiReviewed: false, aiResolved: false, needsRescan: true, note: "Legacy AI failure" },
  ],
);
assert.deepEqual(resumeSelection.map(({ index }) => index), [1, 2, 3], "default reruns should send untouched extracted records to AI and skip only reviewed or explicitly AI-attempted unresolved questions");
assert.equal(
  getPendingQuestions(
    Array.from({ length: 46 }, (_, index) => ({ question: { questionNumber: index + 1 } })),
    Array.from({ length: 46 }, () => ({ aiReviewed: false, aiResolved: false, needsRescan: false, note: null })),
  ).length,
  46,
  "an initialized checkpoint of extracted questions with default aiResolved=false values must still be sent to AI",
);
assert.deepEqual(
  getPendingQuestions(
    [1, 2, 3, 4, 5, 6].map((questionNumber) => ({ question: { questionNumber } })),
    [
      { aiReviewed: true },
      { aiReviewed: false },
      {},
      { aiReviewed: false, aiResolved: false },
      { aiReviewed: false, aiResolved: false, aiAttempted: true, needsRescan: true, note: "AI returned invalid options" },
      { aiReviewed: false, aiResolved: false, needsRescan: true, note: "Legacy AI failure" },
    ],
    true,
  ).map(({ index }) => index),
  [1, 2, 3, 4, 5],
  "-resolve should retry explicitly unresolved questions while still skipping AI-reviewed questions",
);
assert.equal(isRetryableApiError({ status: 429, message: "RESOURCE_EXHAUSTED" }), true);
assert.equal(isRetryableApiError({ status: 503, message: "Service unavailable" }), true);
assert.equal(isRequestTooLargeError({ message: "Input token count exceeds the maximum" }), true);
assert.equal(isPendingQuestionError(new Error("1 question(s) remain pending. Rerun the same command to retry only unfinished questions.")), true);
assert.equal(retryDelayFromError({ message: "Please retry in 12.5s" }), 12500);
assert.deepEqual(getGeminiApiKeys({
  GEMINI_API_KEY_2: " second ",
  GEMINI_API_KEY: "first",
  GEMINI_API_KEY_1: "third",
  GEMINI_API_KEY_4: "second",
  OTHER_API_KEY: "ignored",
}), ["first", "third", "second"], "Gemini keys should be ordered and duplicate values deduplicated");
assert.deepEqual(modularUtils.getOpenRouterApiKeys({
  OPENROUTER_API_KEY_2: " second ",
  OPENROUTER_API_KEY_1: "first",
  OPENROUTER_API_KEY_3: "second",
}), ["first", "second"], "OpenRouter keys should be ordered and duplicate values deduplicated");
const uniqueSubtopic = topics.subject.recommended_topics.flatMap((entry) => entry.subtopics.map((subtopic) => ({ entry, subtopic })))
  .find(({ entry, subtopic }) => topics.subject.recommended_topics.some((other) => other.topic !== entry.topic && other.subtopics.includes(subtopic)) === false);
assert.deepEqual(getTopicPair(topics, "Wrong topic", uniqueSubtopic.subtopic), {
  topic: null,
  subtopic: uniqueSubtopic.subtopic,
});
assert.deepEqual(getTopicPair(topics, "Not in syllabus", "A useful unlisted classification"), {
  topic: null,
  subtopic: "A useful unlisted classification",
});
const suggestionTaxonomy = { subject: { recommended_topics: [{ topic: "Known topic", subtopics: ["Known subtopic"] }] } };
assert.deepEqual(modularAi.registerSuggestedSubtopic(suggestionTaxonomy, "New suggested subtopic"), {
  added: true,
  subtopic: "New suggested subtopic",
});
assert.deepEqual(modularAi.registerSuggestedSubtopic(suggestionTaxonomy, "new-suggested-subtopic"), {
  added: false,
  subtopic: "New suggested subtopic",
});
assert.deepEqual(getTopicPair(suggestionTaxonomy, null, "new suggested subtopic"), {
  topic: null,
  subtopic: "New suggested subtopic",
});
assert.equal(normalizeAnswer("Option C", original.options), "C");
assert.equal(normalizeAnswer("Z", original.options), null);

const unresolved = markQuestionUnresolved(original, "AI returned duplicate, skipped, or out-of-order option labels.");
assert.equal(unresolved.aiResolved, false);
assert.equal(unresolved.aiAttempted, true, "only an actual failed AI attempt should mark a question as explicitly unresolved");
assert.equal(unresolved.aiReviewed, false);
assert.equal(unresolved.needsRescan, true);
assert.match(unresolved.note, /AI returned duplicate, skipped, or out-of-order option labels\./);

const unmatchedCategory = mergeEnrichment(original, {
  question: "Prompt",
  options: original.options,
  answer: "A",
  topic: "Not in syllabus",
  subtopic: "A useful unlisted classification",
  needsImage: false,
}, topics);
assert.equal(unmatchedCategory.topic, null);
assert.equal(unmatchedCategory.subtopic, "A useful unlisted classification");
assert.equal(unmatchedCategory.needsRescan, true);
assert.equal(typeof unmatchedCategory.needsRescan, "boolean");

const questionWithPassageContext = {
  ...original,
  passage: "A shared reading passage.",
  context: "Read the passage before answering.",
};
const preservedContext = modularAi.mergeEnrichment(questionWithPassageContext, {
  question: "Which word is stressed?",
  passage: null,
  context: null,
  options: original.options,
  answer: "B",
  topic: topic.topic,
  subtopic: topic.subtopics[0],
  needsImage: false,
  needsHumanReview: false,
}, topics);
assert.equal(preservedContext.passage, questionWithPassageContext.passage, "AI omission must not erase the shared passage");
assert.equal(preservedContext.context, questionWithPassageContext.context, "AI omission must not erase question context");
assert.equal(typeof preservedContext.needsRescan, "boolean");

const marginText = buildPageContext([
  { num: 1, text: "previous" },
  { num: 2, text: "current" },
  { num: 3, text: "next" },
  { num: 4, text: "too far" },
], 2, 1);
assert.match(marginText, /PDF page 1/);
assert.match(marginText, /PDF page 2/);
assert.match(marginText, /PDF page 3/);
assert.doesNotMatch(marginText, /too far/);

const batchPrompt = buildBatchPrompt([{
  index: 0,
  question: original,
  pageText: "PDF page 2 source text",
  screenshot: "base64-page",
}], topics);
assert.match(batchPrompt, /PDF page 2 source text/);
assert.match(batchPrompt, /pageImageIncluded/);
assert.match(batchPrompt, /compare the question carefully against ALL listed topics and subtopics/i);
assert.match(batchPrompt, /topic=null/);
assert.match(batchPrompt, /especially English\/Literature passage questions/i);
assert.match(batchPrompt, /similar words, stress/i);
assert.match(batchPrompt, /reuse an existing matching suggested subtopic exactly/i);

async function testApiKeyRotation() {
  const attempts = [0, 0];
  const pool = {
    models: [
      { generateContent: async () => { attempts[0] += 1; throw { status: 503, message: "temporarily unavailable" }; } },
      { generateContent: async () => { attempts[1] += 1; return "success"; } },
    ],
    nextKeyIndex: 0,
    lastRequestAt: 0,
    minIntervalMs: 0,
    retryBaseDelayMs: 0,
  };
  assert.equal(await generateContentWithRateLimit(pool, {}), "success");
  assert.deepEqual(attempts, [1, 1], "the next Gemini key should be attempted immediately when the first one fails");
  assert.equal(pool.nextKeyIndex, 1, "successful key is retained as the starting point for the next request");
}

async function testModularQuotaRotation() {
  const attempts = [0, 0];
  const pool = {
    models: [
      { generateContent: async () => { attempts[0] += 1; throw new Error("You exceeded your current quota"); } },
      { generateContent: async () => { attempts[1] += 1; return "success"; } },
    ],
    nextKeyIndex: 0,
    lastRequestAt: 0,
    minIntervalMs: 0,
    retryBaseDelayMs: 0,
  };
  assert.equal(await modularUtils.generateContentWithRateLimit(pool, {}), "success");
  assert.deepEqual(attempts, [1, 1], "quota text should rotate immediately to the next key");
  assert.equal(modularUtils.isQuotaLimitError({ message: "You exceeded your current quota" }), true);

  const exhaustedAttempts = [0, 0];
  const exhaustedPool = {
    models: exhaustedAttempts.map((_, index) => ({
      generateContent: async () => {
        exhaustedAttempts[index] += 1;
        throw new Error("You exceeded your current quota");
      },
    })),
    nextKeyIndex: 0,
    lastRequestAt: 0,
    minIntervalMs: 0,
  };
  await assert.rejects(modularUtils.generateContentWithRateLimit(exhaustedPool, {}), /2 round-robin passes/);
  assert.deepEqual(exhaustedAttempts, [2, 2], "each key should get one initial try and one final-round retry");
}

async function testOpenRouterFallbackAndRetries() {
  let capturedRequest;
  const routerModel = modularUtils.createOpenRouterModel("test-key", "test/model", async (url, request) => {
    capturedRequest = { url, request };
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ choices: [{ message: { content: "{\\\"ok\\\":true}" } }] }),
    };
  });
  const routerResponse = await routerModel.generateContent({
    contents: [{ role: "user", parts: [{ text: "Read this page" }, { inlineData: { data: "aGVsbG8=", mimeType: "image/png" } }] }],
    generationConfig: { responseMimeType: "application/json", maxOutputTokens: 250 },
  });
  assert.equal(routerResponse.response.text(), "{\\\"ok\\\":true}");
  assert.equal(capturedRequest.url, "https://openrouter.ai/api/v1/chat/completions");
  const routerBody = JSON.parse(capturedRequest.request.body);
  assert.equal(routerBody.model, "test/model");
  assert.equal(routerBody.max_tokens, 250);
  assert.equal(routerBody.response_format, undefined, "OpenRouter chat-completion requests should not send unsupported response_format metadata");
  assert.equal(typeof routerBody.messages[0].content, "string", "text-only OpenRouter models should receive a plain text prompt");
  assert.match(routerBody.messages[0].content, /Read this page/);
  assert.doesNotMatch(JSON.stringify(routerBody), /image_url|aGVsbG8=/, "PDF screenshots must not be sent to the text-only model");

  const unavailableModel = modularUtils.createOpenRouterModel("test-key", "test/model", async () => ({
    ok: false,
    status: 404,
    statusText: "Not Found",
    text: async () => JSON.stringify({ error: { message: "This model is unavailable for free" } }),
  }));
  await assert.rejects(unavailableModel.generateContent({}), (error) => error.code === "OPENROUTER_MODEL_UNAVAILABLE");
  assert.throws(() => modularUtils.createOpenRouterModel("test-key", "google/gemini-2.5-flash"), /non-Gemini OpenRouter model/);

  const providerRejectedModel = modularUtils.createOpenRouterModel("test-key", "openrouter/auto", async () => ({
    ok: false,
    status: 400,
    statusText: "Bad Request",
    text: async () => JSON.stringify({ error: { message: "Provider returned error" } }),
  }));
  const providerRejectionPool = {
    preferredProvider: "openrouter",
    openrouter: { models: [{ generateContent: (request) => providerRejectedModel.generateContent(request) }], nextKeyIndex: 0, lastRequestAt: 0, minIntervalMs: 0 },
    gemini: { models: [{ generateContent: async () => "Gemini after provider rejection" }], nextKeyIndex: 0, lastRequestAt: 0, minIntervalMs: 0 },
  };
  assert.equal(await modularUtils.generateContentWithFallback(providerRejectionPool, {}), "Gemini after provider rejection");

  const openRouterOnlyOrder = [];
  const openRouterOnlyPool = {
    preferredProvider: "openrouter",
    fallbackEnabled: false,
    openrouter: { models: [{ generateContent: async () => { openRouterOnlyOrder.push("openrouter"); throw Object.assign(new Error("provider rejected"), { code: "OPENROUTER_PROVIDER_ERROR" }); } }], providerName: "OpenRouter", exhaustedCode: "OPENROUTER_KEYS_EXHAUSTED", maxRounds: 1, nextKeyIndex: 0, lastRequestAt: 0, minIntervalMs: 0 },
    gemini: { models: [{ generateContent: async () => { openRouterOnlyOrder.push("gemini"); return "must not be called"; } }], nextKeyIndex: 0, lastRequestAt: 0, minIntervalMs: 0 },
  };
  await assert.rejects(modularUtils.generateContentWithFallback(openRouterOnlyPool, {}), (error) => error.code === "ALL_PROVIDERS_EXHAUSTED");
  assert.deepEqual(openRouterOnlyOrder, ["openrouter"], "-openrouter mode must not silently send requests to Gemini after OpenRouter fails");

  let openRouterAttempts = 0;
  const fallbackPool = {
    gemini: {
      models: [{ generateContent: async () => { throw Object.assign(new Error("Gemini keys exhausted"), { code: "GEMINI_KEYS_EXHAUSTED" }); } }],
      nextKeyIndex: 0,
      lastRequestAt: 0,
      minIntervalMs: 0,
    },
    openrouter: {
      models: [{ generateContent: async () => { openRouterAttempts += 1; return "openrouter success"; } }],
      providerName: "OpenRouter",
      exhaustedCode: "OPENROUTER_KEYS_EXHAUSTED",
      maxRounds: 3,
      nextKeyIndex: 0,
      lastRequestAt: 0,
      minIntervalMs: 0,
    },
  };
  assert.equal(await modularUtils.generateContentWithFallback(fallbackPool, {}), "openrouter success");
  assert.equal(openRouterAttempts, 1, "OpenRouter should run after Gemini pool exhaustion");
  assert.equal(fallbackPool.preferredProvider, "openrouter", "successful fallback should become preferred for subsequent requests");
  const stickyProviderOrder = [];
  fallbackPool.gemini.models[0].generateContent = async () => {
    stickyProviderOrder.push("gemini");
    throw Object.assign(new Error("Gemini keys exhausted"), { code: "GEMINI_KEYS_EXHAUSTED" });
  };
  fallbackPool.openrouter.models[0].generateContent = async () => {
    stickyProviderOrder.push("openrouter");
    return "openrouter remains active";
  };
  assert.equal(await modularUtils.generateContentWithFallback(fallbackPool, {}), "openrouter remains active");
  assert.deepEqual(stickyProviderOrder, ["openrouter"], "later requests should not retry the provider that already exhausted its keys");

  const providerOrder = [];
  const preferredOpenRouterPool = {
    preferredProvider: "openrouter",
    openrouter: { models: [{ generateContent: async () => { providerOrder.push("openrouter"); return "preferred"; } }], nextKeyIndex: 0, lastRequestAt: 0, minIntervalMs: 0 },
    gemini: { models: [{ generateContent: async () => { providerOrder.push("gemini"); return "fallback"; } }], nextKeyIndex: 0, lastRequestAt: 0, minIntervalMs: 0 },
  };
  assert.equal(await modularUtils.generateContentWithFallback(preferredOpenRouterPool, {}), "preferred");
  assert.deepEqual(providerOrder, ["openrouter"], "OpenRouter is attempted first when preferred and successful");

  const modelFallbackOrder = [];
  const unavailableModelPool = {
    preferredProvider: "openrouter",
    openrouter: { models: [{ generateContent: async () => { modelFallbackOrder.push("openrouter"); throw Object.assign(new Error("model unavailable"), { code: "OPENROUTER_MODEL_UNAVAILABLE" }); } }], nextKeyIndex: 0, lastRequestAt: 0, minIntervalMs: 0 },
    gemini: { models: [{ generateContent: async () => { modelFallbackOrder.push("gemini"); return "gemini after unavailable model"; } }], nextKeyIndex: 0, lastRequestAt: 0, minIntervalMs: 0 },
  };
  assert.equal(await modularUtils.generateContentWithFallback(unavailableModelPool, {}), "gemini after unavailable model");
  assert.deepEqual(modelFallbackOrder, ["openrouter", "gemini"], "unavailable OpenRouter model should fall back directly to Gemini");

  const fallbackOrder = [];
  const unavailableOpenRouterPool = {
    preferredProvider: "openrouter",
    openrouter: {
      models: [{ generateContent: async () => { fallbackOrder.push("openrouter"); throw { status: 503, message: "Service unavailable" }; } }],
      providerName: "OpenRouter", exhaustedCode: "OPENROUTER_KEYS_EXHAUSTED", maxRounds: 1, nextKeyIndex: 0, lastRequestAt: 0, minIntervalMs: 0, retryBaseDelayMs: 0,
    },
    gemini: { models: [{ generateContent: async () => { fallbackOrder.push("gemini"); return "gemini fallback"; } }], nextKeyIndex: 0, lastRequestAt: 0, minIntervalMs: 0 },
  };
  assert.equal(await modularUtils.generateContentWithFallback(unavailableOpenRouterPool, {}), "gemini fallback");
  assert.deepEqual(fallbackOrder, ["openrouter", "gemini"], "Gemini is attempted after preferred OpenRouter exhausts its configured rounds");

  const retryAttempts = [0, 0];
  const exhaustedOpenRouter = {
    models: retryAttempts.map((_, index) => ({
      generateContent: async () => {
        retryAttempts[index] += 1;
        throw { status: 503, message: "Service unavailable" };
      },
    })),
    providerName: "OpenRouter",
    exhaustedCode: "OPENROUTER_KEYS_EXHAUSTED",
    maxRounds: 3,
    nextKeyIndex: 0,
    lastRequestAt: 0,
    minIntervalMs: 0,
    retryBaseDelayMs: 0,
  };
  await assert.rejects(modularUtils.generateContentWithRateLimit(exhaustedOpenRouter, {}), /3 round-robin passes/);
  assert.deepEqual(retryAttempts, [3, 3], "each OpenRouter key should be tried once in each of three rounds");
}

async function testSuggestedSubtopicPersistence() {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "pq-topic-taxonomy-"));
  const topicFilePath = path.join(temporaryDirectory, "subject.json");
  const temporaryTopics = { subject: { recommended_topics: [{ topic: "Known topic", subtopics: ["Known subtopic"] }] } };
  fs.writeFileSync(topicFilePath, JSON.stringify(temporaryTopics), "utf8");
  try {
    const result = mergeAndPersistSuggestedSubtopic(original, {
      question: "Prompt",
      options: original.options,
      answer: "A",
      topic: null,
      subtopic: "A novel subtopic",
      needsImage: false,
    }, temporaryTopics, topicFilePath);
    assert.equal(result.topic, null);
    assert.equal(result.subtopic, "A novel subtopic");
    const savedTopics = JSON.parse(fs.readFileSync(topicFilePath, "utf8"));
    assert.deepEqual(savedTopics.subject.recommended_topics.at(-1), {
      topic: null,
      subtopics: ["A novel subtopic"],
    });

    const duplicateResult = mergeAndPersistSuggestedSubtopic(original, {
      question: "Prompt",
      options: original.options,
      answer: "A",
      topic: null,
      subtopic: "a-novel-subtopic",
      needsImage: false,
    }, temporaryTopics, topicFilePath);
    assert.equal(duplicateResult.subtopic, "A novel subtopic", "similar normalized suggestions reuse the persisted canonical name");
    assert.equal(JSON.parse(fs.readFileSync(topicFilePath, "utf8")).subject.recommended_topics.at(-1).subtopics.length, 1);
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

Promise.all([testApiKeyRotation(), testModularQuotaRotation(), testOpenRouterFallbackAndRetries(), testSuggestedSubtopicPersistence()]).then(() => {
  console.log("PQ enrichment tests passed (offline; no AI API requests made).");
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});