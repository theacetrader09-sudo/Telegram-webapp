/**
 * Admin login endpoint
 * POST /admin/login
 * Body: { email: string, password: string }
 */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Admin credentials (in production, store in database with hashed passwords)
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'forfxai@gmail.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Markus@72';

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Validate credentials
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate admin token (simple approach for MVP)
    // In production, use JWT with proper signing
    const timestamp = Date.now();
    const token = `admin_${timestamp}_${Buffer.from(`${email}:${timestamp}`).toString('base64')}`;

    return res.json({
      success: true,
      token,
      admin: {
        email: ADMIN_EMAIL,
        id: 'admin'
      },
      message: 'Admin login successful'
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
};

/**
 * Verify admin token
 * GET /admin/verify
 */
export const verifyAdmin = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    if (!token.startsWith('admin_')) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    return res.json({
      success: true,
      admin: {
        email: 'forfxai@gmail.com',
        id: 'admin'
      }
    });
  } catch (error) {
    console.error('Verify admin error:', error);
    return res.status(500).json({
      success: false,
      error: 'Verification failed'
    });
  }
};

