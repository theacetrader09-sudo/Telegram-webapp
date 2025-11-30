import { validateInitData } from '../utils/verifyTelegram.js';
import { findOrCreateUser } from '../services/user.service.js';

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

    // Find or create user with Prisma (includes referral logic)
    const dbUser = await findOrCreateUser(user, referral || null);

    // TODO: Generate real JWT token here
    // Example: const token = jwt.sign({ userId: dbUser.id, telegramId: dbUser.telegramId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const token = `jwt_placeholder_${dbUser.id}_${Date.now()}`;

    return res.json({
      success: true,
      token,
      user: {
        id: dbUser.id,
        telegramId: dbUser.telegramId,
        username: dbUser.username,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
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

