const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Health concerns from the home page concern grid
const healthConcerns = [
  { name: "Pain Relief", category: "Pain Relief" },
  { name: "Cough, Cold & Flu", category: "Cough, Cold & Flu" },
  { name: "Mother & Kids", category: "Baby & Child Health" },
  { name: "Gut Health", category: "Gut Health" },
  { name: "Vitamins", category: "Vitamins" },
  { name: "His Health", category: "His Health" },
  { name: "Her Health", category: "Her Health" },
  { name: "Mental Wellness", category: "Stress & Sleep" },
];

async function main() {
    console.log("Checking health concerns and their categories...\n");

    for (const concern of healthConcerns) {
        console.log(`Checking: ${concern.name} -> ${concern.category}`);

        // Find the category
        const category = await prisma.category.findFirst({
            where: { name: concern.category },
            include: {
                products: {
                    select: { id: true, name: true }
                }
            }
        });

        if (!category) {
            console.log(`❌ Category "${concern.category}" does not exist in database`);
        } else {
            const productCount = category.products.length;
            console.log(`✅ Category "${concern.category}" exists with ${productCount} products`);

            if (productCount === 0) {
                console.log(`⚠️  WARNING: Category has no products!`);
            } else {
                console.log(`   Sample products: ${category.products.slice(0, 3).map(p => p.name).join(', ')}`);
            }
        }

        console.log(''); // Empty line for readability
    }

    // Also list all categories in the database
    console.log("All categories in database:");
    const allCategories = await prisma.category.findMany({
        include: {
            _count: {
                select: { products: true }
            }
        }
    });

    allCategories.forEach(cat => {
        console.log(`- ${cat.name}: ${cat._count.products} products`);
    });
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());