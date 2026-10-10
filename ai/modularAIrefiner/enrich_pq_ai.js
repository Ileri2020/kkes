const {
  normalize,
  isRetryableApiError,
  isRequestTooLargeError,
  extractText,
  generateContentWithFallback,
} = require("./enrich_pq_utils");

function parseModelJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("AI returned no JSON object.");
    return JSON.parse(text.slice(start, end + 1));
  }
}

function normalizeOptions(options) {
  if (!Array.isArray(options)) throw new Error("AI response options must be an array.");
  if (options.length > 5) throw new Error("AI returned more than five answer options.");
  const parsed = options.map((option) => {
    const text = String(option ?? "").trim();
    const match = text.match(/^([A-E])\s*[.)-]?\s*(.*)$/i);
    return { label: match?.[1]?.toUpperCase() ?? null, text: (match ? match[2] : text).trim() };
  }).filter((option) => option.text);
  const labeled = parsed.some((option) => option.label !== null);
  if (labeled && parsed.some((option) => option.label === null)) throw new Error("AI returned a mixture of labeled and unlabeled options.");
  if (labeled && parsed.some((option, index) => option.label !== String.fromCharCode(65 + index))) {
    throw new Error("AI returned duplicate, skipped, or out-of-order option labels.");
  }
  return parsed.map((option, index) => `${option.label ?? String.fromCharCode(65 + index)}. ${option.text}`);
}

function normalizeAnswer(answer, options) {
  if (answer === null || answer === undefined || String(answer).trim() === "") return null;
  const text = String(answer).trim();
  const letter = text.match(/^(?:option\s*)?([A-E])(?:\b|[.)])/i)?.[1]?.toUpperCase();
  if (letter) return options.some((option) => option.startsWith(`${letter}.`)) ? letter : null;
  const matched = options.find((option) => normalize(option.slice(3)) === normalize(text));
  return matched?.[0] ?? null;
}

function getTopicPair(topics, topic, subtopic) {
  const entries = topics.subject?.recommended_topics;
  if (!Array.isArray(entries)) throw new Error("Topic file must provide subject.recommended_topics.");
  const topicEntry = entries.find((entry) => (topic === null ? entry.topic === null : normalize(entry.topic) === normalize(topic)));
  const matchedSubtopic = (topicEntry?.subtopics ?? []).find((entry) => normalize(entry) === normalize(subtopic));
  if (topicEntry && matchedSubtopic) return { topic: topicEntry.topic, subtopic: matchedSubtopic };

  return {
    topic: null,
    subtopic: typeof subtopic === "string" && subtopic.trim() ? subtopic.trim() : null,
  };
}

function registerSuggestedSubtopic(topics, subtopic) {
  const suggested = typeof subtopic === "string" ? subtopic.trim() : "";
  if (!suggested) return { added: false, subtopic: null };
  const entries = topics.subject?.recommended_topics;
  if (!Array.isArray(entries)) throw new Error("Topic file must provide subject.recommended_topics.");

  let nullTopicEntry = entries.find((entry) => entry.topic === null);
  if (!nullTopicEntry) {
    nullTopicEntry = { topic: null, subtopics: [] };
    entries.push(nullTopicEntry);
  }
  if (!Array.isArray(nullTopicEntry.subtopics)) nullTopicEntry.subtopics = [];
  const existing = nullTopicEntry.subtopics.find((entry) => normalize(entry) === normalize(suggested));
  if (existing) return { added: false, subtopic: existing };
  nullTopicEntry.subtopics.push(suggested);
  return { added: true, subtopic: suggested };
}

function pageNumberOf(page, fallback) {
  return Number.isInteger(page?.num) ? page.num : fallback;
}

function buildPageContext(pages, pageNumber, margin) {
  return pages
    .map((page, index) => ({ page: pageNumberOf(page, index + 1), text: page.text ?? "" }))
    .filter(({ page, text }) => page >= Math.max(1, pageNumber - margin)
      && page <= pageNumber + margin && text.trim())
    .map(({ page, text }) => `--- PDF page ${page} ---\n${text.trim()}`)
    .join("\n\n");
}

