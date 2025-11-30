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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let processedCount = 0;
  let totalROI = 0;
  let totalReferrals = 0;
  const errors = [];

  try {
    // Build query for active deposits
    const whereClause = {
      status: 'ACTIVE',
      ...(userId && { userId })
    };

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

    // Filter deposits not processed today
    const depositsToProcess = deposits.filter(deposit => {
      if (!deposit.lastROIDate) return true;
      const lastDate = new Date(deposit.lastROIDate);
      lastDate.setHours(0, 0, 0, 0);
      return lastDate.getTime() < today.getTime();
    });

    // Process each deposit
    for (const deposit of depositsToProcess) {
      try {
        const result = await processDepositROI(deposit);
        processedCount++;
        totalROI += result.roiAmount;
        totalReferrals += result.referralAmount;
      } catch (error) {
        console.error(`Error processing deposit ${deposit.id}:`, error);
        errors.push({
          depositId: deposit.id,
          error: error.message
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

    // Create ROI record for user
    await tx.rOIRecord.create({
      data: {
        userId: user.id,
        depositId: deposit.id,
        amount: dailyROI,
        type: 'SELF'
      }
    });

    // Update user wallet balance
    await tx.wallet.update({
      where: { userId: user.id },
      data: {
        balance: {
          increment: dailyROI
        }
      }
    });

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

