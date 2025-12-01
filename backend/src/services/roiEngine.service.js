import prisma from '../lib/prisma.js';
import { distributeReferralCommissions } from './referralCommission.service.js';
import { logROICalculation, logError } from '../utils/logger.js';
import { notifyROICredited } from './notification.service.js';

/**
 * Calculate daily ROI for all active deposits or specific user
 * @param {string|null} userId - Optional: calculate for specific user only
 * @returns {Promise<Object>} - Summary of processed deposits
 */
export const calculateDailyROI = async (userId = null) => {
  const startTime = Date.now();
  // Use UTC date for consistency (ROI runs at 00:00 UTC)
  const today = new Date();
  const todayUTC = new Date(Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
    0, 0, 0, 0
  ));

  let processedCount = 0;
  let totalROI = 0;
  let totalReferrals = 0;
  const errors = [];

  try {
    // Build query for active deposits (ACTIVE status only)
    const whereClause = {
      status: 'ACTIVE',
      ...(userId && { userId })
    };

    console.log(`🔍 Looking for deposits with status ACTIVE${userId ? ` for user ${userId}` : ' (all users)'}`);

    // Check if deposit was already processed today
    const deposits = await prisma.deposit.findMany({
      where: whereClause,
      include: {
        package: true,
        user: {
          include: {
            wallet: true
          }
        }
      }
    });

    console.log(`📦 Found ${deposits.length} ACTIVE deposits${userId ? ` for user ${userId}` : ''}`);

    if (deposits.length === 0) {
      console.log(`⚠️ No ACTIVE deposits found. Make sure deposits have been activated (status = ACTIVE) and have a package assigned.`);
      return {
        success: true,
        processed: 0,
        totalROI: 0,
        totalReferrals: 0,
        errors: [],
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        message: 'No ACTIVE deposits found to process'
      };
    }

    // Filter deposits not processed today (using UTC for consistency)
    const depositsToProcess = deposits.filter(deposit => {
      if (!deposit.package) {
        console.warn(`⚠️ Deposit ${deposit.id} has no package assigned - skipping`);
        return false;
      }
      if (!deposit.lastROIDate) return true;
      const lastDate = new Date(deposit.lastROIDate);
      const lastDateUTC = new Date(Date.UTC(
        lastDate.getUTCFullYear(),
        lastDate.getUTCMonth(),
        lastDate.getUTCDate(),
        0, 0, 0, 0
      ));
      const shouldProcess = lastDateUTC.getTime() < todayUTC.getTime();
      if (!shouldProcess) {
        console.log(`⏭️ Deposit ${deposit.id} already processed today (lastROIDate: ${deposit.lastROIDate})`);
      }
      return shouldProcess;
    });

    console.log(`✅ ${depositsToProcess.length} deposits ready to process (out of ${deposits.length} total)`);

    // Process each deposit
    for (const deposit of depositsToProcess) {
      try {
        console.log(`💰 Processing deposit ${deposit.id} for user ${deposit.userId}: $${deposit.amount} (Package: ${deposit.package?.name || 'N/A'})`);
        const result = await processDepositROI(deposit);
        processedCount++;
        totalROI += result.roiAmount;
        totalReferrals += result.referralAmount;
        console.log(`✅ Processed deposit ${deposit.id}: ROI $${result.roiAmount.toFixed(2)}, Referrals $${result.referralAmount.toFixed(2)}`);
      } catch (error) {
        console.error(`❌ Error processing deposit ${deposit.id}:`, error);
        errors.push({
          depositId: deposit.id,
          userId: deposit.userId,
          error: error.message,
          stack: error.stack
        });
      }
    }

    const duration = Date.now() - startTime;

    // Log summary
    await logROICalculation({
      processed: processedCount,
      totalROI,
      totalReferrals,
      errors: errors.length > 0 ? errors : undefined,
      duration,
      userId
    });

    return {
      success: true,
      processed: processedCount,
      totalROI,
      totalReferrals,
      errors: errors.length > 0 ? errors : undefined,
      duration,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in calculateDailyROI:', error);
    await logError('ROI_CALCULATION', error, { userId });
    throw error;
  }
};

/**
 * Process ROI for a single deposit
 * @param {Object} deposit - Deposit with package and user relations
 * @returns {Promise<Object>} - ROI and referral amounts
 */
export const processDepositROI = async (deposit) => {
  const { package: pkg, user, amount } = deposit;

  if (!pkg || !user) {
    throw new Error('Deposit missing package or user data');
  }

  // Calculate daily ROI
  const dailyROI = amount * (pkg.dailyROI / 100);

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Ensure wallet exists
    let wallet = await tx.wallet.findUnique({
      where: { userId: user.id }
    });

    if (!wallet) {
      wallet = await tx.wallet.create({
        data: {
          userId: user.id,
          balance: 0
        }
      });
    }

    // Create ROI record for user (createdAt will be in UTC automatically)
    const roiRecord = await tx.rOIRecord.create({
      data: {
        userId: user.id,
        depositId: deposit.id,
        amount: dailyROI,
        type: 'SELF'
      }
    });
    
    console.log(`✅ Created ROI record for user ${user.id}: $${dailyROI.toFixed(2)} at ${roiRecord.createdAt.toISOString()}`);

    // Update user wallet balance
    const updatedWallet = await tx.wallet.update({
      where: { userId: user.id },
      data: {
        balance: {
          increment: dailyROI
        }
      }
    });

    console.log(`💰 Wallet updated for user ${user.id}: New balance = $${updatedWallet.balance.toFixed(2)} (added $${dailyROI.toFixed(2)})`);

    // Update deposit lastROIDate
    await tx.deposit.update({
      where: { id: deposit.id },
      data: {
        lastROIDate: new Date()
      }
    });

    // Distribute referral commissions
    const referralAmount = await distributeReferralCommissions(
      user.id,
      dailyROI,
      deposit.id,
      tx
    );

    return {
      roiAmount: dailyROI,
      referralAmount,
      newBalance: wallet.balance + dailyROI
    };
  });

  // Send notification (non-blocking)
  notifyROICredited(user.id, result.roiAmount, result.newBalance).catch(err => {
    console.error(`Failed to send ROI notification:`, err);
  });

  return result;
};

/**
 * Check if deposit was already processed today
 * @param {string} depositId - Deposit ID
 * @param {Date} date - Date to check
 * @returns {Promise<boolean>} - True if already processed
 */
export const checkAlreadyProcessed = async (depositId, date) => {
  const deposit = await prisma.deposit.findUnique({
    where: { id: depositId },
    select: { lastROIDate: true }
  });

  if (!deposit || !deposit.lastROIDate) {
    return false;
  }

  const lastDate = new Date(deposit.lastROIDate);
  lastDate.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  return lastDate.getTime() === checkDate.getTime();
};

