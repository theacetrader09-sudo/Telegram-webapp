import { PrismaClient } from '@prisma/client';
import { COMMISSION_RATES } from '../services/referralCommission.service.js';

const prisma = new PrismaClient();

/**
 * Get referral tree (10 levels)
 */
export const getReferralTree = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get all referrals recursively
    const levels = [];
    let currentLevelUsers = [user];

    for (let level = 0; level < 10; level++) {
      if (currentLevelUsers.length === 0) break;

      const levelUserIds = currentLevelUsers.map(u => u.telegramId);
      
      // Get all users referred by current level
      const nextLevelUsers = await prisma.user.findMany({
        where: {
          referredBy: { in: levelUserIds }
        },
        select: {
          id: true,
          telegramId: true,
          username: true,
          firstName: true,
          lastName: true,
          createdAt: true
        }
      });

      // Calculate earnings for this level
      const levelEarnings = await prisma.rOIRecord.aggregate({
        where: {
          userId: { in: nextLevelUsers.map(u => u.id) },
          type: `REFERRAL_LEVEL_${level + 1}`
        },
        _sum: { amount: true }
      });

      levels.push({
        level: level + 1,
        count: nextLevelUsers.length,
        users: nextLevelUsers,
        earnings: levelEarnings._sum.amount || 0,
        commissionRate: (COMMISSION_RATES[level] || 0) * 100 // Convert to percentage
      });

      currentLevelUsers = nextLevelUsers;
    }

    // Calculate totals
    const totalReferrals = levels.reduce((sum, l) => sum + l.count, 0);
    const totalEarnings = levels.reduce((sum, l) => sum + l.earnings, 0);

    return res.json({
      success: true,
      levels,
      totalReferrals,
      totalEarnings
    });
  } catch (error) {
    console.error('Get referral tree error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get referral tree' });
  }
};

