import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPackages() {
  try {
    // Check if packages already exist
    const existing = await prisma.investmentPackage.count();
    if (existing > 0) {
      console.log('Packages already exist, skipping seed');
      return;
    }

    // Create default packages
    const packages = [
      {
        name: 'Starter Package',
        minAmount: 35,
        maxAmount: 999,
        dailyROI: 0.5 // 0.5%
      },
      {
        name: 'Premium Package',
        minAmount: 1000,
        maxAmount: 4999,
        dailyROI: 1.0 // 1%
      },
      {
        name: 'VIP Package',
        minAmount: 5000,
        maxAmount: 100000,
        dailyROI: 2.0 // 2%
      }
    ];

    for (const pkg of packages) {
      await prisma.investmentPackage.create({ data: pkg });
      console.log(`Created package: ${pkg.name}`);
    }

    console.log('✅ Packages seeded successfully');
  } catch (error) {
    console.error('Error seeding packages:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedPackages();