function buildPrompt(question, sourcePageText, topicData, hasLinkedImage) {
  const topicEntries = topicData.subject.recommended_topics.map((entry) => ({ topic: entry.topic, subtopics: entry.subtopics ?? [] }));
  return `You are reviewing one parsed multiple-choice past-exam question. Use the supplied PDF page image and page text (including neighboring-page margin), not outside answer keys.

Tasks:
1. Return the complete question wording and all essential passage/context visible in the source. The question object's context is often required to understand the question, especially English/Literature passage questions and items about similar words, stress, or related language tasks. Keep the shared passage in passage and question-specific supporting material in context. Never omit source context needed to understand the item; preserve an existing passage/context when it is not fully repeated on this page, and do not invent missing source text.
2. Return the complete answer options visible for this question in the PDF. Do not invent choices. Keep their A-E labels. If fewer than four choices can be reliably recovered, return the recoverable choices and set needsHumanReview=true.
3. Choose the correct answer from the options if it can be solved confidently. Return only its letter A-E; otherwise answer=null and needsHumanReview=true.
4. Categorize it using the supplied syllabus. First compare the question carefully against ALL supplied topics and subtopics, and choose the closest accurate syllabus pair whenever reasonably possible. Do not invent categories merely because another listed topic seems less exact. Only if no supplied topic/subtopic pair can accurately classify the question, return topic=null and a concise best-fit subtopic in your own words. The syllabus may contain a topic:null entry with subtopics suggested for earlier questions; reuse an existing matching suggested subtopic exactly instead of creating a differently worded duplicate.
5. Set needsImage=true only when understanding the question depends on a diagram, figure, graph, table, or other visual that is not already linked on the question object. If it does not depend on a missing visual, set false.
6. Be conservative: if prompt/context/options/answer are uncertain, mark needsHumanReview=true and explain briefly in reviewNote.

Return exactly one JSON object with fields: question, passage, context, options, answer, topic, subtopic, needsImage, needsHumanReview, reviewNote. Include passage/context whenever needed to make the question independently understandable. No markdown or extra prose.

Question record (source metadata is read-only):
${JSON.stringify({ year: question.year, questionNumber: question.questionNumber, pageNumber: question.pageNumber, pdfName: question.pdfName, question: question.question, passage: question.passage, context: question.context, options: question.options, answer: question.answer, topic: question.topic, hasLinkedImage }, null, 2)}

Allowed topic/subtopic values:
${JSON.stringify(topicEntries, null, 2)}

Source PDF page text:
${sourcePageText.slice(0, 26000)}`;
}

async function screenshotPage(parser, pageNumber) {
  try {
    const screenshot = await parser.getScreenshot({
      partial: [pageNumber],
      desiredWidth: 1400,
      imageBuffer: true,
      imageDataUrl: false,
    });
    const data = screenshot.pages?.[0]?.data;
    if (!data?.length) return null;
    return Buffer.from(data).toString("base64");
  } catch (error) {
    console.warn(`   Warning: could not render PDF page ${pageNumber} (${error.message}); sending extracted text only.`);
    return null;
  }
}

function buildBatchPrompt(batch, topics) {
  const topicEntries = topics.subject.recommended_topics.map((entry) => ({ topic: entry.topic, subtopics: entry.subtopics ?? [] }));
  const records = batch.map(({ index, question, pageText, screenshot }) => ({
    id: index,
    question: {
      year: question.year,
      questionNumber: question.questionNumber,
      pageNumber: question.pageNumber,
      pdfName: question.pdfName,
      question: question.question,
      passage: question.passage,
      context: question.context,
      options: Array.isArray(question.options) ? question.options : [],
      option1: question.option1,
      option2: question.option2,
      option3: question.option3,
      option4: question.option4,
      option5: question.option5,
      answer: question.answer,
      hasLinkedImage: Boolean(question.image?.localUrl || question.image?.cloudinaryUrl),
      pageImageIncluded: Boolean(screenshot),
    },
    pdfPageTextWithMargin: pageText || "No selectable page text was extracted; inspect the attached PDF page image.",
  }));

  return `Analyze every question record below against its source PDF page text and attached page image. Each record's id identifies its corresponding PDF page image, if present.

For EACH record:
1. Recover complete wording and all essential passage/context visible in the source. The question object's context is often required to understand it, especially English/Literature passage questions and items about similar words, stress, or related language tasks. Keep a shared reading passage in passage and question-specific supporting material in context. Never omit source context needed to understand the item; preserve existing passage/context if not fully repeated on this page, and do not invent missing source text.
2. Recover all answer options visible in the source. Preserve A-E labels; do not invent options. If fewer than four can be recovered, return only reliable choices and set needsHumanReview=true.
3. Solve the question from the options. Return only the correct option letter A-E, or null if uncertain.
4. Categorize using the supplied syllabus. First compare the question carefully against ALL listed topics and subtopics, and choose the closest accurate syllabus pair whenever reasonably possible. Do not invent categories merely because another listed topic seems less exact. Only if no supplied topic/subtopic pair can accurately classify the question, return topic=null and a concise best-fit subtopic in your own words. The syllabus may contain a topic:null entry with subtopics suggested for earlier questions; reuse an existing matching suggested subtopic exactly instead of creating a differently worded duplicate.
5. Set needsImage=true only if a visual is required for understanding and no image is already linked to the question.
6. Be conservative: uncertainty about wording, context, options, answer, or classification means needsHumanReview=true with a brief reviewNote.

Return JSON only in this shape: {"questions":[{"id":0,"question":"...","passage":null,"context":null,"options":["A. ..."],"answer":"A","topic":"... or null","subtopic":"...","needsImage":false,"needsHumanReview":false,"reviewNote":null}]}. Include passage/context whenever needed for the question to be independently understandable. Include exactly one result for each supplied id and do not add any other fields at the top level.

Allowed topic/subtopic values:
${JSON.stringify(topicEntries)}

Question records and extracted PDF page text (margin is included):
${JSON.stringify(records)}`;
}

