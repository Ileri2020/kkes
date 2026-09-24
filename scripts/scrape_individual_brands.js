const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const prisma = new PrismaClient();

async function main() {
    const batches = [
        'onehealth_batch_a.json',
        'onehealth_batch_e.json',
        'onehealth_batch_i.json',
        'onehealth_batch_o.json',
        'onehealth_batch_u.json'
    ];

    const productNameToUrl = new Map();
    for (const file of batches) {
        const dataPath = path.join(__dirname, file);
        if (!fs.existsSync(dataPath)) continue;
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        const items = data.value || [];
        for (const item of items) {
            if (item.searchable && item.searchable.name && item.searchable.url) {
                productNameToUrl.set(item.searchable.name.toLowerCase().trim(), item.searchable.url);
            }
        }
    }

    const dbProducts = await prisma.product.findMany();
    const unlinkedProducts = dbProducts.filter(p => !p.brandId);

    console.log(`Found ${unlinkedProducts.length} unlinked products.`);
    
    const dbBrands = await prisma.brand.findMany();
    const brandNameToId = new Map(dbBrands.map(b => [b.name.toLowerCase(), b.id]));

    let successCount = 0;
    for (let i = 0; i < unlinkedProducts.length; i++) {
        const product = unlinkedProducts[i];
        const url = productNameToUrl.get(product.name.toLowerCase().trim());

        if (url) {
            console.log(`[${i+1}/${unlinkedProducts.length}] Scraping ${product.name} at ${url}...`);
            try {
                const { data } = await axios.get(url, { 
                    timeout: 10000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                const $ = cheerio.load(data);
                
                // Selector for brand link on OneHealth
                const brandName = $('a[href^="/brand/"]').first().text().trim() || 
                                 $('a[href*="brand_id"]').first().text().trim();

                if (brandName) {
                    console.log(`  Found brand: ${brandName}`);
                    let bId = brandNameToId.get(brandName.toLowerCase());
                    if (!bId) {
                        const newBrand = await prisma.brand.create({ data: { name: brandName } });
                        bId = newBrand.id;
                        brandNameToId.set(brandName.toLowerCase(), bId);
                    }
                    await prisma.product.update({
                        where: { id: product.id },
                        data: { brandId: bId }
                    });
                    successCount++;
                } else {
                    console.log(`  No brand found on page.`);
                }
            } catch (err) {
                console.error(`  Error: ${err.message}`);
            }
            // Small delay to avoid being blocked
            await new Promise(r => setTimeout(r, 500));
        } else {
            // console.log(`[${i+1}/${unlinkedProducts.length}] No URL found for ${product.name}`);
        }
        
        if (successCount > 0 && successCount % 20 === 0) {
            console.log(`--- Status: ${successCount} products newly linked ---`);
        }
    }

    console.log(`Scrape Complete. Newly linked: ${successCount}`);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
