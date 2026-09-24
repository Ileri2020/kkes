const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    const products = await prisma.product.findMany({
        include: { brand: true }
    });

    const total = products.length;
    const withBrand = products.filter(p => p.brandId).length;
    const brandIds = new Set(products.map(p => p.brandId).filter(Boolean));
    const brandNames = new Set(products.map(p => p.brand?.name).filter(Boolean));

    console.log(`Total products: ${total}`);
    console.log(`Products with brandId: ${withBrand}`);
    console.log(`Unique brand IDs in use: ${brandIds.size}`);
    console.log(`Unique brand names in use: ${brandNames.size}`);
    
    const brands = await prisma.brand.findMany();
    console.log(`Total Brands in database: ${brands.length}`);
    
    if (brands.length > 0) {
        console.log("Sample brands:", brands.slice(0, 5).map(b => b.name));
    }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
