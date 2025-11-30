import Redis from 'ioredis';

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redis.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

/**
 * Get temporary referral code for a Telegram user
 * @param {string} telegramId - Telegram user ID
 * @returns {Promise<string|null>} - Referral code or null if not found/expired
 */
export const getTempReferral = async (telegramId) => {
  try {
    const key = `tempReferral:${telegramId}`;
    const referral = await redis.get(key);
    return referral;
  } catch (error) {
    console.error('Error getting temp referral from Redis:', error);
    return null;
  }
};

/**
 * Set temporary referral code for a Telegram user (expires in 24 hours)
 * @param {string} telegramId - Telegram user ID
 * @param {string} referralCode - Referral code to store
 * @returns {Promise<boolean>} - Success status
 */
export const setTempReferral = async (telegramId, referralCode) => {
  try {
    const key = `tempReferral:${telegramId}`;
    // Set with 24 hour expiration (86400 seconds)
    await redis.setex(key, 86400, referralCode);
    return true;
  } catch (error) {
    console.error('Error setting temp referral in Redis:', error);
    return false;
  }
};

/**
 * Clear temporary referral code for a Telegram user
 * @param {string} telegramId - Telegram user ID
 * @returns {Promise<boolean>} - Success status
 */
export const clearTempReferral = async (telegramId) => {
  try {
    const key = `tempReferral:${telegramId}`;
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('Error clearing temp referral from Redis:', error);
    return false;
  }
};

/**
 * Close Redis connection (for graceful shutdown)
 */
export const closeRedis = async () => {
  await redis.quit();
};

export default redis;

