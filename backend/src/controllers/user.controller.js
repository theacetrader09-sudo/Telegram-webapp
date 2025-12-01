import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get current user with wallet
 */
export const getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        wallet: true,
        referrer: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            telegramId: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Ensure wallet exists
    if (!user.wallet) {
      const wallet = await prisma.wallet.create({
        data: { userId: user.id }
      });
      user.wallet = wallet;
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        referredBy: user.referredBy,
        referralChain: user.referralChain,
        createdAt: user.createdAt
      },
      wallet: user.wallet
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get user' });
  }
};

/**
 * Get ROI summary for current user
 */
export const getROISummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all ROI records
    const roiRecords = await prisma.rOIRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate totals
    const totalROI = roiRecords
      .filter(r => r.type === 'SELF')
      .reduce((sum, r) => sum + r.amount, 0);

    const totalReferrals = roiRecords
      .filter(r => r.type.startsWith('REFERRAL'))
      .reduce((sum, r) => sum + r.amount, 0);

    // Get deposits
    const deposits = await prisma.deposit.findMany({
      where: { userId, status: 'ACTIVE' },
      include: { package: true }
    });

    const totalDeposits = await prisma.deposit.aggregate({
      where: { userId },
      _sum: { amount: true }
    });

    return res.json({
      success: true,
      totalROI,
      totalReferrals,
      totalDeposits: totalDeposits._sum.amount || 0,
      activeDeposits: deposits.length,
      totalReferralsCount: await prisma.user.count({
        where: { referredBy: req.user.telegramId }
      }),
      roiRecords: roiRecords.slice(0, 50) // Last 50 records
    });
  } catch (error) {
    console.error('Get ROI summary error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get ROI summary' });
  }
};

