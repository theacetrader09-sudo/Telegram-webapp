import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { validateInitData } from '../verifyTelegram.js';
import crypto from 'crypto';

describe('validateInitData', () => {
  const TEST_BOT_TOKEN = process.env.TEST_TELEGRAM_BOT_TOKEN || '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11';

  beforeAll(() => {
    // Set test bot token
    process.env.TELEGRAM_BOT_TOKEN = TEST_BOT_TOKEN;
  });

  afterAll(() => {
    // Clean up
    delete process.env.TELEGRAM_BOT_TOKEN;
  });

  it('should validate correctly signed initData', () => {
    // Create valid initData
    const user = JSON.stringify({
      id: 123456789,
      first_name: 'John',
      username: 'johndoe'
    });
    const authDate = Math.floor(Date.now() / 1000).toString();
    
    // Build data_check_string
    const params = new URLSearchParams();
    params.set('user', user);
    params.set('auth_date', authDate);
    
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Compute hash
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(TEST_BOT_TOKEN)
      .digest();
    
    const hash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Build initData string
    params.set('hash', hash);
    const initData = params.toString();

    // Test validation
    const result = validateInitData(initData);
    
    expect(result.valid).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user.id).toBe(123456789);
    expect(result.user.first_name).toBe('John');
    expect(result.user.username).toBe('johndoe');
  });

  it('should reject invalid hash', () => {
    const user = JSON.stringify({ id: 123456789, first_name: 'John' });
    const authDate = Math.floor(Date.now() / 1000).toString();
    
    const params = new URLSearchParams();
    params.set('user', user);
    params.set('auth_date', authDate);
    params.set('hash', 'invalid_hash_12345');
    
    const initData = params.toString();
    const result = validateInitData(initData);
    
    expect(result.valid).toBe(false);
    expect(result.error).toContain('signature verification failed');
  });

  it('should reject missing hash', () => {
    const params = new URLSearchParams();
    params.set('user', JSON.stringify({ id: 123456789 }));
    params.set('auth_date', Math.floor(Date.now() / 1000).toString());
    
    const initData = params.toString();
    const result = validateInitData(initData);
    
    expect(result.valid).toBe(false);
    expect(result.error).toContain('hash parameter missing');
  });

  it('should reject expired auth_date', () => {
    const user = JSON.stringify({ id: 123456789 });
    const authDate = (Math.floor(Date.now() / 1000) - 90000).toString(); // 25 hours ago
    
    const params = new URLSearchParams();
    params.set('user', user);
    params.set('auth_date', authDate);
    
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(TEST_BOT_TOKEN)
      .digest();
    
    const hash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    params.set('hash', hash);
    const initData = params.toString();
    
    const result = validateInitData(initData);
    
    expect(result.valid).toBe(false);
    expect(result.error).toContain('expired');
  });

  it('should reject invalid input', () => {
    expect(validateInitData(null).valid).toBe(false);
    expect(validateInitData('').valid).toBe(false);
    expect(validateInitData(123).valid).toBe(false);
  });

  it('should handle missing bot token', () => {
    const originalToken = process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_BOT_TOKEN;
    
    const result = validateInitData('user=test&hash=abc');
    
    expect(result.valid).toBe(false);
    expect(result.error).toContain('TELEGRAM_BOT_TOKEN not configured');
    
    process.env.TELEGRAM_BOT_TOKEN = originalToken;
  });
});

