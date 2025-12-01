import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create a new deposit
 */
export const createDeposit = async (req, res) => {
  try {
    const { packageId, amount } = req.body;
    const userId = req.user.id;

    if (!packageId || !amount) {
      return res.status(400).json({ success: false, error: 'Package ID and amount are required' });
    }

    // Get package
    const pkg = await prisma.investmentPackage.findUnique({
      where: { id: packageId }
    });

    if (!pkg) {
      return res.status(404).json({ success: false, error: 'Package not found' });
    }

    // Validate amount
    if (amount < pkg.minAmount || amount > pkg.maxAmount) {
      return res.status(400).json({
        success: false,
        error: `Amount must be between $${pkg.minAmount} and $${pkg.maxAmount}`
      });
    }

    // Create deposit
    const deposit = await prisma.deposit.create({
      data: {
        userId,
        packageId,
        amount,
        status: 'ACTIVE'
      },
      include: {
        package: true
      }
    });

    return res.json({
      success: true,
      deposit
    });
  } catch (error) {
    console.error('Create deposit error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create deposit' });
  }
};

