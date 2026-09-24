const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    const products = await prisma.product.findMany({
        take: 5,
        include: { healthConcerns: true, category: true }
    });

    products.forEach(p => {
        console.log(`Product: ${p.name}`);
        console.log(`Category: ${p.category.name}`);
        console.log(`Health Concerns: ${p.healthConcerns.map(h => h.name).join(', ') || 'None'}`);
        console.log('---');
    });

    // Also check health concerns
    const healthConcerns = await prisma.healthConcern.findMany({
        take: 10,
        include: { _count: { select: { products: true } } }
    });

    console.log('\nHealth Concerns:');
    healthConcerns.forEach(hc => {
        console.log(`${hc.name}: ${hc._count.products} products`);
    });
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());