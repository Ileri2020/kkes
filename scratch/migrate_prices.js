const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');

const prisma = new PrismaClient();

function getTokens(str) {
    if (!str) return [];
    return str.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 1);
}

function scoreMatch(tokens1, tokens2) {
    if (tokens1.length === 0 || tokens2.length === 0) return 0;
    let matches = 0;
    for (const t1 of tokens1) {
        if (tokens2.includes(t1)) {
            matches++;
        } else {
             for(const t2 of tokens2) {
                 if(t1.length >= 3 && t2.length >= 3 && (t1.startsWith(t2) || t2.startsWith(t1))) {
                     matches += 0.5;
                     break;
                 }
             }
        }
    }
    return matches / Math.max(tokens1.length, tokens2.length);
}

// Utility to process items in chunks
async function processInChunks(items, chunkSize, processItemFn) {
    for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        await Promise.all(chunk.map(processItemFn));
    }
}

async function main() {
    console.log('Starting migration...');
    const updatedProductIds = new Set();
    const batchSize = 50; // concurrency

    console.log('Ensuring vendors and categories...');
    let pharmaVendor = await prisma.vendor.findUnique({ where: { name: 'pharma-line' } });
    if (!pharmaVendor) pharmaVendor = await prisma.vendor.create({ data: { name: 'pharma-line' } });

    let uncategorized = await prisma.category.findUnique({ where: { name: 'uncategorized' } });
    if (!uncategorized) uncategorized = await prisma.category.create({ data: { name: 'uncategorized' } });

    // Pre-cache all vendors
    console.log('Caching vendors...');
    const allVendors = await prisma.vendor.findMany();
    const vendorCache = new Map(allVendors.map(v => [v.name, v.id]));

    // Extract all unique vendors from data1 and create them sequentially
    const productsAllFile = 'products_all_2026-04-08T12_35_49.902Z.xlsx';
    console.log(`Reading ${productsAllFile}...`);
    const workbook1 = XLSX.readFile(productsAllFile);
    const data1 = XLSX.utils.sheet_to_json(workbook1.Sheets[workbook1.SheetNames[0]]);
    
    console.log('Pre-creating missing vendors from file...');
    const uniqueVendors = new Set();
    for (const row of data1) {
        const vendorName = row['Vendor. '];
        if (vendorName && vendorName !== 'N/A') {
            uniqueVendors.add(vendorName);
        }
    }
    
    for (const vendorName of uniqueVendors) {
        if (!vendorCache.has(vendorName)) {
            const vendor = await prisma.vendor.create({ data: { name: vendorName } });
            vendorCache.set(vendorName, vendor.id);
        }
    }

    // Pre-fetch products
    console.log('Fetching existing products...');
    const allExistingProducts = await prisma.product.findMany({ select: { id: true, name: true } });
    const existingProductIds = new Set(allExistingProducts.map(p => p.id));
    
    const productsWithTokens = allExistingProducts.map(p => ({
        id: p.id,
        name: p.name,
        tokens: getTokens(p.name)
    }));

    let processed1 = 0;
    await processInChunks(data1, batchSize, async (row) => {
        const id = row['id'];
        if (!id || !existingProductIds.has(id)) return;
        
        let costPrice = row['Cost Price'];
        costPrice = (costPrice === 'N/A' || !costPrice) ? 0 : parseFloat(costPrice) || 0;
        
        const vendorName = row['Vendor. '];
        const vendorId = vendorName && vendorName !== 'N/A' ? vendorCache.get(vendorName) : null;

        try {
            await prisma.product.update({ where: { id }, data: { price: costPrice } });
            if (vendorId) {
                await prisma.productVendor.upsert({
                    where: { productId_vendorId: { productId: id, vendorId: vendorId } },
                    update: { costPrice },
                    create: { productId: id, vendorId, costPrice, isDefault: true }
                });
            }
            updatedProductIds.add(id);
            processed1++;
            if (processed1 % 500 === 0) console.log(`Processed ${processed1} from file 1...`);
        } catch (e) {
            console.error(`Error updating product ${id}: ${e.message}`);
        }
    });
    console.log(`Completed file 1. Updated ${processed1} products.`);

    // 2. Process Pharma-line pricelist
    const pharmaLineFile = 'Pharma-line pricelist.xlsx';
    console.log(`Reading ${pharmaLineFile}...`);
    const workbook2 = XLSX.readFile(pharmaLineFile);
    const data2 = XLSX.utils.sheet_to_json(workbook2.Sheets[workbook2.SheetNames[0]], { header: 1 }).slice(5);
    
    let pharmaProcessed = 0;
    let newProductsCount = 0;
    let matchedProductsCount = 0;

    console.log(`Found ${data2.length} rows in Pharma-line. Processing...`);

    // Not using concurrent chunks here easily because we might create same product twice, 
    // but we can just use sequential or chunks if we don't care about rare duplicates
    for (const row of data2) {
        if (!row || row.length < 3) continue;
        const rawName = row[1];
        if (!rawName || typeof rawName !== 'string' || rawName.trim() === 'ARTICLES') continue;
        
        let price = parseFloat(row[2]) || 0;
        const rowTokens = getTokens(rawName);
        let bestMatch = null, bestScore = 0;

        for (const p of productsWithTokens) {
            const score = scoreMatch(rowTokens, p.tokens);
            if (score > bestScore) { bestScore = score; bestMatch = p; }
        }

        let matchedId = (bestScore >= 0.5 && bestMatch) ? bestMatch.id : null;

        if (matchedId) {
            await prisma.product.update({ where: { id: matchedId }, data: { price } });
            await prisma.productVendor.upsert({
                where: { productId_vendorId: { productId: matchedId, vendorId: pharmaVendor.id } },
                update: { costPrice: price },
                create: { productId: matchedId, vendorId: pharmaVendor.id, costPrice: price, isDefault: true }
            });
            updatedProductIds.add(matchedId);
            matchedProductsCount++;
        } else {
            const newProduct = await prisma.product.create({
                data: {
                    name: rawName.trim(), price, categoryId: uncategorized.id,
                    vendors: { create: { vendorId: pharmaVendor.id, costPrice: price, isDefault: true } }
                }
            });
            updatedProductIds.add(newProduct.id);
            productsWithTokens.push({ id: newProduct.id, name: newProduct.name, tokens: getTokens(newProduct.name) });
            newProductsCount++;
        }
        pharmaProcessed++;
        if (pharmaProcessed % 500 === 0) console.log(`Processed ${pharmaProcessed} from Pharma-line...`);
    }
    console.log(`Completed Pharma-line. Matched: ${matchedProductsCount}, Created: ${newProductsCount}`);

    // 3. Reset remaining products
    console.log(`Resetting un-updated products...`);
    const unupdatedIds = [...existingProductIds].filter(id => !updatedProductIds.has(id));
    console.log(`Found ${unupdatedIds.length} products to reset.`);
    
    let resetCount = 0;
    await processInChunks(unupdatedIds, batchSize, async (pid) => {
        try {
            await prisma.product.update({ where: { id: pid }, data: { price: 0 } });
            await prisma.productVendor.updateMany({ where: { productId: pid }, data: { costPrice: 0 } });
            resetCount++;
            if (resetCount % 1000 === 0) console.log(`Reset ${resetCount} products...`);
        } catch(e) { /* ignore missing */ }
    });
    
    console.log(`Reset ${resetCount} total products to 0.`);
    console.log('Migration complete.');
}

main()
    .catch(e => { console.error('Fatal error:', e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
