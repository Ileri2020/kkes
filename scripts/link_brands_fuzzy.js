const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
    const userBrandsPath = path.join(__dirname, 'user_brands.json');
    const userBrands = JSON.parse(fs.readFileSync(userBrandsPath, 'utf-8'));
    
    // Sort brands by length descending to match longest brand names first (e.g., "Pfizer Ltd" before "Pfizer")
    const sortedBrands = [...userBrands].sort((a, b) => b.length - a.length);

    const dbBrands = await prisma.brand.findMany();
    const brandNameToId = new Map(dbBrands.map(b => [b.name.toLowerCase(), b.id]));

    const allDbProducts = await prisma.product.findMany();
    const dbProducts = allDbProducts.filter(p => !p.brandId);

    console.log(`Attempting to link ${dbProducts.length} unlinked products via name matching...`);

    let linkedCount = 0;
    const failures = [];

    for (const product of dbProducts) {
        const normalizedName = product.name.toLowerCase();
        let foundBrand = null;

        for (const bName of sortedBrands) {
            if (bName.length < 3) continue;
            // Check if name contains brand name (often brands are at the start or end)
            if (normalizedName.includes(bName.toLowerCase())) {
                foundBrand = bName;
                break;
            }
        }

        if (foundBrand) {
            const bId = brandNameToId.get(foundBrand.toLowerCase());
            if (bId) {
                await prisma.product.update({
                    where: { id: product.id },
                    data: { brandId: bId }
                });
                linkedCount++;
            }
        } else {
            failures.push(product.name);
        }
        
        if ((linkedCount + failures.length) % 100 === 0) {
            console.log(`  Processed ${linkedCount + failures.length} products...`);
        }
    }

    console.log(`Fuzzy Link Complete!`);
    console.log(`Newly linked: ${linkedCount}`);
    console.log(`Still unlinked: ${failures.length}`);
    
    if (failures.length > 0) {
        console.log("Sample failures:", failures.slice(0, 10));
    }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
