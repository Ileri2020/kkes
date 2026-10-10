const { PrismaClient } = require("@prisma/client");

const url1 = "mongodb+srv://adepojuololade2020:j0k2iy9xXcraCpHn@succomongo.b5r4o.mongodb.net/healthclique?retryWrites=true&w=majority&appName=succomongo";
const url2 = "mongodb+srv://adepojuololade2003_db_user:8IcoXagdfkzZurbm@cluster0.gkq7rkk.mongodb.net/kkes?retryWrites=true&w=majority&appName=ileritech";

function normalizeName(name) {
  return (name || "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

async function dedupeUrl(url, label) {
  console.log(`\n========================================`);
  console.log(`Checking DB (${label}): ${url.split("@")[1]}`);
  console.log(`========================================`);

  const prisma = new PrismaClient({
    datasources: { db: { url } },
  });

  try {
    const subjects = await prisma.subject.findMany({
      include: { offerings: true },
    });
    console.log(`Found ${subjects.length} subjects in ${label}`);

    if (subjects.length === 0) return;

    // Print all subject names
    console.log("All subjects found:");
    subjects.forEach((s) => console.log(`  - [ID: ${s.id}] "${s.name}" (DeptIDs: ${s.departmentIds?.length || 0})`));

    const groups = new Map();
    for (const subject of subjects) {
      const key = `${subject.schoolId}:::${normalizeName(subject.name)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(subject);
    }

    let totalDeleted = 0;
    for (const [key, group] of groups.entries()) {
      if (group.length <= 1) continue;

      console.log(`\nFound ${group.length} duplicates for key "${key}":`);
      group.forEach((s) => console.log(`  - ID: ${s.id}, Name: "${s.name}", Created: ${s.createdAt}`));

      group.sort((a, b) => {
        if (!a.parentSubjectId && b.parentSubjectId) return -1;
        if (a.parentSubjectId && !b.parentSubjectId) return 1;
        if ((b.departmentIds?.length || 0) !== (a.departmentIds?.length || 0)) {
          return (b.departmentIds?.length || 0) - (a.departmentIds?.length || 0);
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      const primary = group[0];
      const duplicates = group.slice(1);
      const duplicateIds = duplicates.map((d) => d.id);

      console.log(`Keeping primary: "${primary.name}" (ID: ${primary.id})`);
      console.log(`Deleting ${duplicateIds.length} duplicate IDs: ${duplicateIds.join(", ")}`);

      await prisma.subject.updateMany({
        where: { parentSubjectId: { in: duplicateIds } },
        data: { parentSubjectId: primary.id },
      });

      await prisma.subjectOffering.deleteMany({
        where: { subjectId: { in: duplicateIds } },
      });

      const deleteRes = await prisma.subject.deleteMany({
        where: { id: { in: duplicateIds } },
      });

      totalDeleted += deleteRes.count;
      console.log(`Deleted ${deleteRes.count} duplicates for "${primary.name}".`);
    }

    console.log(`Finished ${label}. Total duplicates deleted: ${totalDeleted}`);
  } catch (err) {
    console.error(`Error checking ${label}:`, err.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await dedupeUrl(url1, "healthclique URL");
  await dedupeUrl(url2, "kkes URL");
}

main();
