const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const batches = [
        'onehealth_batch_a.json',
        'onehealth_batch_e.json',
        'onehealth_batch_i.json',
        'onehealth_batch_o.json',
        'onehealth_batch_u.json'
    ];

    let totalInBatches = 0;
    const batchProducts = new Set();

    for (const file of batches) {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            const items = data.value || [];
            totalInBatches += items.length;
            items.forEach(item => {
                if (item.searchable && item.searchable.name) {
                    batchProducts.add(item.searchable.name.toLowerCase().trim());
                }
            });
        }
    }

    const dbProducts = await prisma.product.findMany({
        select: { name: true }
    });
    
    const dbProductNames = new Set(dbProducts.map(p => p.name.toLowerCase().trim()));

    console.log(`Total products in local JSON batches: ${totalInBatches}`);
    console.log(`Unique products in local JSON batches: ${batchProducts.size}`);
    console.log(`Total products in your database: ${dbProducts.length}`);

    let missingCount = 0;
    const missingSample = [];

    for (const name of batchProducts) {
        if (!dbProductNames.has(name)) {
            missingCount++;
            if (missingSample.length < 10) missingSample.push(name);
        }
    }

    console.log(`Products in JSON batches but NOT in your database: ${missingCount}`);
    if (missingSample.length > 0) {
        console.log("Sample missing products:", missingSample);
    }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
