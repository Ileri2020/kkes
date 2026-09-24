const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
    const userBrandsPath = path.join(__dirname, 'user_brands.json');
    const userBrands = JSON.parse(fs.readFileSync(userBrandsPath, 'utf-8'));
    
    // Sort brands by length descending
    const sortedBrands = [...userBrands].sort((a, b) => b.length - a.length);

    const dbBrands = await prisma.brand.findMany();
    const brandNameToId = new Map(dbBrands.map(b => [b.name.toLowerCase(), b.id]));

    const catchAllBrand = await prisma.brand.findUnique({ where: { name: "Brand" } });
    if (!catchAllBrand) {
        console.log('No brand named "Brand" found. Nothing to re-link.');
        return;
    }

    const productsToRelink = await prisma.product.findMany({
        where: { brandId: catchAllBrand.id }
    });

    console.log(`Attempting to re-link ${productsToRelink.length} products from "Brand" to specific brands...`);

    let relinkedCount = 0;
    
    // Helper to normalize string for comparison (remove dots, dashes, spaces)
    const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

    for (const product of productsToRelink) {
        const pName = product.name;
        const normPName = normalize(pName);
        let match = null;

        for (const bName of sortedBrands) {
            if (bName.length < 3 || bName === "Brand") continue;
            
            const normBName = normalize(bName);
            if (normPName.includes(normBName)) {
                match = bName;
                break;
            }
        }

        if (match) {
            const bId = brandNameToId.get(match.toLowerCase());
            if (bId) {
                await prisma.product.update({
                    where: { id: product.id },
                    data: { brandId: bId }
                });
                relinkedCount++;
            }
        }
    }

    console.log(`Re-linking Complete!`);
    console.log(`Products moved from "Brand" to specific manufacturers: ${relinkedCount}`);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
