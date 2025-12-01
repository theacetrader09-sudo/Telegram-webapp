import { validateInitData } from '../utils/verifyTelegram.js';
import { findOrCreateUser } from '../services/user.service.js';
import { getTempReferral, clearTempReferral } from '../bot/bot.service.js';
import prisma from '../lib/prisma.js';

/**
 * Telegram login endpoint
 * Accepts POST JSON: { initData: "<raw initData string>" }
 * Returns: { success: true, token: "<JWT>", user: {...} }
 */
export const telegramLogin = async (req, res) => {
  try {
    const { initData, referral } = req.body;

    if (!initData || typeof initData !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'initData is required and must be a string'
      });
    }

    // Validate Telegram initData using HMAC verification
    const validationResult = validateInitData(initData);

    if (!validationResult.valid) {
      return res.status(401).json({
        success: false,
        error: validationResult.error || 'Invalid Telegram initData'
      });
    }

    // Extract user data from validated initData
    const { user } = validationResult;
    
    if (!user || !user.id) {
      return res.status(400).json({
        success: false,
        error: 'User data not found in initData'
      });
    }

    // Get referral from Redis if not provided in request
    let referralCode = referral;
    if (!referralCode) {
      const telegramId = user.id.toString();
      const tempReferral = await getTempReferral(telegramId);
      
      if (tempReferral) {
        // Extract user ID from REF_<user_id> format
        if (tempReferral.startsWith('REF_')) {
          const referrerUserId = tempReferral.replace('REF_', '');
          // Get referrer's telegramId from database
          const referrer = await prisma.user.findUnique({
            where: { id: referrerUserId },
            select: { telegramId: true }
          });
          
          if (referrer) {
            referralCode = referrer.telegramId;
            // Clear the temp referral after use
            await clearTempReferral(telegramId);
            console.log(`✅ Applied referral ${referralCode} to user ${telegramId} from Redis`);
          } else {
            console.log(`⚠️ Referrer user ${referrerUserId} not found for referral code ${tempReferral}`);
          }
        } else {
          // If it's already a telegramId, use it directly
          referralCode = tempReferral;
          await clearTempReferral(telegramId);
          console.log(`✅ Applied referral ${referralCode} to user ${telegramId} from Redis`);
        }
      }
    }

    // Find or create user with Prisma (includes referral logic)
    const dbUser = await findOrCreateUser(user, referralCode || null);

    // Ensure wallet exists
    
    let wallet = await prisma.wallet.findUnique({
      where: { userId: dbUser.id }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: dbUser.id }
      });
    }

    // TODO: Generate real JWT token here
    // For MVP, using user ID as token (simple approach)
    // Example: const token = jwt.sign({ userId: dbUser.id, telegramId: dbUser.telegramId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const token = dbUser.id;

    return res.json({
      success: true,
      token,
      user: {
        id: dbUser.id,
        telegramId: dbUser.telegramId,
        username: dbUser.username,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        referredBy: dbUser.referredBy,
        referralChain: dbUser.referralChain
      }
    });
  } catch (error) {
    console.error('Telegram login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during authentication'
    });
  }
};

