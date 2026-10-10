#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { PDFParse } = require("pdf-parse");

const ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_EXAM = "jamb";
const DEFAULT_MODEL = "gemini-2.5-flash";
const DEFAULT_OPENROUTER_MODEL = "nvidia/nemotron-3.5-lightning:free";
const GEMINI_BATCH_SIZE = 20;
const OPENROUTER_BATCH_SIZE = 10;
const MIN_REQUEST_INTERVAL_MS = 4500;
const OPENROUTER_MIN_REQUEST_INTERVAL_MS = 3000;
const MAX_RETRIES_PER_API_KEY = 2;
const OPENROUTER_ROUND_ROBIN_PASSES = 3;
const ALIASES = {
  accounts: ["accounts", "accounting", "principlesofaccounts"],
  crk: ["crk", "christianreligiousknowledge"],
  english: ["english", "useofenglish"],
  literature: ["literature", "literatureinenglish"],
};

function usage() {
  console.log(`Usage:
  node ai/modularAIrefiner/enrich_pq.js --subject <subject> --year <year> [options]
  node ai/modularAIrefiner/enrich_pq.js --all [options]

Options:
  --exam <jamb|waec|neco>  Exam data folder (default: jamb)
  --margin <pages>         Adjacent PDF text pages to include (default: 1)
  --model <name>           Gemini model (default: ${DEFAULT_MODEL})
  --delay-ms <number>      Additional delay between batches (default: 1000)
  -all, --all              Analyze every available subject/year; newest years first
  -gemini                  Prefer Gemini first, then fall back to OpenRouter
  -openrouter              Use OpenRouter only (free text model from OPENROUTER_MODEL)
  -resolve, --resolve      Retry questions previously marked aiResolved=false
  --check                  Validate selected inputs without calling the AI
  --help                   Show this help

Every matching question in the selected year is analyzed in successive batches of up to ${GEMINI_BATCH_SIZE} with Gemini or ${OPENROUTER_BATCH_SIZE} with OpenRouter
until the whole year is complete. Progress is checkpointed after each successful batch to
pq/<exam>/aijson/<subject>/<subject><year>.json; rerunning resumes unfinished questions.
Source question files are never modified.
Add GEMINI_API_KEY / GEMINI_API_KEY_N and OPENROUTER_API_KEY / OPENROUTER_API_KEY_N keys to the project .env.
Use -gemini or -openrouter to choose the preferred starting provider; if its keys fail, the other provider is tried.`);
}

