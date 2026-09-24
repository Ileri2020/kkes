const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
    // 1. Load User Brands and Map Brands and Upsert them
    const userBrandsPath = path.join(__dirname, 'user_brands.json');
    const userBrands = JSON.parse(fs.readFileSync(userBrandsPath, 'utf-8'));
    
    const brandMapPath = path.join(__dirname, 'brand_map.json');
    const brandIdToName = JSON.parse(fs.readFileSync(brandMapPath, 'utf-8'));

    const allBrandsToCreate = new Set(userBrands);
    Object.values(brandIdToName).forEach(name => allBrandsToCreate.add(name));

    console.log(`Upserting ${allBrandsToCreate.size} unique brands...`);
    for (const name of allBrandsToCreate) {
        if (!name || name === "Brand" || name === "General") continue;
        await prisma.brand.upsert({
            where: { name: name },
            update: {},
            create: { name: name }
        });
    }
    
    // 2. Load existing Brand records to map names to IDs
    const dbBrands = await prisma.brand.findMany();
    const brandNameToId = new Map(dbBrands.map(b => [b.name.toLowerCase(), b.id]));

    // 3. Load Brand Map (ID -> Name) - already loaded above
    // const brandMapPath = path.join(__dirname, 'brand_map.json');
    // const brandIdToName = JSON.parse(fs.readFileSync(brandMapPath, 'utf-8'));
    // Normalize keys: Brand_161 -> 161
    const normalizedIdMap = {};
    for (const [key, name] of Object.entries(brandIdToName)) {
        const id = key.replace('Brand_', '');
        normalizedIdMap[id] = name;
    }

    // 4. Gather Product mappings from JSON batches
    const batches = [
        'onehealth_batch_a.json',
        'onehealth_batch_e.json',
        'onehealth_batch_i.json',
        'onehealth_batch_o.json',
        'onehealth_batch_u.json'
    ];

    const productNameToBrandId = new Map();
    console.log("Reading data batches...");
    for (const batchFile of batches) {
        const batchPath = path.join(__dirname, batchFile);
        if (!fs.existsSync(batchPath)) continue;
        
        const data = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
        const items = data.value || [];
        for (const item of items) {
            const p = item.searchable;
            if (p && p.name && p.brand_id) {
                productNameToBrandId.set(p.name.toLowerCase().trim(), p.brand_id);
            }
        }
    }
    console.log(`Gathered ${productNameToBrandId.size} product-brand mappings from JSON.`);

    // 5. Update Products in DB
    const dbProducts = await prisma.product.findMany();
    console.log(`Linking brands for ${dbProducts.length} products...`);

    let linkedCount = 0;
    let manualMatchCount = 0;

    for (const product of dbProducts) {
        const normalizedName = product.name.toLowerCase().trim();
        let brandName = null;

        // Try exact match from JSON batches
        const ohBrandId = productNameToBrandId.get(normalizedName);
        if (ohBrandId && normalizedIdMap[ohBrandId]) {
            brandName = normalizedIdMap[ohBrandId];
        }

        // If no match from batches, try fuzzy match with user list if it's a "General" or "Brand" product
        if (!brandName) {
            // Check if product name *starts with* one of the brand names
            for (const bName of userBrands) {
                if (bName.length > 3 && normalizedName.startsWith(bName.toLowerCase())) {
                    brandName = bName;
                    manualMatchCount++;
                    break;
                }
            }
        }

        if (brandName) {
            const bId = brandNameToId.get(brandName.toLowerCase());
            if (bId) {
                await prisma.product.update({
                    where: { id: product.id },
                    data: { brandId: bId }
                });
                linkedCount++;
                if (linkedCount % 100 === 0) console.log(`  Linked ${linkedCount} products...`);
            }
        }
    }

    console.log(`Task Complete!`);
    console.log(`Total products updated with Brand: ${linkedCount}`);
    console.log(`(Of which ${manualMatchCount} were matched via name Prefix)`);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
