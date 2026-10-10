const fs = require("node:fs");
const path = require("node:path");
const { splitStoredOptions, normalizeQuestionOptions } = require("./scrape_pq");

const { DEFAULT_EXAM_TYPE, SUPPORTED_EXAM_TYPES, getExamPaths } = require("./config");
const requestedExamType = process.argv.find((arg) => arg.startsWith("--exam="))?.slice("--exam=".length) || DEFAULT_EXAM_TYPE;
const examType = requestedExamType.toLowerCase();
if (!SUPPORTED_EXAM_TYPES.includes(examType)) {
  throw new Error(`Unknown --exam value "${requestedExamType}". Valid exam types: ${SUPPORTED_EXAM_TYPES.join(", ")}.`);
}
const DATA_DIR = getExamPaths(examType).subjectJsonDirectory;
const writeChanges = process.argv.includes("--write");
const files = fs.readdirSync(DATA_DIR).filter((name) => name.endsWith(".json")).sort();
let changedRecords = 0;
let splitRecords = 0;
let changedFiles = 0;
let skippedRecords = 0;
let rescanRecords = 0;

for (const file of files) {
  const filePath = path.join(DATA_DIR, file);
  const records = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!Array.isArray(records)) continue;
  let fileChanged = false;

  for (const question of records) {
    const sourceOptions = Array.isArray(question.options) && question.options.length
      ? question.options
      : [question.option1, question.option2, question.option3, question.option4, question.option5];
    const repaired = normalizeQuestionOptions({ ...question, options: sourceOptions }) || splitStoredOptions(sourceOptions);
    if (!repaired.length || repaired.length < 4) {
      question.needsRescan = true;
      question.note = [question.note, "Needs rescan: malformed option set below the required four-choice minimum."].filter(Boolean).join(" | ");
      rescanRecords += 1;
      fileChanged = true;
      continue;
    }

    const oldOptions = JSON.stringify(question.options ?? []);
    const oldFields = [question.option1, question.option2, question.option3, question.option4, question.option5];
    const newFields = Array.from({ length: 5 }, (_, index) => repaired[index] ?? null);
    const fieldsChanged = newFields.some((value, index) => value !== (oldFields[index] ?? null));
    if (oldOptions === JSON.stringify(repaired) && !fieldsChanged) {
      skippedRecords += 1;
      continue;
    }

    if (repaired.length > (question.options?.length ?? 0)) splitRecords += 1;
    question.options = repaired;
    question.needsRescan = false;
    for (let index = 0; index < 5; index += 1) {
      const key = `option${index + 1}`;
      if (newFields[index] === null && index === 4) delete question[key];
      else question[key] = newFields[index];
    }
    changedRecords += 1;
    fileChanged = true;
  }

  if (!fileChanged) continue;
  changedFiles += 1;
  if (writeChanges) {
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
    fs.renameSync(tempPath, filePath);
  }
  console.log(`${writeChanges ? "Updated" : "Would update"} ${file}: ${records.length} records`);
}

console.log(`${writeChanges ? "Repair" : "Dry run"} complete: ${changedRecords} record(s) updated across ${changedFiles} file(s); ${splitRecords} record(s) gained separately parsed choices; ${skippedRecords} valid record(s) skipped; ${rescanRecords} record(s) flagged for rescan because they still have fewer than 4 valid options.`);
if (!writeChanges && changedRecords) console.log("Run with --write to apply the repairs.");
if (rescanRecords) console.log("⚠️ Remaining issues: some questions still need manual review because they are below the required four-option minimum.");
