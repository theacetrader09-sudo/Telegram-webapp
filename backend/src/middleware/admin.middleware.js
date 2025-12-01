/**
 * Admin authentication middleware
 * Checks for admin token in Authorization header
 */
export const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No admin token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Simple token check - in production, use JWT
    // For now, check if token matches admin token format
    // Admin token format: "admin_<timestamp>_<hash>"
    if (!token.startsWith('admin_')) {
      return res.status(401).json({ success: false, error: 'Invalid admin token' });
    }

    // Store admin info in request
    req.admin = {
      id: 'admin',
      email: 'forfxai@gmail.com'
    };

    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return res.status(401).json({ success: false, error: 'Admin authentication failed' });
  }
};

