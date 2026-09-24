const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        select: { name: true, category: { select: { name: true } } },
        take: 20
    });
    console.log("Sample products in DB:");
    products.forEach(p => console.log(`- ${p.name} (${p.category?.name})`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
