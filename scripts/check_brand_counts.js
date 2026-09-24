const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const brand = await prisma.brand.findUnique({
        where: { name: "Brand" },
        include: { _count: { select: { products: true } } }
    });
    
    if (brand) {
        console.log(`Brand "Brand" has ${brand._count.products} products.`);
    } else {
        console.log(`Brand "Brand" does not exist.`);
    }

    const brands = await prisma.brand.findMany({
        include: { _count: { select: { products: true } } },
        orderBy: { products: { _count: 'desc' } }
    });

    console.log("Top 10 Brands by product count:");
    brands.slice(0, 10).forEach(b => {
        console.log(`${b.name}: ${b._count.products}`);
    });
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
