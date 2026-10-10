/**
 * scripts/seed-jamb-topics.ts
 *
 * Seeds Topic, SubTopic, and RecommendedTextbook records from the JAMB JSON
 * topic files at pq/jamb/topics/*.json.
 *
 * Topics are linked to the PARENT subject in DB (not sub-subjects).
 * Matching is done by subject name (case-insensitive). A topic is global —
 * it is attached to the first school's copy of that subject found in DB.
 *
 * Run:   npx ts-node -P tsconfig.json scripts/seed-jamb-topics.ts
 */

import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TOPICS_DIR = path.join(__dirname, "..", "pq", "jamb", "topics");

interface JambTextbook {
  title: string;
  author?: string;
  authors?: string[];
  edition?: string;
  year?: number;
  publisher?: string;
}

interface JambRecommendedTopic {
  topic: string | null;
  subtopics: string[];
}

interface JambSubjectJson {
  subject: {
    name: string;
    code: string;
    recommended_topics: JambRecommendedTopic[];
    recommended_textbooks?: JambTextbook[];
  };
}

function normalize(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

async function main() {
  const files = fs.readdirSync(TOPICS_DIR).filter((f) => f.endsWith(".json"));
  console.log(`\nFound ${files.length} JAMB topic file(s).\n`);

  for (const file of files) {
    const raw = fs.readFileSync(path.join(TOPICS_DIR, file), "utf-8");
    const json: JambSubjectJson = JSON.parse(raw);
    const { name: subjectName, recommended_topics, recommended_textbooks = [] } = json.subject;

    console.log(`── Processing: ${subjectName} (${file})`);

    // ── Find a parent subject in DB with matching name ──────────────────────
    // We look across all schools — pick first match that is a parent (no parentSubjectId)
    const dbSubject = await prisma.subject.findFirst({
      where: {
        parentSubjectId: null,
        name: { equals: subjectName, mode: "insensitive" },
      },
      select: { id: true, name: true, schoolId: true },
    });

    if (!dbSubject) {
      // Try partial / alternate name matching (e.g. "Principles of Accounts" → "Accounting")
      const alternateNames: Record<string, string[]> = {
        "principles of accounts": ["accounting", "principles of accounts", "financial accounting"],
        "literature in english": ["literature", "literature in english"],
        "english language": ["english language", "english"],
        "agricultural science": ["agricultural science", "agriculture"],
        "christian religious studies": ["christian religious studies", "crs", "c.r.s"],
        "islamic religious studies": ["islamic religious studies", "irs"],
      };
      const normJson = normalize(subjectName);
      const aliases = alternateNames[normJson] ?? [normJson];

      const altMatch = await prisma.subject.findFirst({
        where: {
          parentSubjectId: null,
          OR: aliases.map((alias) => ({ name: { equals: alias, mode: "insensitive" as const } })),
        },
        select: { id: true, name: true, schoolId: true },
      });

      if (!altMatch) {
        console.log(`   ⚠  No DB subject found for "${subjectName}" — skipping.\n`);
        continue;
      }
      console.log(`   ↳ Matched to DB subject: "${altMatch.name}" (id: ${altMatch.id})`);
      await seedSubject(altMatch.id, recommended_topics, recommended_textbooks);
    } else {
      console.log(`   ↳ Matched to DB subject: "${dbSubject.name}" (id: ${dbSubject.id})`);
      await seedSubject(dbSubject.id, recommended_topics, recommended_textbooks);
    }

    console.log();
  }

  console.log("✅  JAMB topic seeding complete.\n");
}

async function seedSubject(
  subjectId: string,
  recommendedTopics: JambRecommendedTopic[],
  textbooks: JambTextbook[]
) {
  let topicCount = 0;
  let subTopicCount = 0;

  for (let ti = 0; ti < recommendedTopics.length; ti++) {
    const { topic: sectionOrTopicName, subtopics } = recommendedTopics[ti];

    // When topic === null, the subtopics are uncategorised loose topics
    // We store them as top-level topics with no sectionLabel
    if (sectionOrTopicName === null) {
      // Each subtopic string becomes its own Topic (uncategorised)
      for (let si = 0; si < subtopics.length; si++) {
        const subName = subtopics[si].trim();
        if (!subName) continue;

        await prisma.topic.upsert({
          where: { subjectId_name: { subjectId, name: subName } },
          update: { sortOrder: si },
          create: {
            subjectId,
            sectionLabel: null,
            name: subName,
            sortOrder: si,
          },
        });
        topicCount++;
      }
      continue;
    }

    // Named section: the section itself becomes a Topic, and each subtopic becomes a SubTopic
    const topic = await prisma.topic.upsert({
      where: { subjectId_name: { subjectId, name: sectionOrTopicName } },
      update: { sortOrder: ti },
      create: {
        subjectId,
        sectionLabel: sectionOrTopicName, // section label = topic name for sectioned topics
        name: sectionOrTopicName,
        sortOrder: ti,
      },
    });
    topicCount++;

    for (let si = 0; si < subtopics.length; si++) {
      const subName = subtopics[si].trim();
      if (!subName) continue;

      await prisma.subTopic.upsert({
        where: { topicId_name: { topicId: topic.id, name: subName } },
        update: { sortOrder: si },
        create: {
          topicId: topic.id,
          name: subName,
          sortOrder: si,
        },
      });
      subTopicCount++;
    }
  }

  // ── Recommended Textbooks ──────────────────────────────────────────────────
  let bookCount = 0;
  for (const book of textbooks) {
    const authors: string[] = book.authors
      ? book.authors
      : book.author
        ? [book.author]
        : [];

    // Upsert by title + subjectId (title is unique enough per subject)
    const existing = await prisma.recommendedTextbook.findFirst({
      where: { subjectId, title: { equals: book.title, mode: "insensitive" } },
      select: { id: true },
    });

    if (!existing) {
      await prisma.recommendedTextbook.create({
        data: {
          subjectId,
          title: book.title,
          authors,
          edition: book.edition ?? null,
          year: book.year ?? null,
          publisher: book.publisher ?? null,
        },
      });
      bookCount++;
    }
  }

  console.log(`   ✓  Topics: ${topicCount}  SubTopics: ${subTopicCount}  Textbooks: ${bookCount}`);
}

main()
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
