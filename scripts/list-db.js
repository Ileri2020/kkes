// @ts-check
"use strict";
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const schools = await prisma.school.findMany({ select: { id: true, name: true, slug: true } });
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true }, take: 10 });
  console.log("\nSchools:", JSON.stringify(schools, null, 2));
  console.log("\nUsers (first 10):", JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
