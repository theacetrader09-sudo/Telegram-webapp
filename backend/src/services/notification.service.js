import axios from 'axios';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

/**
 * Send Telegram notification to user
 * @param {string} userId - User ID (Prisma ID)
 * @param {string} message - Message to send
 * @returns {Promise<boolean>} - Success status
 */
export const notifyTelegram = async (userId, message) => {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      console.warn('TELEGRAM_BOT_TOKEN not configured, skipping notification');
      return false;
    }

    // Get user's telegramId from database
    const prisma = (await import('../lib/prisma.js')).default;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { telegramId: true }
    });

    if (!user || !user.telegramId) {
      console.warn(`User ${userId} not found or missing telegramId`);
      return false;
    }

    // Send message via Telegram Bot API
    const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
      chat_id: user.telegramId,
      text: message,
      parse_mode: 'HTML'
    });

    return response.data.ok === true;
  } catch (error) {
    console.error(`Failed to send Telegram notification to ${userId}:`, error.message);
    return false;
  }
};

/**
 * Notify user about ROI credit
 * @param {string} userId - User ID
 * @param {number} amount - ROI amount credited
 * @param {number} balance - New wallet balance
 * @returns {Promise<boolean>} - Success status
 */
export const notifyROICredited = async (userId, amount, balance) => {
  const message = `🎉 Your daily ROI $${amount.toFixed(2)} has been credited!\n\nTotal wallet balance: $${balance.toFixed(2)}`;
  return await notifyTelegram(userId, message);
};

/**
 * Notify user about referral commission
 * @param {string} userId - User ID (referrer)
 * @param {number} amount - Commission amount
 * @param {number} level - Referral level (1-10)
 * @param {number} balance - New wallet balance
 * @returns {Promise<boolean>} - Success status
 */
export const notifyReferralCommission = async (userId, amount, level, balance) => {
  const message = `💰 You earned $${amount.toFixed(2)} from Level ${level} referral commission!\n\nNew balance: $${balance.toFixed(2)}`;
  return await notifyTelegram(userId, message);
};

/**
 * Generic notification sender
 * @param {string} userId - User ID
 * @param {string} type - Notification type
 * @param {Object} data - Notification data
 * @returns {Promise<boolean>} - Success status
 */
export const sendNotification = async (userId, type, data) => {
  let message = '';

  switch (type) {
    case 'ROI_CREDITED':
      message = `🎉 Your daily ROI $${data.amount.toFixed(2)} has been credited!\n\nTotal wallet balance: $${data.balance.toFixed(2)}`;
      break;
    case 'REFERRAL_COMMISSION':
      message = `💰 You earned $${data.amount.toFixed(2)} from Level ${data.level} referral commission!\n\nNew balance: $${data.balance.toFixed(2)}`;
      break;
    case 'WITHDRAWAL_APPROVED':
      message = `✅ Your withdrawal request of $${data.amount.toFixed(2)} has been approved!`;
      break;
    case 'WITHDRAWAL_REJECTED':
      message = `❌ Your withdrawal request of $${data.amount.toFixed(2)} has been rejected.\n\nReason: ${data.reason || 'No reason provided'}`;
      break;
    default:
      message = data.message || 'You have a new notification.';
  }

  return await notifyTelegram(userId, message);
};

