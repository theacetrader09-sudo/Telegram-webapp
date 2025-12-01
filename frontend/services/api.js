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
 * @param {string} cryptoAddress - User's crypto wallet address
 * @param {string} network - Network (BEP20, ERC20, TRC20)
 */
export const requestWithdrawal = async (amount, cryptoAddress, network = 'BEP20') => {
  return post('/api/withdraw', { amount, cryptoAddress, network });
};

/**
 * Get referral tree (10 levels)
 */
export const getReferralTree = async () => {
  return get('/api/referral/tree');
};

// ==================== ADMIN API FUNCTIONS ====================

/**
 * Get admin headers (separate from user auth)
 */
const getAdminHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (typeof window !== 'undefined') {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }
  }

  return headers;
};

/**
 * Admin login
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 */
export const adminLogin = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Login failed'
      };
    }

    // Store admin token
    if (typeof window !== 'undefined' && data.token) {
      localStorage.setItem('adminToken', data.token);
    }

    return data;
  } catch (error) {
    console.error('Admin login error:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
};

/**
 * Verify admin token
 */
export const verifyAdmin = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/auth/verify`, {
      method: 'GET',
      headers: getAdminHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Verification failed'
      };
    }

    return data;
  } catch (error) {
    console.error('Verify admin error:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
};

/**
 * Get pending deposits (admin)
 */
export const getPendingDepositsAdmin = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/deposits/pending`, {
      method: 'GET',
      headers: getAdminHeaders(),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get pending deposits error:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
};

/**
 * Approve deposit (admin)
 */
export const approveDepositAdmin = async (depositId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/deposits/${depositId}/approve`, {
      method: 'POST',
      headers: getAdminHeaders(),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Approve deposit error:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
};

/**
 * Reject deposit (admin)
 */
export const rejectDepositAdmin = async (depositId, reason) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/deposits/${depositId}/reject`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ reason }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Reject deposit error:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
};

/**
 * Get pending withdrawals (admin)
 */
export const getPendingWithdrawalsAdmin = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/withdrawals/pending`, {
      method: 'GET',
      headers: getAdminHeaders(),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get pending withdrawals error:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
};

/**
 * Get all withdrawals (admin)
 */
export const getAllWithdrawalsAdmin = async (status) => {
  try {
    const url = status 
      ? `${API_BASE_URL}/admin/withdrawals?status=${status}`
      : `${API_BASE_URL}/admin/withdrawals`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAdminHeaders(),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get withdrawals error:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
};

/**
 * Approve withdrawal (admin)
 */
export const approveWithdrawalAdmin = async (withdrawalId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/withdrawals/${withdrawalId}/approve`, {
      method: 'POST',
      headers: getAdminHeaders(),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
};

/**
 * Reject withdrawal (admin)
 */
export const rejectWithdrawalAdmin = async (withdrawalId, reason) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/withdrawals/${withdrawalId}/reject`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ reason }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
};

/**
 * Complete withdrawal (admin) - add transaction hash
 */
export const completeWithdrawalAdmin = async (withdrawalId, transactionHash) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/withdrawals/${withdrawalId}/complete`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify({ transactionHash }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Complete withdrawal error:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
};

/**
 * Run ROI manually (admin)
 */
export const runROIAdmin = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/run-roi`, {
      method: 'POST',
      headers: getAdminHeaders(),
      body: JSON.stringify(userId ? { userId } : {}),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Run ROI error:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
};

/**
 * Get ROI logs (admin)
 */
export const getROILogsAdmin = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/roi-logs`, {
      method: 'GET',
      headers: getAdminHeaders(),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get ROI logs error:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
};

/**
 * Get all users (admin)
 */
export const getAllUsersAdmin = async (page = 1, limit = 50, search = '') => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    });

    const response = await fetch(`${API_BASE_URL}/admin/users?${params}`, {
      method: 'GET',
      headers: getAdminHeaders(),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get users error:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
};

/**
 * Get user by ID (admin)
 */
export const getUserByIdAdmin = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'GET',
      headers: getAdminHeaders(),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get user error:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
};

