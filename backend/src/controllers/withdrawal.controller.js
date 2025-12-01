import prisma from '../lib/prisma.js';

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

    // Calculate total withdrawn (completed and approved)
    const totalWithdrawn = await prisma.withdrawal.aggregate({
      where: { 
        userId,
        status: { in: ['APPROVED', 'COMPLETED'] }
      },
      _sum: { amount: true },
      _count: true
    });

    return res.json({
      success: true,
      withdrawals,
      totalWithdrawn: totalWithdrawn._sum.amount || 0,
      withdrawalCount: totalWithdrawn._count || 0
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
    const { amount, cryptoAddress, network } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid amount is required' });
    }

    if (!cryptoAddress || cryptoAddress.trim() === '') {
      return res.status(400).json({ success: false, error: 'Crypto address is required' });
    }

    // Basic address validation (starts with 0x for Ethereum-style addresses)
    if (cryptoAddress.startsWith('0x') && cryptoAddress.length !== 42) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid crypto address format' 
      });
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
        cryptoAddress: cryptoAddress.trim(),
        network: network || 'BEP20',
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

