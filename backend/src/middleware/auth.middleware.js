import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Authentication middleware
 * Extracts user from JWT token (placeholder) or Telegram initData
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // For now, token is just a placeholder - in production, verify JWT
    // For MVP, we'll extract user from token or use a simple mapping
    // Since we're using placeholder tokens, we'll need to get user from request
    
    // Try to get user from token (if token is user ID)
    // In production, decode JWT and get user ID
    const userId = token; // Placeholder - in production, decode JWT
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true }
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ success: false, error: 'Authentication failed' });
  }
};

