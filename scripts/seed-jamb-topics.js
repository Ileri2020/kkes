// @ts-check
"use strict";

// Force the correct DB (same one Next.js uses via .env.local)
process.env.MONGODB_URL = "mongodb+srv://adepojuololade2020:j0k2iy9xXcraCpHn@succomongo.b5r4o.mongodb.net/healthclique?retryWrites=true&w=majority&appName=succomongo";

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const TOPICS_DIR = path.join(__dirname, "..", "pq", "jamb", "topics");

// Subject name aliases: json name → possible db names (case-insensitive)
const ALTERNATE_NAMES = {
  "principles of accounts": ["principles of accounts", "accounting", "financial accounting"],
  "literature in english": ["literature in english", "literature"],
  "english language": ["english language", "english"],
};

function normalize(s) { return s.trim().toLowerCase().replace(/\s+/g, " "); }

async function main() {
  // First, list all subjects so we can confirm DB connection
  const allParents = await prisma.subject.findMany({
    where: { parentSubjectId: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true, schoolId: true },
  });

  console.log(`\nConnected. Found ${allParents.length} parent subjects in DB:\n`);
  for (const s of allParents) {
    console.log(`  ${s.name.padEnd(45)} id: ${s.id}`);
  }

  if (allParents.length === 0) {
    console.log("\n⚠  No parent subjects found. Ensure subjects are created via the UI first.\n");
    return;
  }

  // Build a lookup map: normalised name → subject
  const subjectMap = new Map();
  for (const s of allParents) {
    subjectMap.set(normalize(s.name), s);
    // Also index by code
    if (s.code) subjectMap.set(normalize(s.code), s);
  }

  const files = fs.readdirSync(TOPICS_DIR).filter((f) => f.endsWith(".json"));
  console.log(`\nProcessing ${files.length} JAMB topic file(s)...\n`);

  for (const file of files) {
    const json = JSON.parse(fs.readFileSync(path.join(TOPICS_DIR, file), "utf-8"));
    const { name: subjectName, recommended_topics = [], recommended_textbooks = [] } = json.subject;

    console.log(`── ${subjectName} (${file})`);

    // Direct lookup
    let dbSubject = subjectMap.get(normalize(subjectName));

    // Alias lookup
    if (!dbSubject) {
      const aliases = ALTERNATE_NAMES[normalize(subjectName)] ?? [];
      for (const alias of aliases) {
        dbSubject = subjectMap.get(normalize(alias));
        if (dbSubject) break;
      }
    }

    if (!dbSubject) {
      console.log(`   ⚠  No match in DB — skipping.\n`);
      continue;
    }
    console.log(`   ↳ Matched: "${dbSubject.name}" (${dbSubject.id})`);
    await seedSubject(dbSubject.id, recommended_topics, recommended_textbooks);
    console.log();
  }

  console.log("✅  Done.\n");
}

async function seedSubject(subjectId, recommendedTopics, textbooks) {
  let topics = 0, subtopics = 0, books = 0;

  for (let ti = 0; ti < recommendedTopics.length; ti++) {
    const { topic: sectionName, subtopics: subs } = recommendedTopics[ti];

    if (sectionName === null) {
      // Null section — each subtopic string = standalone Topic
      for (let si = 0; si < subs.length; si++) {
        const name = subs[si].trim();
        if (!name) continue;
        await prisma.topic.upsert({
          where: { subjectId_name: { subjectId, name } },
          update: { sortOrder: si },
          create: { subjectId, sectionLabel: null, name, sortOrder: si },
        });
        topics++;
      }
      continue;
    }

    // Named section → Topic, each subtopic → SubTopic
    const topic = await prisma.topic.upsert({
      where: { subjectId_name: { subjectId, name: sectionName } },
      update: { sortOrder: ti },
      create: { subjectId, sectionLabel: sectionName, name: sectionName, sortOrder: ti },
    });
    topics++;

    for (let si = 0; si < subs.length; si++) {
      const name = subs[si].trim();
      if (!name) continue;
      await prisma.subTopic.upsert({
        where: { topicId_name: { topicId: topic.id, name } },
        update: { sortOrder: si },
        create: { topicId: topic.id, name, sortOrder: si },
      });
      subtopics++;
    }
  }

  for (const book of textbooks) {
    const authors = book.authors ? book.authors : book.author ? [book.author] : [];
    const exists = await prisma.recommendedTextbook.findFirst({
      where: { subjectId, title: { equals: book.title, mode: "insensitive" } },
      select: { id: true },
    });
    if (!exists) {
      await prisma.recommendedTextbook.create({
        data: { subjectId, title: book.title, authors, edition: book.edition ?? null, year: book.year ?? null, publisher: book.publisher ?? null },
      });
      books++;
    }
  }

  console.log(`   ✓  Topics: ${topics}  SubTopics: ${subtopics}  Textbooks: ${books}`);
}

main().catch((err) => { console.error("Failed:", err); process.exit(1); }).finally(() => prisma.$disconnect());
