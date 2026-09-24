const fs = require('fs');
const path = require('path');

const batches = [
    'onehealth_batch_a.json',
    'onehealth_batch_e.json',
    'onehealth_batch_i.json',
    'onehealth_batch_o.json',
    'onehealth_batch_u.json'
];

const uniqueBrandIds = new Set();
for (const file of batches) {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, file), 'utf-8'));
    const items = data.value || [];
    for (const item of items) {
        if (item.searchable && item.searchable.brand_id) {
            uniqueBrandIds.add(item.searchable.brand_id);
        }
    }
}

console.log(`Unique Brand IDs found in batches: ${uniqueBrandIds.size}`);
console.log(`Sample IDs:`, Array.from(uniqueBrandIds).slice(0, 10));

const brandMap = JSON.parse(fs.readFileSync(path.join(__dirname, 'brand_map.json'), 'utf-8'));
console.log(`Brand IDs already mapped: ${Object.keys(brandMap).length}`);