function parseArgs(args) {
  const options = { exam: DEFAULT_EXAM, model: DEFAULT_MODEL, margin: 1, delayMs: 1000, check: false, resolve: false, preferredProvider: "gemini" };
  let providerFlagSeen = false;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "-all" || arg === "--all") options.all = true;
    else if (arg === "-resolve" || arg === "--resolve") options.resolve = true;
    else if (arg === "-gemini" || arg === "--gemini") {
      if (providerFlagSeen && options.preferredProvider !== "gemini") throw new Error("Choose only one preferred provider: -gemini or -openrouter.");
      options.preferredProvider = "gemini";
      providerFlagSeen = true;
    } else if (arg === "-openrouter" || arg === "--openrouter") {
      if (providerFlagSeen && options.preferredProvider !== "openrouter") throw new Error("Choose only one preferred provider: -gemini or -openrouter.");
      options.preferredProvider = "openrouter";
      providerFlagSeen = true;
    }
    else if (arg === "--check") options.check = true;
    else if (["--subject", "--year", "--exam", "--margin", "--model", "--delay-ms"].includes(arg)) {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${arg}`);
      index += 1;
      const key = ({ "--subject": "subject", "--year": "year", "--exam": "exam", "--margin": "margin", "--model": "model", "--delay-ms": "delayMs" })[arg];
      options[key] = ["year", "margin", "delayMs"].includes(key) ? Number(value) : value;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (args.includes("-gemini") && args.includes("-openrouter")
    || args.includes("--gemini") && args.includes("--openrouter")
    || args.includes("-gemini") && args.includes("--openrouter")
    || args.includes("--gemini") && args.includes("-openrouter")) {
    throw new Error("Choose only one preferred provider: -gemini or -openrouter.");
  }
  if (options.help) return options;
  if (!options.all && !options.subject?.trim()) throw new Error("--subject is required unless -all is used.");
  if (!options.all && (!Number.isInteger(options.year) || options.year < 1900 || options.year > 2100)) throw new Error("--year must be a four-digit year unless -all is used.");
  options.exam = options.exam.toLowerCase();
  if (!["jamb", "waec", "neco"].includes(options.exam)) throw new Error("--exam must be jamb, waec, or neco.");
  if (!Number.isInteger(options.margin) || options.margin < 0 || options.margin > 3) throw new Error("--margin must be an integer from 0 to 3.");
  if (!Number.isInteger(options.delayMs) || options.delayMs < 0) throw new Error("--delay-ms must be a non-negative integer.");
  return options;
}

function normalize(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function subjectAliases(value) {
  const key = normalize(value);
  for (const aliases of Object.values(ALIASES)) {
    if (aliases.includes(key)) return new Set(aliases);
  }
  return new Set([key]);
}

function sameSubject(left, right) {
  const accepted = subjectAliases(right);
  return accepted.has(normalize(left));
}

function getExamPaths(exam) {
  const directory = path.join(ROOT, "pq", exam);
  return {
    directory,
    pdfDirectory: directory,
    jsonDirectory: path.join(directory, "json"),
    topicsDirectory: path.join(ROOT, "pq", "jamb", "topics"),
    masterJson: path.join(directory, "past_questions_db.json"),
  };
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function findTopicFile(directory, subject) {
  const aliases = subjectAliases(subject);
  const candidates = fs.readdirSync(directory).filter((file) => file.toLowerCase().endsWith(".json"));
  for (const filename of candidates) {
    const filePath = path.join(directory, filename);
    const data = readJson(filePath);
    const info = data.subject ?? {};
    if ([info.name, info.code, filename.replace(/\.json$/i, "")].some((value) => aliases.has(normalize(value)))) {
      return { filePath, data };
    }
  }
  throw new Error(`No topic syllabus JSON found for subject "${subject}" under ${directory}.`);
}

function loadQuestionFile(directory, subject, year) {
  const sourceFiles = fs.readdirSync(directory)
    .filter((file) => file.toLowerCase().endsWith(".json"))
    .sort((left, right) => left.localeCompare(right));
  const matches = [];
  const fileData = new Map();
  for (const filename of sourceFiles) {
    const filePath = path.join(directory, filename);
    const records = readJson(filePath);
    if (!Array.isArray(records)) continue;
    fileData.set(filePath, records);
    for (const question of records) {
      if (sameSubject(question.subject, subject) && Number(question.year) === year) {
        matches.push({ question, filePath });
      }
    }
  }
  return { matches, fileData };
}

function questionKey(question) {
  const prompt = normalize(question.question);
  return [normalize(question.pdfName), question.pageNumber ?? "", question.year ?? "", question.questionNumber ?? "", prompt].join("|");
}

function isCompleteEnoughForReview(question) {
  const options = Array.isArray(question.options) ? question.options : [];
  return question.aiReviewed === true
    && Boolean(question.topic)
    && Boolean(question.subtopic)
    && options.length >= 4
    && /^[A-E]$/i.test(String(question.answer ?? ""))
    && typeof question.needsImage === "boolean";
}

function isPreviouslyUnresolved(question) {
  if (question?.aiResolved !== false) return false;
  if (question.aiAttempted === true) return true;
  // Older checkpoints did not record aiAttempted; unresolved entries were saved
  // with needsRescan and the provider/validation failure appended to note.
  return question.needsRescan === true && typeof question.note === "string" && question.note.trim().length > 0;
}

function getPendingQuestions(selected, enrichedQuestions, retryUnresolved = false) {
  return selected
    .map(({ question }, index) => ({ question, index }))
    .filter(({ index }) => {
      const status = enrichedQuestions[index];
      return status?.aiReviewed !== true && (retryUnresolved || !isPreviouslyUnresolved(status));
    });
}

function getProviderBatchSize(provider) {
  return provider === "openrouter" ? OPENROUTER_BATCH_SIZE : GEMINI_BATCH_SIZE;
}

function extractText(response) {
  return response.text().replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
}

function errorText(error) {
  return [error?.message, error?.status, error?.statusText, error?.code]
    .filter((value) => value !== undefined && value !== null)
    .join(" ");
}

function isRetryableApiError(error) {
  const message = errorText(error).toLowerCase();
  const status = Number(error?.status ?? error?.response?.status);
  return status === 429 || status === 503 || status >= 500
    || /resource_exhausted|rate.?limit|too many requests|quota.{0,30}exceeded|exceeded.{0,30}quota|service unavailable|temporarily unavailable|fetch failed|network error|socket hang up/.test(message);
}

function isQuotaLimitError(error) {
  return /resource_exhausted|quota.{0,30}exceeded|exceeded.{0,30}quota|per.?minute limit|rate.?limit/i.test(errorText(error));
}

function retryDelayFromError(error) {
  const message = errorText(error);
  const seconds = message.match(/retry in\s+(\d+(?:\.\d+)?)\s*s/i)
    ?? message.match(/retryDelay[^\d]*(\d+(?:\.\d+)?)s/i);
  return seconds ? Math.ceil(Number(seconds[1]) * 1000) : 0;
}

function isRequestTooLargeError(error) {
  return /request.{0,20}too large|payload too large|input token|context length|maximum.{0,20}tokens|token limit|content too large/i.test(errorText(error));
}

function isEmptyProviderResponseError(error) {
  return /did not contain textual assistant content|content was empty|empty response|no text content|response content is empty|no assistant content/i.test(errorText(error));
}

function isPendingQuestionError(error) {
  return /question\(s\) remain pending|remain pending|pending question\(s\)|unfinished questions/i.test(errorText(error));
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function getGeminiApiKeys(environment = process.env) {
  const numberedNames = Object.keys(environment)
    .map((name) => ({ name, match: name.match(/^GEMINI_API_KEY_(\d+)$/i) }))
    .filter(({ match }) => match)
    .sort((left, right) => Number(left.match[1]) - Number(right.match[1]));
  const names = ["GEMINI_API_KEY", ...numberedNames.map(({ name }) => name)];
  return [...new Set(names.map((name) => String(environment[name] ?? "").trim()).filter(Boolean))];
}

function isApiKeyError(error) {
  const status = Number(error?.status ?? error?.response?.status);
  return status === 401 || status === 403
    || /api.?key.{0,30}(invalid|not valid|expired|unauthorized)|invalid_api_key|permission denied/i.test(errorText(error));
}

async function waitForRequestSlot(pool) {
  const elapsed = Date.now() - pool.lastRequestAt;
  const interval = pool.minIntervalMs ?? MIN_REQUEST_INTERVAL_MS;
  if (pool.lastRequestAt && elapsed < interval) await wait(interval - elapsed);
  pool.lastRequestAt = Date.now();
}

async function generateContentWithRateLimit(pool, request) {
  if (!pool.models.length) throw new Error("No Gemini API keys are configured.");
  let lastError;
  const startIndex = pool.nextKeyIndex % pool.models.length;
  const maxRounds = pool.maxRounds ?? MAX_RETRIES_PER_API_KEY;
  const provider = pool.providerName ?? "Gemini";

  // Each key is tried once per round-robin pass. A failed key
  // never blocks other keys with a long provider-supplied quota wait.
  for (let round = 0; round < maxRounds; round += 1) {
    for (let keyOffset = 0; keyOffset < pool.models.length; keyOffset += 1) {
      const keyIndex = (startIndex + keyOffset) % pool.models.length;
      const model = pool.models[keyIndex];
      await waitForRequestSlot(pool);
      try {
        const response = await model.generateContent(request);
        pool.nextKeyIndex = keyIndex;
        return response;
      } catch (error) {
        lastError = error;
        if (isRequestTooLargeError(error)) throw error;
        if (!isRetryableApiError(error) && !isApiKeyError(error) && !isEmptyProviderResponseError(error)) throw error;
        const reason = isQuotaLimitError(error) ? "quota/rate limit" : isEmptyProviderResponseError(error) ? "empty or malformed response" : "request failure";
        const nextKey = (keyIndex + 1) % pool.models.length;
        const action = keyOffset + 1 < pool.models.length ? `rotating to key ${nextKey + 1}/${pool.models.length}` : "continuing to the next round-robin pass";
        console.warn(`   ${provider} key ${keyIndex + 1}/${pool.models.length} hit a ${reason}; ${action} (${errorText(error).slice(0, 220)}).`);
      }
    }
    if (round + 1 < maxRounds) {
      console.warn(`   Key round ${round + 1} failed; beginning round ${round + 2}/${maxRounds} across all ${pool.models.length} key(s).`);
    }
  }

  pool.nextKeyIndex = (startIndex + 1) % pool.models.length;
  const exhaustedError = new Error(`${provider} request failed after ${maxRounds} round-robin passes across all ${pool.models.length} configured API key(s). Last error: ${errorText(lastError)}`);
  exhaustedError.code = pool.exhaustedCode ?? "GEMINI_KEYS_EXHAUSTED";
  throw exhaustedError;
}

function getOpenRouterApiKeys(environment = process.env) {
  const numberedNames = Object.keys(environment)
    .map((name) => ({ name, match: name.match(/^OPENROUTER_API_KEY_(\d+)$/i) }))
    .filter(({ match }) => match)
    .sort((left, right) => Number(left.match[1]) - Number(right.match[1]));
  const names = ["OPENROUTER_API_KEY", ...numberedNames.map(({ name }) => name)];
  return [...new Set(names.map((name) => String(environment[name] ?? "").trim()).filter(Boolean))];
}

function createOpenRouterModel(apiKey, modelName, fetcher = globalThis.fetch) {
  if (typeof fetcher !== "function") throw new Error("This Node.js runtime does not provide fetch for OpenRouter requests.");
  if (/gemini|google/i.test(modelName)) {
    throw new Error("OPENROUTER_MODEL must be a non-Gemini OpenRouter model; use a free text model such as nvidia/nemotron-3.5-lightning:free.");
  }
  return {
    async generateContent(request) {
      const parts = request.contents?.flatMap((content) => content.parts ?? []) ?? [];
      // The configured free model is text-only. Send extracted PDF text and
      // question JSON as a plain prompt; do not attach images it cannot accept.
      const messageContent = parts
        .map((part) => typeof part.text === "string" ? part.text : null)
        .filter(Boolean)
        .join("\n\n");
      const generationConfig = request.generationConfig ?? {};
      const body = {
        model: modelName,
        messages: [{ role: "user", content: messageContent }],
        temperature: generationConfig.temperature ?? 0.1,
        max_tokens: generationConfig.maxOutputTokens ?? 20000,
      };
      const response = await fetcher(process.env.OPENROUTER_API_URL || "https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://github.com/",
          "X-Title": "KKES Past Question Enrichment",
        },
        body: JSON.stringify(body),
      });
      const bodyText = await response.text();
      let payload;
      try {
        payload = JSON.parse(bodyText);
      } catch {
        payload = null;
      }
      if (!response.ok) {
        const providerMessage = payload?.error?.message || payload?.message || bodyText || response.statusText;
        const error = new Error(`OpenRouter HTTP ${response.status}: ${providerMessage}`);
        error.status = response.status;
        if (response.status === 404 && /model|slug|unavailable/i.test(providerMessage)) {
          error.code = "OPENROUTER_MODEL_UNAVAILABLE";
        } else if (response.status === 400 && /provider returned error/i.test(providerMessage)) {
          error.code = "OPENROUTER_PROVIDER_ERROR";
        }
        throw error;
      }
      const content = payload?.choices?.[0]?.message?.content;
      const text = Array.isArray(content)
        ? content.map((entry) => typeof entry?.text === "string" ? entry.text : "").join("\n").trim()
        : typeof content === "string"
          ? content
          : null;
      if (typeof text !== "string" || !text.trim()) throw new Error("OpenRouter response did not contain textual assistant content.");
      return { response: { text: () => text } };
    },
  };
}

async function generateContentWithFallback(providerPools, request) {
  const preferredProvider = providerPools.preferredProvider === "openrouter" ? "openrouter" : "gemini";
  const providerOrder = providerPools.fallbackEnabled === false
    ? [preferredProvider]
    : preferredProvider === "openrouter" ? ["openrouter", "gemini"] : ["gemini", "openrouter"];
  const exhaustedErrors = [];
  for (const providerName of providerOrder) {
    const pool = providerPools[providerName];
    if (!pool?.models.length) continue;
    try {
      const response = await generateContentWithRateLimit(pool, request);
      if (providerName !== preferredProvider) {
        providerPools.preferredProvider = providerName;
        console.log(`   ${providerName === "gemini" ? "Gemini" : "OpenRouter"} fallback succeeded; using it as the preferred provider for subsequent requests in this run.`);
      }
      return response;
    } catch (error) {
      const expectedCode = providerName === "gemini" ? "GEMINI_KEYS_EXHAUSTED" : "OPENROUTER_KEYS_EXHAUSTED";
      const providerUnavailable = providerName === "openrouter" && error.code === "OPENROUTER_MODEL_UNAVAILABLE";
      const providerRejectedRequest = providerName === "openrouter" && error.code === "OPENROUTER_PROVIDER_ERROR";
      if (error.code !== expectedCode && !providerUnavailable && !providerRejectedRequest) throw error;
      exhaustedErrors.push(error);
      const nextProvider = providerOrder.find((name) => name !== providerName && providerPools[name]?.models.length);
      if (nextProvider) {
        const reason = providerUnavailable ? "configured model is unavailable"
          : providerRejectedRequest ? "OpenRouter's provider rejected the request"
            : "all keys exhausted their retry rounds";
        console.warn(`   ${providerName === "gemini" ? "Gemini" : "OpenRouter"} ${reason}; falling back to ${nextProvider === "gemini" ? "Gemini" : "OpenRouter"}.`);
      }
    }
  }

  if (exhaustedErrors.length) {
    const exhaustedError = new Error(exhaustedErrors.map((error) => error.message).join("\n"));
    exhaustedError.code = "ALL_PROVIDERS_EXHAUSTED";
    throw exhaustedError;
  }
  throw new Error("No Gemini or OpenRouter API keys are configured.");
}


module.exports = {
  fs,
  path,
  dotenv,
  GoogleGenerativeAI,
  PDFParse,
  ROOT,
  DEFAULT_EXAM,
  DEFAULT_MODEL,
  DEFAULT_OPENROUTER_MODEL,
  GEMINI_BATCH_SIZE,
  OPENROUTER_BATCH_SIZE,
  MIN_REQUEST_INTERVAL_MS,
  OPENROUTER_MIN_REQUEST_INTERVAL_MS,
  MAX_RETRIES_PER_API_KEY,
  OPENROUTER_ROUND_ROBIN_PASSES,
  ALIASES,
  usage,
  parseArgs,
  normalize,
  subjectAliases,
  sameSubject,
  getExamPaths,
  readJson,
  findTopicFile,
  loadQuestionFile,
  questionKey,
  isCompleteEnoughForReview,
  isPreviouslyUnresolved,
  getPendingQuestions,
  getProviderBatchSize,
  extractText,
  errorText,
  isRetryableApiError,
  isQuotaLimitError,
  retryDelayFromError,
  isRequestTooLargeError,
  isPendingQuestionError,
  wait,
  getGeminiApiKeys,
  isApiKeyError,
  waitForRequestSlot,
  generateContentWithRateLimit,
  getOpenRouterApiKeys,
  createOpenRouterModel,
  generateContentWithFallback,
};
