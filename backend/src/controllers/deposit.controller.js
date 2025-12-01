import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create a deposit request (pending approval)
 */
export const createDepositRequest = async (req, res) => {
  try {
    const { amount, depositAddress, transactionProof } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid amount is required' });
    }

    // Create pending deposit request
    const deposit = await prisma.deposit.create({
      data: {
        userId,
        amount,
        depositAddress: depositAddress || null,
        transactionProof: transactionProof || null,
        status: 'PENDING'
      }
    });

    return res.json({
      success: true,
      deposit,
      message: 'Deposit request submitted. Waiting for admin approval.'
    });
  } catch (error) {
    console.error('Create deposit request error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create deposit request' });
  }
};

/**
 * Create a deposit and activate package (if balance is sufficient)
 */
export const createDeposit = async (req, res) => {
  try {
    const { packageId, amount } = req.body;
    const userId = req.user.id;

    if (!packageId || !amount) {
      return res.status(400).json({ success: false, error: 'Package ID and amount are required' });
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

    // Check if user has sufficient balance
    if (wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance',
        insufficientBalance: true,
        currentBalance: wallet.balance,
        requiredAmount: amount
      });
    }

    // Get package
    const pkg = await prisma.investmentPackage.findUnique({
      where: { id: packageId }
    });

    if (!pkg) {
      return res.status(404).json({ success: false, error: 'Package not found' });
    }

    // Validate amount
    if (amount < pkg.minAmount || amount > pkg.maxAmount) {
      return res.status(400).json({
        success: false,
        error: `Amount must be between $${pkg.minAmount} and $${pkg.maxAmount}`
      });
    }

    // Deduct from wallet and create active deposit
    const result = await prisma.$transaction(async (tx) => {
      // Update wallet balance
      await tx.wallet.update({
        where: { userId },
        data: {
          balance: {
            decrement: amount
          }
        }
      });

      // Create active deposit
      const deposit = await tx.deposit.create({
        data: {
          userId,
          packageId,
          amount,
          status: 'ACTIVE'
        },
        include: {
          package: true
        }
      });

      return deposit;
    });

    return res.json({
      success: true,
      deposit: result,
      message: 'Package activated successfully!'
    });
  } catch (error) {
    console.error('Create deposit error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create deposit' });
  }
};

/**
 * Get user's pending deposit requests
 */
export const getPendingDeposits = async (req, res) => {
  try {
    const userId = req.user.id;

    const deposits = await prisma.deposit.findMany({
      where: {
        userId,
        status: 'PENDING'
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      deposits
    });
  } catch (error) {
    console.error('Get pending deposits error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get pending deposits' });
  }
};

/**
 * Get all user deposits
 */
export const getUserDeposits = async (req, res) => {
  try {
    const userId = req.user.id;

    const deposits = await prisma.deposit.findMany({
      where: { userId },
      include: {
        package: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      deposits
    });
  } catch (error) {
    console.error('Get user deposits error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get deposits' });
  }
};
