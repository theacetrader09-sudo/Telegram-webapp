import { setTempReferral } from './bot.service.js';

/**
 * Telegram webhook handler
 * Accepts POST requests from Telegram with message updates
 * Handles /start command with optional referral code
 */
export const handleWebhook = async (req, res) => {
  try {
    const update = req.body;

    // Telegram sends updates in different formats
    // Check for message update
    if (!update.message || !update.message.text) {
      // Not a text message, acknowledge but don't process
      return res.status(200).json({ ok: true, message: 'Not a text message' });
    }

    const message = update.message;
    const chatId = message.chat?.id;
    const text = message.text?.trim();

    if (!chatId) {
      return res.status(400).json({ ok: false, error: 'Missing chat ID' });
    }

    // Parse /start command with optional referral code
    // Format: /start REF_12345 or /start
    if (text.startsWith('/start')) {
      const parts = text.split(/\s+/);
      const referralCode = parts.length > 1 ? parts[1] : null;

      if (referralCode) {
        // Store referral mapping in Redis
        const telegramId = chatId.toString();
        await setTempReferral(telegramId, referralCode);
        
        console.log(`Stored referral ${referralCode} for Telegram user ${telegramId}`);
        
        return res.status(200).json({
          ok: true,
          message: 'Referral code stored',
          telegramId,
          referralCode
        });
      } else {
        // /start without referral code
        return res.status(200).json({
          ok: true,
          message: 'Start command received (no referral)',
          telegramId: chatId.toString()
        });
      }
    }

    // Other commands or messages - acknowledge but don't process
    return res.status(200).json({
      ok: true,
      message: 'Message received (not processed)'
    });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error processing webhook'
    });
  }
};

