import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categoriesList = [
  "Health & Wellness", "Health & Pharmacy", "Her Health", "His Health", "Gut Health",
  "Cough, Cold & Flu", "First Aid", "Eye Care", "Pain Relief", "Pharmacy Medication",
  "Skin Treatment", "Independent Living", "Allergy & Hayfever", "Malaria Medications",
  "Midnight Essentials", "Wellness", "Diet & Fitness", "Vitamins", "Sexual Pleasure",
  "Footcare", "Smoking Control", "Stress & Sleep", "Test Kit and Devices", "Covid19 Essentials",
  "Mother & Child", "Mother & Kids", "Pregnancy & Maternity", "Nappies & Wipes",
  "Washing & Bathing", "Feeding", "Baby & Child Health", "Kid’s Hair, Body & Beauty",
  "Hair", "Hair Health", "Shampoo", "Conditioner", "Hair Dye", "Hair Treatment",
  "Hair Styling", "Electric Hair Stylers", "Hair Accessories", "Skin", "Skin Care",
  "Suncare", "Face Masks", "Moisturizers", "Cleansing", "Eye Care", "Body Care",
  "Skin Treatments", "Glam & Fabulous", "Toiletries", "Toiletries Wares", "Washing & Bathing",
  "Bathing Accessories", "Deodorants", "Dental", "Female Hair Removal", "Shaving For Men",
  "Incontinence", "Feminine Care", "Travel", "Mens", "Deodorants", "Fragrance", "Gum"
]

async function main() {
  console.log("Starting category seeding...")
  for (const name of categoriesList) {
    try {
      await prisma.category.upsert({
        where: { name },
        update: {},
        create: { name }
      })
      console.log(`Ensured category: ${name}`)
    } catch (e) {
      console.error(`Error with category ${name}`)
    }
  }
  console.log("Category seeding complete.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
