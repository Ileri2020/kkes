/**
 * scripts/import-jamb-questions.js
 *
 * Reads all JAMB question JSON files in `pq/jamb/aijson/`, imports valid questions
 * into the Prisma database (`Question` and `QuestionOption` models) using high-concurrency batches,
 * and writes the generated Prisma IDs back into the local JSON files (`q.id` and `q.localid`).
 *
 * Skip Rule:
 * Questions that have `needsImage === true` AND have no valid answer (answer is null/empty/invalid)
 * are skipped. They are NOT inserted into the DB and no IDs are generated for them.
 *
 * Usage:
 *   node -r dotenv/config scripts/import-jamb-questions.js
 */

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({ log: ["warn", "error"] });
const AI_JSON_DIR = path.join(__dirname, "..", "pq", "jamb", "aijson");

const VALID_ANSWERS = new Set(["A", "B", "C", "D", "E", "TRUE", "FALSE"]);
const CONCURRENCY = 15;

function isBsonId(str) {
  return typeof str === "string" && /^[0-9a-fA-F]{24}$/.test(str);
}

function normalizeStr(s) {
  if (!s) return "";
  return String(s).trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Parses label and text from an option string like "A. sublimation followed by..."
 */
function parseOption(optionStr, fallbackIndex) {
  if (!optionStr) return null;
  const str = String(optionStr).trim();
  const match = str.match(/^([A-Ea-e])[\s.:)-]+(.*)$/);
  if (match) {
    return {
      label: match[1].toUpperCase(),
      text: match[2].trim() || str,
    };
  }
  const labels = ["A", "B", "C", "D", "E"];
  return {
    label: labels[fallbackIndex] || `OPT${fallbackIndex + 1}`,
    text: str,
  };
}

/**
 * Executes async tasks over an array of items in batches of `concurrency`.
 */
async function mapConcurrent(items, concurrency, fn) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkResults = await Promise.all(chunk.map((item, idx) => fn(item, i + idx)));
    results.push(...chunkResults);
  }
  return results;
}

