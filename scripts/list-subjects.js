// @ts-check
"use strict";
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const [total, parents, subSubjects] = await Promise.all([
    prisma.subject.count(),
    prisma.subject.count({ where: { parentSubjectId: null } }),
    prisma.subject.count({ where: { parentSubjectId: { not: null } } }),
  ]);

  console.log(`\nDB Subject counts:`);
  console.log(`  Total:       ${total}`);
  console.log(`  Parents:     ${parents}`);
  console.log(`  Sub-subjects: ${subSubjects}`);

  // List all subjects regardless
  const all = await prisma.subject.findMany({
    orderBy: [{ parentSubjectId: "asc" }, { name: "asc" }],
    select: { id: true, name: true, code: true, schoolId: true, parentSubjectId: true },
    take: 60,
  });
  console.log(`\nAll subjects (up to 60):\n`);
  for (const s of all) {
    const tag = s.parentSubjectId ? "  [sub]" : "[parent]";
    console.log(`  ${tag} ${s.name.padEnd(50)} school: ${s.schoolId}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
