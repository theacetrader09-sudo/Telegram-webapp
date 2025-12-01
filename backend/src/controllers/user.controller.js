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
    let wallet = user.wallet;
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: user.id, balance: 0 }
      });
      console.log(`✅ Created wallet for user ${user.id}`);
    }

    // Re-fetch wallet to ensure we have the latest balance (avoid stale data)
    const freshWallet = await prisma.wallet.findUnique({
      where: { userId: user.id }
    });

    console.log(`📊 Fetching user ${user.id} wallet balance: $${freshWallet?.balance.toFixed(2) || 0}`);

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
      wallet: freshWallet || wallet
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

    console.log(`📊 Fetching ROI summary for user ${userId}: Found ${roiRecords.length} ROI records`);

    // Get deposit and package info for each ROI record
    const roiRecordsWithPackage = await Promise.all(
      roiRecords.map(async (record) => {
        let packageInfo = null;
        if (record.depositId) {
          const deposit = await prisma.deposit.findUnique({
            where: { id: record.depositId },
            include: {
              package: {
                select: {
                  id: true,
                  name: true,
                  dailyROI: true,
                  minAmount: true,
                  maxAmount: true
                }
              }
            }
          });
          if (deposit?.package) {
            packageInfo = {
              name: deposit.package.name,
              dailyROI: deposit.package.dailyROI
            };
          }
        }
        return {
          ...record,
          package: packageInfo
        };
      })
    );

    // Calculate today's date in UTC (start of day) to match ROI calculation timezone
    const today = new Date();
    const todayUTC = new Date(Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate(),
      0, 0, 0, 0
    ));

    // Calculate totals
    const totalROI = roiRecordsWithPackage
      .filter(r => r.type === 'SELF')
      .reduce((sum, r) => sum + r.amount, 0);

    const totalReferrals = roiRecordsWithPackage
      .filter(r => r.type.startsWith('REFERRAL'))
      .reduce((sum, r) => sum + r.amount, 0);

    // Calculate today's ROI (using UTC dates for consistency)
    const todayROI = roiRecordsWithPackage
      .filter(r => {
        if (r.type !== 'SELF') return false;
        const recordDate = new Date(r.createdAt);
        const recordDateUTC = new Date(Date.UTC(
          recordDate.getUTCFullYear(),
          recordDate.getUTCMonth(),
          recordDate.getUTCDate(),
          0, 0, 0, 0
        ));
        return recordDateUTC.getTime() === todayUTC.getTime();
      })
      .reduce((sum, r) => sum + r.amount, 0);

    // Get active deposits with package info
    const activeDeposits = await prisma.deposit.findMany({
      where: { userId, status: 'ACTIVE' },
      include: { 
        package: {
          select: {
            id: true,
            name: true,
            dailyROI: true,
            minAmount: true,
            maxAmount: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get active package (most recent active deposit)
    const activePackage = activeDeposits.length > 0 ? {
      name: activeDeposits[0].package?.name || 'N/A',
      amount: activeDeposits[0].amount,
      dailyROI: activeDeposits[0].package?.dailyROI || 0,
      packageId: activeDeposits[0].packageId
    } : null;

    // Get total approved deposits
    const approvedDeposits = await prisma.deposit.aggregate({
      where: { 
        userId,
        status: { in: ['APPROVED', 'ACTIVE'] }
      },
      _sum: { amount: true },
      _count: true
    });

    const totalReferralsCount = await prisma.user.count({
      where: { referredBy: req.user.telegramId }
    });

    // Debug logging
    const todayRecords = roiRecordsWithPackage.filter(r => {
      if (r.type !== 'SELF') return false;
      const recordDate = new Date(r.createdAt);
      const recordDateUTC = new Date(Date.UTC(
        recordDate.getUTCFullYear(),
        recordDate.getUTCMonth(),
        recordDate.getUTCDate(),
        0, 0, 0, 0
      ));
      return recordDateUTC.getTime() === todayUTC.getTime();
    });
    
    console.log(`📈 ROI Summary for user ${userId}:`, {
      totalROI: totalROI.toFixed(2),
      todayROI: todayROI.toFixed(2),
      todayRecordsCount: todayRecords.length,
      totalReferrals: totalReferrals.toFixed(2),
      totalRecords: roiRecords.length,
      todayUTC: todayUTC.toISOString()
    });

    return res.json({
      success: true,
      totalROI,
      todayROI,
      totalReferrals,
      totalDeposits: approvedDeposits._sum.amount || 0,
      activeDeposits: activeDeposits.length,
      activePackage,
      totalReferralsCount,
      roiRecords: await Promise.all(
        roiRecordsWithPackage.slice(0, 100).map(async (record) => {
          let depositAmount = null;
          if (record.depositId) {
            const deposit = await prisma.deposit.findUnique({
              where: { id: record.depositId },
              select: { amount: true }
            });
            depositAmount = deposit?.amount || null;
          }
          return {
            id: record.id,
            amount: record.amount,
            type: record.type,
            createdAt: record.createdAt,
            package: record.package,
            depositAmount
          };
        })
      )
    });
  } catch (error) {
    console.error('Get ROI summary error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get ROI summary' });
  }
};

