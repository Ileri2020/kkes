const XLSX = require('xlsx');

function getFirstRows(filename, limit = 5) {
    const workbook = XLSX.readFile(filename);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    return json.slice(0, limit);
}

console.log('Rows for products_all:');
console.log(getFirstRows('products_all_2026-04-08T12_35_49.902Z.xlsx'));

console.log('\nRows for Pharma-line pricelist:');
console.log(getFirstRows('Pharma-line pricelist.xlsx', 15));
