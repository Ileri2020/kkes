const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.time('query');
    const data = await prisma.product.findMany({
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        activeIngredients: { select: { id: true, name: true } },
        stock: { select: { id: true, addedQuantity: true, costPerProduct: true, createdAt: true } },
        bulkPrices: { select: { id: true, name: true, quantity: true, price: true } }
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    console.timeEnd('query');
    console.log('Products found:', data.length);
    if (data.length > 0) {
      console.log('Sample Product:', data[0].name);
    }
  } catch (e) {
    console.error('Test Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