async function main() {
  console.log("═════════════════════════════════════════════════════════");
  console.log("  KKES — Import JAMB Questions to Prisma (High Speed)   ");
  console.log("═════════════════════════════════════════════════════════\n");

  if (!fs.existsSync(AI_JSON_DIR)) {
    console.error(`❌ Directory not found: ${AI_JSON_DIR}`);
    process.exit(1);
  }

  // Pre-fetch existing topics for topicId resolution
  const dbTopics = await prisma.topic.findMany({
    select: { id: true, name: true, subjectId: true },
  });
  const topicMap = new Map();
  for (const t of dbTopics) {
    topicMap.set(normalizeStr(t.name), t.id);
  }

  // Collect all JSON files recursively
  const jsonFiles = [];
  function collectFiles(dirPath) {
    const entries = fs.readdirSync(dirPath);
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        collectFiles(fullPath);
      } else if (entry.endsWith(".json")) {
        jsonFiles.push(fullPath);
      }
    }
  }

  collectFiles(AI_JSON_DIR);
  console.log(`📂 Found ${jsonFiles.length} JSON file(s) in aijson directory.\n`);

  let grandTotal = 0;
  let totalInserted = 0;
  let totalSkipped = 0;

  for (const filePath of jsonFiles) {
    const relPath = path.relative(AI_JSON_DIR, filePath);

    const fileContent = fs.readFileSync(filePath, "utf-8");
    let questions;
    try {
      questions = JSON.parse(fileContent);
    } catch (e) {
      console.error(`❌ Failed to parse JSON in ${relPath}:`, e.message);
      continue;
    }

    if (!Array.isArray(questions)) {
      console.warn(`⚠️ File content is not an array — skipping: ${relPath}`);
      continue;
    }

    let fileInserted = 0;
    let fileSkipped = 0;
    let fileModified = false;

    // Concurrently process questions in batches of CONCURRENCY
    await mapConcurrent(questions, CONCURRENCY, async (q, index) => {
      grandTotal++;

      // Evaluate answer validity
      const rawAns = q.answer ? String(q.answer).trim() : "";
      const validAnsStr = rawAns ? rawAns.toUpperCase() : null;
      const isValidAnswer = validAnsStr ? VALID_ANSWERS.has(validAnsStr) : false;

      // Evaluate needsImage
      const needsImg = Boolean(
        q.needsImage ||
        (q.image && (q.image.localUrl || q.image.cloudinaryUrl))
      );

      // SKIP condition: needs image AND has no answer
      if (needsImg && !isValidAnswer) {
        fileSkipped++;
        totalSkipped++;
        return;
      }

      // Check if question was already saved in DB previously (has id and exists in DB)
      let questionId = q.id || q.localid;
      if (isBsonId(questionId)) {
        try {
          const existing = await prisma.question.findUnique({
            where: { id: String(questionId) },
            select: { id: true },
          });
          if (existing) {
            q.id = existing.id;
            q.localid = existing.id;
            fileInserted++;
            totalInserted++;
            fileModified = true;
            return;
          }
        } catch (_) {
          // If query fails, fall through to create
        }
      }

      // Match topicId if possible
      const topicName = q.topic ? String(q.topic).trim() : null;
      const subtopicName = q.subtopic ? String(q.subtopic).trim() : null;
      let matchedTopicId = null;
      if (topicName && topicMap.has(normalizeStr(topicName))) {
        matchedTopicId = topicMap.get(normalizeStr(topicName));
      } else if (subtopicName && topicMap.has(normalizeStr(subtopicName))) {
        matchedTopicId = topicMap.get(normalizeStr(subtopicName));
      }

      // Prepare options array for QuestionOption relation
      const rawOptions = Array.isArray(q.options) && q.options.length > 0
        ? q.options
        : [q.option1, q.option2, q.option3, q.option4, q.option5].filter(Boolean);

      const parsedOptions = rawOptions
        .map((opt, idx) => parseOption(opt, idx))
        .filter(Boolean);

      // Create Question record in Prisma
      try {
        const createdQuestion = await prisma.question.create({
          data: {
            year: q.year ? Number(q.year) : null,
            questionNumber: q.questionNumber ? Number(q.questionNumber) : null,
            pageNumber: q.pageNumber ? Number(q.pageNumber) : null,
            pdfName: q.pdfName || null,
            examType: q.type || "jamb",
            subject: q.subject || null,
            topicName: topicName,
            subtopicName: subtopicName,
            topicId: matchedTopicId,
            type: "MULTIPLE_CHOICE",
            difficulty: "MEDIUM",
            prompt: q.question || "",
            explanation: q.note || null,
            note: q.note || null,
            passage: q.passage || q.context || null,
            context: q.context || null,
            needsRescan: Boolean(q.needsRescan),
            aiReviewed: Boolean(q.aiReviewed),
            needsImage: Boolean(q.needsImage),
            image: q.image || null,
            imageUrl:
              q.image?.cloudinaryUrl ||
              q.image?.localUrl ||
              q.imageUrl ||
              null,
            option1: q.option1 || null,
            option2: q.option2 || null,
            option3: q.option3 || null,
            option4: q.option4 || null,
            option5: q.option5 || null,
            answer: isValidAnswer ? validAnsStr : rawAns || null,
            options: {
              create: parsedOptions.map((opt) => ({
                label: opt.label,
                text: opt.text,
                isCorrect: isValidAnswer && opt.label === validAnsStr,
              })),
            },
          },
        });

        // Write generated DB id back into JSON object (both id and localid)
        q.id = createdQuestion.id;
        q.localid = createdQuestion.id;

        fileInserted++;
        totalInserted++;
        fileModified = true;
      } catch (err) {
        console.error(`❌ Q#${q.questionNumber || index + 1} (${q.year}):`, err.message);
      }
    });

    if (fileModified) {
      fs.writeFileSync(filePath, JSON.stringify(questions, null, 2), "utf-8");
      console.log(`✔️  ${relPath} (Inserted: ${fileInserted}, Skipped: ${fileSkipped})`);
    } else {
      console.log(`ℹ️  ${relPath} (Already up to date / Inserted: ${fileInserted}, Skipped: ${fileSkipped})`);
    }
  }

  console.log("\n─────────────────────────────────────────────────────────");
  console.log("  📊  Import Summary");
  console.log("─────────────────────────────────────────────────────────");
  console.log(`  Total Questions Processed : ${grandTotal}`);
  console.log(`  Successfully Inserted     : ${totalInserted}`);
  console.log(`  Skipped (Needs Image + No Ans): ${totalSkipped}`);
  console.log("─────────────────────────────────────────────────────────");
  console.log("  ✅  Done!\n");
}

main()
  .catch((e) => {
    console.error("❌ Import script crashed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
