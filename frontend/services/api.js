const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Get authorization headers with token if available
 */
const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };

  // Add Authorization header if token exists
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

/**
 * POST request helper
 * @param {string} url - API endpoint (relative to API_BASE_URL)
 * @param {Object} body - Request body
 * @returns {Promise<Object>} - Response data
 */
export const post = async (url, body) => {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Request failed'
      };
    }

    return data;
  } catch (error) {
    console.error('API POST error:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
};

/**
 * GET request helper
 * @param {string} url - API endpoint (relative to API_BASE_URL)
 * @returns {Promise<Object>} - Response data
 */
export const get = async (url) => {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Request failed'
      };
    }

    return data;
  } catch (error) {
    console.error('API GET error:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use post() instead
 */
export const telegramLogin = async (initData) => {
  return post('/auth/telegram-login', { initData });
};

/**
 * Get current user with wallet info
 */
export const getUser = async () => {
  return get('/api/user/me');
};

/**
 * Get all investment packages
 */
export const getPackages = async () => {
  return get('/api/packages');
};

/**
 * Create a deposit request (for crypto deposit)
 * @param {number} amount - Deposit amount
 * @param {string} depositAddress - Transaction hash (optional)
 * @param {string} transactionProof - Proof URL (optional)
 */
export const createDepositRequest = async (amount, depositAddress, transactionProof) => {
  return post('/api/deposit/request', { amount, depositAddress, transactionProof });
};

/**
 * Get pending deposits
 */
export const getPendingDeposits = async () => {
  return get('/api/deposit/pending');
};

/**
 * Get all user deposits
 */
export const getUserDeposits = async () => {
  return get('/api/deposit/user');
};

/**
 * Create a deposit and activate package (uses wallet balance)
 * @param {string} packageId - Package ID
 * @param {number} amount - Deposit amount
 */
export const deposit = async (packageId, amount) => {
  return post('/api/deposit', { packageId, amount });
};

/**
 * Get ROI summary and records
 */
export const getROI = async () => {
  return get('/api/user/roi');
};

/**
 * Get user withdrawals
 */
export const getWithdrawals = async () => {
  return get('/api/withdrawals');
};

/**
 * Request withdrawal
 * @param {number} amount - Withdrawal amount
 */
export const requestWithdrawal = async (amount) => {
  return post('/api/withdraw', { amount });
};

/**
 * Get referral tree (10 levels)
 */
export const getReferralTree = async () => {
  return get('/api/referral/tree');
};

