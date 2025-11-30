import crypto from 'crypto';
import { URLSearchParams } from 'url';

/**
 * Validates Telegram Web App initData using HMAC-SHA-256
 * Implements Telegram's validation algorithm:
 * 1. Parse key=value pairs (URLSearchParams style)
 * 2. Compute data_check_string by sorting keys (except 'hash') and join with '\n'
 * 3. Compute secretKey = HMAC-SHA256('WebAppData', botToken)
 * 4. Compute HMAC-SHA256(secretKey, data_check_string) -> hex
 * 5. Compare to provided hash
 * 
 * @param {string} initDataRaw - Raw initData string from Telegram WebApp (e.g. "query_id=...&user=...&auth_date=...&hash=...")
 * @returns {Object} - { valid: boolean, error?: string, user?: Object, authDate?: number }
 */
export const validateInitData = (initDataRaw) => {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      return {
        valid: false,
        error: 'TELEGRAM_BOT_TOKEN not configured'
      };
    }

    if (!initDataRaw || typeof initDataRaw !== 'string') {
      return {
        valid: false,
        error: 'initData must be a non-empty string'
      };
    }

    // Parse initData into key=value pairs
    const params = new URLSearchParams(initDataRaw);
    const hash = params.get('hash');

    if (!hash) {
      return {
        valid: false,
        error: 'hash parameter missing in initData'
      };
    }

    // Remove hash from params for validation
    params.delete('hash');

    // Build data_check_string: sort keys alphabetically (except 'hash'), join with '\n'
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Compute secretKey = HMAC-SHA256('WebAppData', botToken)
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Compute HMAC-SHA256(secretKey, data_check_string) -> hex
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Compare hashes
    if (calculatedHash !== hash) {
      return {
        valid: false,
        error: 'Invalid hash: initData signature verification failed'
      };
    }

    // Check auth_date (should be within last 24 hours)
    const authDate = params.get('auth_date');
    if (authDate) {
      const authTimestamp = parseInt(authDate, 10);
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const timeDiff = currentTimestamp - authTimestamp;

      // Allow 24 hours (86400 seconds)
      if (timeDiff > 86400) {
        return {
          valid: false,
          error: 'initData expired: auth_date is too old'
        };
      }
    }

    // Extract user data if present
    let user = null;
    const userParam = params.get('user');
    if (userParam) {
      try {
        user = JSON.parse(userParam);
      } catch (e) {
        return {
          valid: false,
          error: 'Invalid user data format'
        };
      }
    }

    return {
      valid: true,
      user: user,
      authDate: authDate ? parseInt(authDate, 10) : null
    };
  } catch (error) {
    return {
      valid: false,
      error: `Validation error: ${error.message}`
    };
  }
};

