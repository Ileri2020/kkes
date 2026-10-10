#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..");
const EXAM_ROOT = path.join(ROOT, "pq", "jamb");
const TOPICS_DIR = path.join(EXAM_ROOT, "topics");
const AIJSON_DIR = path.join(EXAM_ROOT, "aijson");
const dryRun = process.argv.includes("--dry-run");

function normalize(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function atomicWrite(filePath, value) {
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(temporaryPath, filePath);
}

function collectSuggestions(subjectOutputDir) {
  const suggestions = new Map();
  const files = fs.readdirSync(subjectOutputDir)
    .filter((name) => name.toLowerCase().endsWith(".json"))
    .sort((left, right) => left.localeCompare(right));
  let recordsScanned = 0;

  for (const filename of files) {
    const filePath = path.join(subjectOutputDir, filename);
    const questions = readJson(filePath);
    if (!Array.isArray(questions)) continue;
    for (const question of questions) {
      recordsScanned += 1;
      const hasNullTopic = question.topic === null || question.topic === undefined
        || (typeof question.topic === "string" && question.topic.trim().toLowerCase() === "null");
      const subtopic = typeof question.subtopic === "string" ? question.subtopic.trim() : "";
      if (!hasNullTopic || !subtopic) continue;
      const key = normalize(subtopic);
      if (key && !suggestions.has(key)) suggestions.set(key, subtopic);
    }
  }
  return { suggestions: [...suggestions.values()].sort((left, right) => left.localeCompare(right)), recordsScanned, filesScanned: files.length };
}

function syncSubject(topicFilePath) {
  const topicData = readJson(topicFilePath);
  const subjectData = topicData.subject ?? {};
  const subjectName = String(subjectData.name || subjectData.code || path.basename(topicFilePath, ".json")).trim();
  const outputDirName = normalize(subjectName);
  const subjectOutputDir = path.join(AIJSON_DIR, outputDirName);
  if (!fs.existsSync(subjectOutputDir)) {
    return { subject: subjectName, topicFilePath, status: "no AI output folder", additions: [] };
  }

  const { suggestions, recordsScanned, filesScanned } = collectSuggestions(subjectOutputDir);
  if (!Array.isArray(subjectData.recommended_topics)) {
    throw new Error(`Invalid taxonomy: subject.recommended_topics is missing in ${topicFilePath}`);
  }

  let nullTopic = subjectData.recommended_topics.find((entry) => entry.topic === null);
  const existing = new Map();
  if (nullTopic && Array.isArray(nullTopic.subtopics)) {
    for (const subtopic of nullTopic.subtopics) {
      if (typeof subtopic === "string" && normalize(subtopic)) existing.set(normalize(subtopic), subtopic);
    }
  }

  const additions = suggestions.filter((suggestion) => !existing.has(normalize(suggestion)));
  if (additions.length && !nullTopic) {
    nullTopic = { topic: null, subtopics: [] };
    subjectData.recommended_topics.push(nullTopic);
  }
  if (nullTopic) {
    if (!Array.isArray(nullTopic.subtopics)) nullTopic.subtopics = [];
    nullTopic.subtopics.push(...additions);
  }

  if (additions.length && !dryRun) atomicWrite(topicFilePath, topicData);
  return {
    subject: subjectName,
    topicFilePath,
    status: additions.length ? (dryRun ? "would update" : "updated") : "already synchronized",
    filesScanned,
    recordsScanned,
    distinctSuggestions: suggestions.length,
    additions,
  };
}

function main() {
  if (!fs.existsSync(TOPICS_DIR)) throw new Error(`Topic folder not found: ${TOPICS_DIR}`);
  if (!fs.existsSync(AIJSON_DIR)) throw new Error(`AI output folder not found: ${AIJSON_DIR}`);
  const topicFiles = fs.readdirSync(TOPICS_DIR)
    .filter((name) => name.toLowerCase().endsWith(".json"))
    .sort((left, right) => left.localeCompare(right));
  let totalAdditions = 0;
  for (const filename of topicFiles) {
    const result = syncSubject(path.join(TOPICS_DIR, filename));
    totalAdditions += result.additions?.length ?? 0;
    if (result.status === "no AI output folder") {
      console.log(`${result.subject}: no matching AI output folder; skipped`);
      continue;
    }
    console.log(`${result.subject}: ${result.status}; scanned ${result.filesScanned} year file(s), ${result.recordsScanned} record(s), ${result.distinctSuggestions} distinct null-topic subtopic(s), ${result.additions.length} ${dryRun ? "to add" : "added"}.`);
    for (const suggestion of result.additions) console.log(`  - ${suggestion}`);
  }
  console.log(`${dryRun ? "Dry run" : "Synchronization"} complete: ${totalAdditions} new null-topic subtopic(s) ${dryRun ? "would be added" : "added"}.`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Null-topic taxonomy sync failed: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { normalize, collectSuggestions, syncSubject };
