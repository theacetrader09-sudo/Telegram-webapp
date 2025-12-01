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
        
        // Get wallet balance before processing
        const walletBefore = await prisma.wallet.findUnique({
          where: { userId: deposit.userId }
        });
        const balanceBefore = walletBefore?.balance || 0;
        
        const result = await processDepositROI(deposit);
        
        // Verify wallet balance was updated
        const walletAfter = await prisma.wallet.findUnique({
          where: { userId: deposit.userId }
        });
        const balanceAfter = walletAfter?.balance || 0;
        const expectedBalance = balanceBefore + result.roiAmount;
        
        if (Math.abs(balanceAfter - expectedBalance) > 0.01) {
          console.error(`⚠️ WALLET UPDATE VERIFICATION FAILED for user ${deposit.userId}: Expected $${expectedBalance.toFixed(2)}, Got $${balanceAfter.toFixed(2)}`);
          // Force update
          await prisma.wallet.update({
            where: { userId: deposit.userId },
            data: { balance: expectedBalance }
          });
          console.log(`✅ Force-updated wallet for user ${deposit.userId} to $${expectedBalance.toFixed(2)}`);
        } else {
          console.log(`✅ Wallet verified for user ${deposit.userId}: $${balanceBefore.toFixed(2)} → $${balanceAfter.toFixed(2)} (+$${result.roiAmount.toFixed(2)})`);
        }
        
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
    // Ensure wallet exists - check first
    let wallet = await tx.wallet.findUnique({
      where: { userId: user.id }
    });

    if (!wallet) {
      console.log(`⚠️ Wallet not found for user ${user.id}, creating new wallet...`);
      wallet = await tx.wallet.create({
        data: {
          userId: user.id,
          balance: 0
        }
      });
      console.log(`✅ Created wallet for user ${user.id} with balance $${wallet.balance.toFixed(2)}`);
    } else {
      console.log(`📊 Current wallet balance for user ${user.id}: $${wallet.balance.toFixed(2)}`);
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

    // Get current wallet balance before update
    const currentBalance = wallet.balance || 0;
    const expectedNewBalance = currentBalance + dailyROI;

    // Update user wallet balance using increment (atomic operation)
    const updatedWallet = await tx.wallet.update({
      where: { userId: user.id },
      data: {
        balance: {
          increment: dailyROI
        }
      }
    });

    console.log(`💰 Wallet updated for user ${user.id}: Old balance = $${currentBalance.toFixed(2)}, Added = $${dailyROI.toFixed(2)}, New balance = $${updatedWallet.balance.toFixed(2)}`);

    // Verify the update worked correctly within transaction
    if (Math.abs(updatedWallet.balance - expectedNewBalance) > 0.01) {
      console.error(`⚠️ WALLET BALANCE MISMATCH in transaction for user ${user.id}: Expected $${expectedNewBalance.toFixed(2)}, Got $${updatedWallet.balance.toFixed(2)}`);
      // Force correct balance within transaction
      const correctedWallet = await tx.wallet.update({
        where: { userId: user.id },
        data: { balance: expectedNewBalance }
      });
      console.log(`✅ Corrected wallet balance in transaction for user ${user.id}: $${correctedWallet.balance.toFixed(2)}`);
      
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
        newBalance: correctedWallet.balance,
        oldBalance: currentBalance
      };
    }

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
      newBalance: updatedWallet.balance,
      oldBalance: currentBalance
    };
  }, {
    timeout: 30000, // 30 second timeout for transaction
    isolationLevel: 'ReadCommitted' // Ensure we read committed data
  });

  // VERIFY wallet was actually updated in database (outside transaction)
  // Wait a bit for transaction to fully commit
  await new Promise(resolve => setTimeout(resolve, 100));
  
  try {
    // Use a fresh query to ensure we get the latest data
    const verifiedWallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        userId: true,
        balance: true,
        updatedAt: true
      }
    });

    if (!verifiedWallet) {
      console.error(`❌ Wallet not found for user ${user.id} after ROI calculation!`);
      // Create wallet if it doesn't exist
      const newWallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: result.newBalance
        }
      });
      console.log(`✅ Created missing wallet for user ${user.id}: $${newWallet.balance.toFixed(2)}`);
      result.newBalance = newWallet.balance;
    } else {
      const balanceDiff = Math.abs(verifiedWallet.balance - result.newBalance);
      if (balanceDiff > 0.01) {
        console.error(`⚠️ POST-TRANSACTION WALLET MISMATCH for user ${user.id}:`);
        console.error(`   Transaction result: $${result.newBalance.toFixed(2)}`);
        console.error(`   Database value: $${verifiedWallet.balance.toFixed(2)}`);
        console.error(`   Difference: $${balanceDiff.toFixed(2)}`);
        console.error(`   Wallet updatedAt: ${verifiedWallet.updatedAt}`);
        
        // Force update to correct value
        const fixedWallet = await prisma.wallet.update({
          where: { userId: user.id },
          data: { balance: result.newBalance }
        });
        console.log(`✅ Force-updated wallet balance in database for user ${user.id}: $${fixedWallet.balance.toFixed(2)}`);
        result.newBalance = fixedWallet.balance;
      } else {
        console.log(`✅ Verified wallet balance for user ${user.id}: $${verifiedWallet.balance.toFixed(2)} (updated at ${verifiedWallet.updatedAt})`);
      }
    }
  } catch (verifyError) {
    console.error(`❌ Error verifying wallet for user ${user.id}:`, verifyError);
    console.error(`   Error stack:`, verifyError.stack);
  }

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

