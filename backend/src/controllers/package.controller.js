import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all investment packages
 */
export const getPackages = async (req, res) => {
  try {
    const packages = await prisma.investmentPackage.findMany({
      orderBy: { minAmount: 'asc' }
    });

    return res.json({
      success: true,
      packages
    });
  } catch (error) {
    console.error('Get packages error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get packages' });
  }
};

