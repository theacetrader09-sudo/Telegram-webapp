import prisma from '../lib/prisma.js';
import { notifyROICredited, notifyReferralCommission } from './notification.service.js';

/**
 * Send ROI or referral commission to a specific user
 * @param {string} userId - User ID
 * @param {number} amount - Amount to credit
 * @param {string} type - Type: SELF or REFERRAL_LEVEL_1 through REFERRAL_LEVEL_10
 * @param {string} adminId - Admin ID who triggered this
 * @returns {Promise<Object>} - ROI record and new balance
 */
export const sendROIToUser = async (userId, amount, type, adminId) => {
  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      wallet: true
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Use transaction for atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Ensure wallet exists
    let wallet = user.wallet;
    if (!wallet) {
      wallet = await tx.wallet.create({
        data: {
          userId: user.id,
          balance: 0
        }
      });
    }

    // Create ROI record
    const roiRecord = await tx.rOIRecord.create({
      data: {
        userId: user.id,
        amount: amount,
        type: type
      }
    });

    // Update wallet balance
    const updatedWallet = await tx.wallet.update({
      where: { userId: user.id },
      data: {
        balance: {
          increment: amount
        }
      }
    });

    return {
      roiRecord,
      newBalance: updatedWallet.balance
    };
  });

  // Send notification (non-blocking)
  if (type === 'SELF') {
    notifyROICredited(userId, amount, result.newBalance).catch(err => {
      console.error(`Failed to send ROI notification:`, err);
    });
  } else {
    const level = parseInt(type.replace('REFERRAL_LEVEL_', ''));
    notifyReferralCommission(userId, amount, level, result.newBalance).catch(err => {
      console.error(`Failed to send referral notification:`, err);
    });
  }

  return result;
};

