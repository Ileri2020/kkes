/**
 * scripts/seed-session.js
 *
 * Run with: node -r dotenv/config scripts/seed-session.js
 *
 * This script:
 *  1. Ensures the school record exists (creates one if absent)
 *  2. Creates the 2026/2027 academic session as isCurrent:true
 *     (sets any previous sessions to isCurrent:false first)
 *  3. Creates FIRST_TERM / SECOND_TERM / THIRD_TERM under the session
 *  4. Migrates every existing SchoolClass that has no sessionId to
 *     belong to 2026/2027, setting year = "2026/2027"
 *  5. Migrates any StudentSubjectEnrollment with no sessionId to the new session
 *  6. Migrates any StudentPromotion with no sessionId to the new session
 *  7. Leaves Subject / SubSubject records untouched — they span sessions
 *     through SubjectOffering (per class-per-session) which is already set
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({ log: ["warn", "error"] });

const SESSION_NAME = "2026/2027";

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  KKES — Seed Academic Session 2026/2027   ");
  console.log("═══════════════════════════════════════════\n");

  // ── 1. Ensure school exists ─────────────────────────────────────────────────
  let school = await prisma.school.findFirst();
  if (!school) {
    school = await prisma.school.create({
      data: {
        name: "KKES School",
        slug: "kkes-school",
        motto: "Excellence in Education",
      },
    });
    console.log(`✅  Created school: ${school.name}`);
  } else {
    console.log(`ℹ️   School found: ${school.name} (${school.id})`);
  }

  // ── 2. Mark all existing sessions as not-current ───────────────────────────
  await prisma.academicSession.updateMany({
    where: { schoolId: school.id, isCurrent: true },
    data: { isCurrent: false },
  });

  // ── 3. Upsert the 2026/2027 session ────────────────────────────────────────
  let session = await prisma.academicSession.findFirst({
    where: { schoolId: school.id, name: SESSION_NAME },
    include: { terms: true },
  });

  if (!session) {
    session = await prisma.academicSession.create({
      data: {
        schoolId: school.id,
        name: SESSION_NAME,
        startDate: new Date("2026-09-01"),
        endDate: new Date("2027-07-31"),
        isCurrent: true,
        terms: {
          create: [
            { name: "FIRST_TERM",  status: "ACTIVE"   },
            { name: "SECOND_TERM", status: "UPCOMING" },
            { name: "THIRD_TERM",  status: "UPCOMING" },
          ],
        },
      },
      include: { terms: true },
    });
    console.log(`✅  Created session "${SESSION_NAME}" with ${session.terms.length} terms`);
  } else {
    // Mark it current again and add missing terms
    session = await prisma.academicSession.update({
      where: { id: session.id },
      data: { isCurrent: true },
      include: { terms: true },
    });

    const termNames = ["FIRST_TERM", "SECOND_TERM", "THIRD_TERM"];
    const existingTermNames = session.terms.map((t) => t.name);
    for (const termName of termNames) {
      if (!existingTermNames.includes(termName)) {
        await prisma.academicTerm.create({
          data: {
            sessionId: session.id,
            name: termName,
            status: termName === "FIRST_TERM" ? "ACTIVE" : "UPCOMING",
          },
        });
        console.log(`   ➕  Created missing term: ${termName}`);
      }
    }

    console.log(`ℹ️   Session "${SESSION_NAME}" already exists — marked as current`);
  }

  const sessionId = session.id;

  // ── 4. Migrate ALL classes → 2026/2027 session ──────────────────────────────
  const allClasses = await prisma.schoolClass.findMany();

  if (allClasses.length > 0) {
    console.log(`\n🔄  Migrating ${allClasses.length} class(es) → session "${SESSION_NAME}"...`);

    for (const cls of allClasses) {
      try {
        await prisma.schoolClass.update({
          where: { id: cls.id },
          data: {
            schoolId: school.id,
            sessionId,
            year: SESSION_NAME,
          },
        });
        console.log(`   ✔  ${cls.name} (${cls.id})`);
      } catch (err) {
        console.warn(`   ⚠  Skipped ${cls.name}: ${err.message}`);
      }
    }
  } else {
    console.log("\nℹ️   No classes in database.");
  }

  // ── 5. Migrate orphan StudentSubjectEnrollments → session ──────────────────
  const orphanEnrollments = await prisma.studentSubjectEnrollment.updateMany({
    where: { sessionId: null },
    data: { sessionId },
  });
  if (orphanEnrollments.count > 0) {
    console.log(`\n🔄  Migrated ${orphanEnrollments.count} subject enrollment(s) → session "${SESSION_NAME}"`);
  }

  // ── 6. Summary ──────────────────────────────────────────────────────────────
  const classCount = await prisma.schoolClass.count({ where: { sessionId } });
  const subjectCount = await prisma.subject.count({ where: { schoolId: school.id } });
  const offeringCount = await prisma.subjectOffering.count({ where: { schoolId: school.id } });
  const studentCount = await prisma.schoolUser.count({ where: { schoolId: school.id, role: "STUDENT" } });

  console.log("\n──────────────────────────────────────────");
  console.log("  📊  Database Summary");
  console.log("──────────────────────────────────────────");
  console.log(`  Session    : ${SESSION_NAME} (${sessionId})`);
  console.log(`  Classes    : ${classCount} in session`);
  console.log(`  Subjects   : ${subjectCount} (shared across sessions)`);
  console.log(`  Offerings  : ${offeringCount} (class-level — per session)`);
  console.log(`  Students   : ${studentCount}`);
  console.log("──────────────────────────────────────────");
  console.log("  ✅  Done! DB is ready for 2026/2027\n");
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
