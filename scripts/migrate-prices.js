const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting optimized migration...');
    
    // 1. Update Products
    const products = await prisma.product.findMany();
    console.log(`Found ${products.length} products.`);
    
    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const cost = product.price / 1.1;
        await prisma.product.update({
            where: { id: product.id },
            data: { price: cost }
        });
        if (i % 100 === 0) console.log(`Updated ${i} products...`);
    }
    console.log('All products updated.');

    // 2. Update Stocks
    const stocks = await prisma.stock.findMany();
    console.log(`Found ${stocks.length} stocks.`);
    
    for (let i = 0; i < stocks.length; i++) {
      const stock = stocks[i];
      if (stock.pricePerProduct) {
        const cost = stock.pricePerProduct / 1.1;
        await prisma.stock.update({
          where: { id: stock.id },
          data: { 
            pricePerProduct: cost,
            costPerProduct: cost 
          }
        });
      }
      if (i % 100 === 0) console.log(`Updated ${i} stocks...`);
    }
    console.log('All stocks updated.');
    console.log('Migration complete.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
