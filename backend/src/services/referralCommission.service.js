import { notifyReferralCommission } from './notification.service.js';

// Referral commission rates for 10 levels
const COMMISSION_RATES = [
  0.10,  // Level 1: 10%
  0.05,  // Level 2: 5%
  0.03,  // Level 3: 3%
  0.02,  // Level 4: 2%
  0.01,  // Level 5: 1%
  0.005, // Level 6: 0.5%
  0.005, // Level 7: 0.5%
  0.003, // Level 8: 0.3%
  0.002, // Level 9: 0.2%
  0.001  // Level 10: 0.1%
];

/**
 * Distribute referral commissions across 10 levels
 * @param {string} userId - User who earned ROI
 * @param {number} roiAmount - ROI amount to distribute commissions from
 * @param {string} depositId - Deposit ID
 * @param {Object} tx - Prisma transaction client
 * @returns {Promise<number>} - Total referral commissions distributed
 */
export const distributeReferralCommissions = async (userId, roiAmount, depositId, tx) => {
  // Get user with referral chain
  const user = await tx.user.findUnique({
    where: { id: userId },
    include: {
      wallet: true
    }
  });

  if (!user || !user.referralChain || user.referralChain.length === 0) {
    return 0;
  }

  let totalDistributed = 0;
  const referralChain = user.referralChain.slice(0, 10); // Max 10 levels

  // Process each level
  for (let level = 0; level < referralChain.length && level < COMMISSION_RATES.length; level++) {
    const referrerTelegramId = referralChain[level];
    const commissionRate = COMMISSION_RATES[level];
    const commissionAmount = roiAmount * commissionRate;

    if (commissionAmount <= 0) continue;

    try {
      // Find referrer by telegramId
      const referrer = await tx.user.findUnique({
        where: { telegramId: referrerTelegramId },
        include: {
          wallet: true
        }
      });

      if (!referrer) {
        console.warn(`Referrer not found: ${referrerTelegramId}`);
        continue;
      }

      // Ensure referrer has wallet
      let referrerWallet = referrer.wallet;
      if (!referrerWallet) {
        referrerWallet = await tx.wallet.create({
          data: {
            userId: referrer.id,
            balance: 0
          }
        });
      }

      // Create ROI record for referrer
      await tx.rOIRecord.create({
        data: {
          userId: referrer.id,
          depositId: depositId,
          amount: commissionAmount,
          type: `REFERRAL_LEVEL_${level + 1}`
        }
      });

      // Update referrer wallet
      await tx.wallet.update({
        where: { userId: referrer.id },
        data: {
          balance: {
            increment: commissionAmount
          }
        }
      });

      totalDistributed += commissionAmount;

      // Send notification (non-blocking)
      notifyReferralCommission(
        referrer.id,
        commissionAmount,
        level + 1,
        referrerWallet.balance + commissionAmount
      ).catch(err => {
        console.error(`Failed to send notification to ${referrer.id}:`, err);
      });
    } catch (error) {
      console.error(`Error distributing commission to level ${level + 1}:`, error);
      // Continue with next level even if one fails
    }
  }

  return totalDistributed;
};

