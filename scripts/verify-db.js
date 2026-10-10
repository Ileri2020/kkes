// @ts-check
"use strict";

const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
try { dns.setServers(["8.8.8.8", "1.1.1.1"]); } catch (e) {}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const [schools, users, parentSubjects, topics, subtopics] = await Promise.all([
    prisma.school.count(),
    prisma.user.count(),
    prisma.subject.count({ where: { parentSubjectId: null } }),
    prisma.topic.count(),
    prisma.subTopic.count(),
  ]);

  console.log("=== KKES Database Verification ===");
  console.log(`Schools: ${schools}`);
  console.log(`Users: ${users}`);
  console.log(`Parent Subjects: ${parentSubjects}`);
  console.log(`Topics: ${topics}`);
  console.log(`SubTopics: ${subtopics}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
