const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const states = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
    "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo", 
    "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", 
    "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", 
    "Yobe", "Zamfara"
  ];

  for (const state of states) {
    await prisma.deliveryFee.upsert({
      where: { country_state_city_region: { country: "Nigeria", state, city: "Any", region: "Any" } },
      update: { price: 100 },
      create: { country: "Nigeria", state, city: "Any", region: "Any", price: 100 }
    });
  }
  console.log("Seeded delivery fees for all states to 100 NGN");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
