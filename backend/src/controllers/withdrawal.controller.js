import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get user withdrawals
 */
export const getWithdrawals = async (req, res) => {
  try {
    const userId = req.user.id;

    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      withdrawals
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get withdrawals' });
  }
};

/**
 * Request a withdrawal
 */
export const requestWithdrawal = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid amount is required' });
    }

    // Get user wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId }
      });
    }

    // Check balance
    if (wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance'
      });
    }

    // Create withdrawal request
    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId,
        amount,
        status: 'PENDING'
      }
    });

    return res.json({
      success: true,
      withdrawal,
      message: 'Withdrawal request created successfully'
    });
  } catch (error) {
    console.error('Request withdrawal error:', error);
    return res.status(500).json({ success: false, error: 'Failed to request withdrawal' });
  }
};

