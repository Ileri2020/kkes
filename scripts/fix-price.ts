import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

(async () => {
  try {
    const updated = await prisma.product.update({
      where: { id: '6a023f344298cee377cfede9' },
      data: { price: 7700 }
    });

    console.log('✅ Product updated!');
    console.log('Cost Price (product.price): ₦' + updated.price.toLocaleString());
    console.log('\nDynamic Display Prices:');
    console.log('- Customer: ₦' + Math.ceil((updated.price * 1.35) / 5) * 5);
    console.log('- Professional: ₦' + Math.ceil((updated.price * 1.2) / 5) * 5);
    console.log('- Wholesaler/Admin/Staff: ₦' + Math.ceil((updated.price * 1.1) / 5) * 5);
  } finally {
    await prisma.$disconnect();
  }
})();
