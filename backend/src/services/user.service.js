import prisma from '../lib/prisma.js';

/**
 * Find or create user with referral chain support
 * @param {Object} tgUserObj - Telegram user object with { id, username, first_name, last_name }
 * @param {string} [referral] - Optional referral telegramId
 * @returns {Promise<Object>} - User object with referral chain
 */
export const findOrCreateUser = async (tgUserObj, referral = null) => {
  const telegramId = tgUserObj.id.toString();
  const username = tgUserObj.username || null;
  const firstName = tgUserObj.first_name || null;
  const lastName = tgUserObj.last_name || null;

  // Try to find existing user
  let user = await prisma.user.findUnique({
    where: { telegramId }
  });

  if (user) {
    // Update existing user info
    const updateData = {
      username: username || user.username,
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName
    };

    // If referral is provided and user doesn't have a referrer, allow re-referral
    if (referral && !user.referredBy) {
      // Find referrer
      const referrer = await prisma.user.findUnique({
        where: { telegramId: referral }
      });

      if (referrer) {
        // Prevent self-referral
        if (referrer.telegramId !== user.telegramId) {
          // Prevent referral loops
          if (!user.referralChain.includes(referrer.telegramId)) {
            updateData.referredBy = referrer.telegramId;
            // Build referral chain: prepend referrer's telegramId to their chain, limit to 10
            updateData.referralChain = [referrer.telegramId, ...referrer.referralChain].slice(0, 10);
            console.log(`✅ Updated referral for existing user ${telegramId} to ${referral}`);
          } else {
            console.log(`⚠️ Referral loop detected for user ${telegramId}, skipping`);
          }
        } else {
          console.log(`⚠️ Self-referral prevented for user ${telegramId}`);
        }
      }
    }

    user = await prisma.user.update({
      where: { telegramId },
      data: updateData
    });
    return user;
  }

  // Build referral chain if referral is provided
  let referralChain = [];
  let referredBy = null;

  if (referral) {
    // Find referrer
    const referrer = await prisma.user.findUnique({
      where: { telegramId: referral }
    });

    if (referrer) {
      referredBy = referrer.telegramId;
      // Build referral chain: prepend referrer's telegramId to their chain, limit to 10
      referralChain = [referrer.telegramId, ...referrer.referralChain].slice(0, 10);
    }
  }

  // Create new user
  user = await prisma.user.create({
    data: {
      telegramId,
      username,
      firstName,
      lastName,
      referredBy,
      referralChain
    }
  });

  return user;
};

export const getUserById = async (telegramId) => {
  return await prisma.user.findUnique({
    where: { telegramId }
  });
};

export const getAllUsers = async () => {
  return await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });
};

