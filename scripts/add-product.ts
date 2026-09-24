import { PrismaClient } from '@prisma/client';
import { v2 as cloudinaryV2 } from 'cloudinary';
import * as fs from 'fs';

const prisma = new PrismaClient();

cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadToCloudinary(imagePath: string): Promise<string> {
  console.log(`📤 Uploading image from: ${imagePath}`);

  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image file not found: ${imagePath}`);
  }

  try {
    const result = await cloudinaryV2.uploader.upload(imagePath, {
      resource_type: 'auto',
    });
    console.log(`✅ Image uploaded successfully: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}

async function addProduct() {
  try {
    console.log('🚀 Starting product addition...\n');

    // 1. Create/Get Category
    console.log('📦 Creating/fetching category: Antibiotic');
    const category = await prisma.category.upsert({
      where: { name: 'Antibiotic' },
      update: {},
      create: {
        name: 'Antibiotic',
        description: 'Antibiotic medications',
      },
    });
    console.log(`✅ Category ready: ${category.id}\n`);

    // 2. Create/Get Brand
    console.log('🏭 Creating/fetching brand: Sandoz');
    const brand = await prisma.brand.upsert({
      where: { name: 'Sandoz' },
      update: {},
      create: {
        name: 'Sandoz',
      },
    });
    console.log(`✅ Brand ready: ${brand.id}\n`);

    // 3. Use local image URL
    console.log('📤 Using local image: /amoksiklav.jpg\n');
    const imageUrl = '/amoksiklav.jpg';

    // 4. Create Product
    console.log('📝 Creating product: Amoksiklav 457/5mL');
    const product = await prisma.product.create({
      data: {
        name: 'Amoksiklav 457/5mL',
        description: 'Amoxycillin + Clavulanic Acid - Antibiotic combination',
        categoryId: category.id,
        brandId: brand.id,
        price: 8500, // Display price (cost is 7700, adding margin)
        images: [imageUrl],
        scarce: false,
        regulatoryClassification: 'Prescription Medicine',
        requiresPrescription: true,
        weight: '5mL',
        form: 'suspension',
      },
    });
    console.log(`✅ Product created: ${product.id}\n`);

    // 5. Create Vendor entry for cost price
    console.log('🤝 Setting up vendor/cost information');
    
    const vendor = await prisma.vendor.upsert({
      where: { name: 'Sandoz Direct' },
      update: {},
      create: {
        name: 'Sandoz Direct',
        address: 'Manufacturer',
      },
    });

    // Create ProductVendor with cost price
    const productVendor = await prisma.productVendor.upsert({
      where: {
        productId_vendorId: {
          productId: product.id,
          vendorId: vendor.id,
        },
      },
      update: {
        costPrice: 7700,
        isDefault: true,
      },
      create: {
        productId: product.id,
        vendorId: vendor.id,
        costPrice: 7700,
        isDefault: true,
      },
    });
    console.log(`✅ Vendor/Cost information set: Cost Price = ₦7,700\n`);

    console.log('🎉 Product added successfully!\n');
    console.log('📊 Product Summary:');
    console.log(`   Name: ${product.name}`);
    console.log(`   Brand: Sandoz`);
    console.log(`   Category: Antibiotic`);
    console.log(`   Display Price: ₦${product.price.toLocaleString()}`);
    console.log(`   Cost Price: ₦7,700`);
    console.log(`   Margin: ₦${(product.price - 7700).toLocaleString()}`);
    console.log(`   Image: ${imageUrl}`);
    console.log(`   Product ID: ${product.id}\n`);
    console.log('💡 Note: Image is stored locally. You can upload to Cloudinary later for CDN hosting.');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addProduct();