async function callGeminiBatch(modelPool, batch, topics) {
  const parts = [{ text: buildBatchPrompt(batch, topics) }];
  const pageImages = new Map();
  for (const item of batch) {
    if (!item.screenshot) continue;
    const key = `${item.question.pdfName}:${item.question.pageNumber}`;
    if (!pageImages.has(key)) pageImages.set(key, { ...item, ids: [] });
    pageImages.get(key).ids.push(item.index);
  }
  for (const item of pageImages.values()) {
    parts.push({ text: `Source PDF page image for question id(s) ${item.ids.join(", ")} (${item.question.pdfName}, page ${item.question.pageNumber}):` });
    parts.push({ inlineData: { data: item.screenshot, mimeType: "image/png" } });
  }
  try {
    const result = await generateContentWithFallback(modelPool, {
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 20000,
      },
    });
    const parsed = parseModelJson(extractText(await result.response));
    const results = Array.isArray(parsed) ? parsed : parsed.questions;
    if (!Array.isArray(results)) throw new Error("AI response must contain a questions array.");
    const returnedIds = new Set(results.map((entry) => entry?.id));
    if (returnedIds.size !== batch.length || batch.some(({ index }) => !returnedIds.has(index))) {
      throw new Error("AI response did not include exactly one result for every batch question.");
    }
    return results;
  } catch (error) {
    if (["GEMINI_KEYS_EXHAUSTED", "ALL_PROVIDERS_EXHAUSTED"].includes(error.code)) throw error;
    if (batch.length < 2 || (isRetryableApiError(error) && !isRequestTooLargeError(error))) throw error;
    const splitAt = Math.ceil(batch.length / 2);
    const reason = isRequestTooLargeError(error) ? "request/token limit" : "incomplete or invalid batch response";
    console.warn(`   Splitting batch after ${reason}; retrying as ${splitAt} + ${batch.length - splitAt} question groups (${error.message}).`);
    const left = await callGeminiBatch(modelPool, batch.slice(0, splitAt), topics);
    const right = await callGeminiBatch(modelPool, batch.slice(splitAt), topics);
    return [...left, ...right];
  }
}

function mergeEnrichment(question, result, topics) {
  if (!result || typeof result !== "object" || Array.isArray(result)) throw new Error("AI response must be a JSON object.");
  const prompt = String(result.question ?? "").trim();
  if (!prompt) throw new Error("AI response omitted question text.");
  if (typeof result.needsImage !== "boolean") throw new Error("AI response must provide a boolean needsImage.");
  if (result.needsHumanReview !== undefined && typeof result.needsHumanReview !== "boolean") {
    throw new Error("AI response needsHumanReview must be a boolean.");
  }
  const options = normalizeOptions(result.options);
  const answer = normalizeAnswer(result.answer, options);
  const category = getTopicPair(topics, result.topic, result.subtopic);
  const needsHumanReview = result.needsHumanReview === true || options.length < 4 || answer === null || category.topic === null;
  const optionsByLetter = Object.fromEntries(options.map((option) => [option[0].toLowerCase(), option]));
  const noteParts = [
    question.note,
    result.reviewNote ? `AI review: ${String(result.reviewNote).trim()}` : null,
    category.topic === null ? "AI category did not match the supplied syllabus." : null,
  ].filter(Boolean);

  return {
    ...question,
    question: prompt,
    passage: String(result.passage ?? "").trim() || question.passage || null,
    context: String(result.context ?? "").trim() || question.context || null,
    options,
    option1: optionsByLetter.a ?? null,
    option2: optionsByLetter.b ?? null,
    option3: optionsByLetter.c ?? null,
    option4: optionsByLetter.d ?? null,
    option5: optionsByLetter.e ?? null,
    answer,
    topic: category.topic,
    subtopic: category.subtopic,
    needsImage: result.needsImage,
    needsRescan: needsHumanReview,
    aiReviewed: true,
    aiResolved: true,
    note: noteParts.join(" | ") || null,
  };
}

module.exports = {
  parseModelJson,
  normalizeOptions,
  normalizeAnswer,
  getTopicPair,
  registerSuggestedSubtopic,
  pageNumberOf,
  buildPageContext,
  buildPrompt,
  screenshotPage,
  buildBatchPrompt,
  callGeminiBatch,
  mergeEnrichment,
};
