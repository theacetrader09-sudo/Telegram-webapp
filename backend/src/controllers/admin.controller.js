import { calculateDailyROI } from '../services/roiEngine.service.js';
import { sendROIToUser } from '../services/adminROI.service.js';
import { getROILogs } from '../utils/logger.js';
import { logAdminAction } from '../utils/logger.js';
import prisma from '../lib/prisma.js';

/**
 * Manually trigger ROI calculation
 * POST /admin/run-roi
 */
export const runROI = async (req, res) => {
  try {
    const { userId } = req.body;
    const adminId = req.admin?.id || 'system';

    console.log(`🚀 Admin ${adminId} manually triggering ROI calculation${userId ? ` for user ${userId}` : ' for all users'}`);

    // Run ROI calculation
    const result = await calculateDailyROI(userId || null);

    console.log(`✅ ROI calculation completed:`, {
      processed: result.processed,
      totalROI: result.totalROI,
      totalReferrals: result.totalReferrals,
      errors: result.errors?.length || 0
    });

    // Log admin action
    await logAdminAction({
      adminId,
      action: 'MANUAL_ROI_TRIGGER',
      status: 'SUCCESS',
      details: {
        userId: userId || 'all',
        processed: result.processed,
        totalROI: result.totalROI,
        totalReferrals: result.totalReferrals,
        errors: result.errors?.length || 0,
        message: result.message || 'ROI calculation completed'
      }
    });

    return res.json({
      success: true,
      ...result,
      message: result.message || `Processed ${result.processed} deposits. Total ROI: $${result.totalROI.toFixed(2)}`
    });
  } catch (error) {
    console.error('❌ Error in runROI:', error);
    console.error('Error stack:', error.stack);
    
    await logAdminAction({
      adminId: req.admin?.id || 'system',
      action: 'MANUAL_ROI_TRIGGER',
      status: 'FAILED',
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to run ROI calculation',
      message: error.message
    });
  }
};

/**
 * Credit individual ROI or referral commission to user
 * POST /admin/send-roi
 */
export const sendROI = async (req, res) => {
  try {
    const { userId, amount, type } = req.body;
    const adminId = req.admin?.id || 'system';

    if (!userId || !amount || !type) {
      return res.status(400).json({
        success: false,
        error: 'userId, amount, and type are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0'
      });
    }

    const validTypes = ['SELF', 'REFERRAL_LEVEL_1', 'REFERRAL_LEVEL_2', 'REFERRAL_LEVEL_3', 
                       'REFERRAL_LEVEL_4', 'REFERRAL_LEVEL_5', 'REFERRAL_LEVEL_6', 
                       'REFERRAL_LEVEL_7', 'REFERRAL_LEVEL_8', 'REFERRAL_LEVEL_9', 'REFERRAL_LEVEL_10'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    const result = await sendROIToUser(userId, amount, type, adminId);

    // Log admin action
    await logAdminAction({
      adminId,
      action: 'SEND_ROI',
      userId,
      status: 'SUCCESS',
      details: {
        amount,
        type,
        newBalance: result.newBalance
      }
    });

    return res.json({
      success: true,
      roiRecord: result.roiRecord,
      newBalance: result.newBalance
    });
  } catch (error) {
    console.error('Error in sendROI:', error);

    await logAdminAction({
      adminId: req.admin?.id || 'system',
      action: 'SEND_ROI',
      userId: req.body?.userId,
      status: 'FAILED',
      error: error.message
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to send ROI',
      message: error.message
    });
  }
};

/**
 * Backfill ROI for all active deposits
 * POST /admin/backfill-roi
 */
export const backfillROI = async (req, res) => {
  try {
    const adminId = req.admin?.id || 'system';
    
    console.log(`🔄 Admin ${adminId} triggering ROI backfill...`);

    // Import and run backfill
    const { default: backfillROIFn } = await import('../scripts/backfillROI.js');
    const result = await backfillROIFn();

    await logAdminAction({
      adminId,
      action: 'BACKFILL_ROI',
      status: 'SUCCESS',
      details: {
        processed: result.processed,
        totalROI: result.totalROI,
        errors: result.errors?.length || 0
      }
    });

    return res.json({
      success: true,
      ...result,
      message: result.message || 'ROI backfill completed successfully'
    });
  } catch (error) {
    console.error('Error in backfillROI:', error);
    
    await logAdminAction({
      adminId: req.admin?.id || 'system',
      action: 'BACKFILL_ROI',
      status: 'FAILED',
      error: error.message
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to backfill ROI',
      message: error.message
    });
  }
};

/**
 * Test wallet update directly
 * POST /admin/test-wallet-update
 * Body: { userId: string, amount: number }
 */
export const testWalletUpdate = async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || amount === undefined) {
      return res.status(400).json({
        success: false,
        error: 'userId and amount are required'
      });
    }

    console.log(`🧪 Testing wallet update for user ${userId}: Adding $${amount}`);

    // Get wallet before
    let walletBefore = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!walletBefore) {
      walletBefore = await prisma.wallet.create({
        data: { userId, balance: 0 }
      });
      console.log(`✅ Created wallet for user ${userId}`);
    }

    const balanceBefore = walletBefore.balance || 0;
    console.log(`📊 Before update: $${balanceBefore.toFixed(2)}`);

    // Update wallet using increment
    const walletAfter = await prisma.wallet.update({
      where: { userId },
      data: {
        balance: {
          increment: parseFloat(amount)
        }
      }
    });

    console.log(`💰 After increment update: $${walletAfter.balance.toFixed(2)}`);

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify with fresh query
    const verifiedWallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    const match = Math.abs(walletAfter.balance - verifiedWallet.balance) < 0.01;

    console.log(`🔍 Verification: Update said $${walletAfter.balance.toFixed(2)}, Database has $${verifiedWallet.balance.toFixed(2)}, Match: ${match}`);

    return res.json({
      success: true,
      before: balanceBefore,
      added: parseFloat(amount),
      after: walletAfter.balance,
      verified: verifiedWallet.balance,
      match: match,
      message: match ? 'Wallet update successful' : 'Wallet update mismatch detected'
    });
  } catch (error) {
    console.error('Test wallet update error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to test wallet update',
      message: error.message,
      stack: error.stack
    });
  }
};

/**
 * Get ROI calculation logs
 * GET /admin/roi-logs
 */
export const getROILogsHandler = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const result = await getROILogs(limit, offset);

    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error in getROILogsHandler:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get ROI logs',
      message: error.message
    });
  }
};

/**
 * Get all pending deposits
 * GET /admin/deposits/pending
 */
export const getPendingDeposits = async (req, res) => {
  try {
    const deposits = await prisma.deposit.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            telegramId: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      deposits
    });
  } catch (error) {
    console.error('Error in getPendingDeposits:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get pending deposits'
    });
  }
};

/**
 * Approve a deposit
 * POST /admin/deposits/:id/approve
 */
export const approveDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin?.id || 'system';

    const deposit = await prisma.deposit.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            wallet: true
          }
        }
      }
    });

    if (!deposit) {
      return res.status(404).json({
        success: false,
        error: 'Deposit not found'
      });
    }

    if (deposit.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: `Deposit is already ${deposit.status}`
      });
    }

    // Approve deposit and add to wallet balance
    const result = await prisma.$transaction(async (tx) => {
      // Ensure wallet exists
      let wallet = deposit.user.wallet;
      if (!wallet) {
        wallet = await tx.wallet.create({
          data: { userId: deposit.userId }
        });
      }

      // Update wallet balance
      await tx.wallet.update({
        where: { userId: deposit.userId },
        data: {
          balance: {
            increment: deposit.amount
          }
        }
      });

      // Update deposit status
      const updatedDeposit = await tx.deposit.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: adminId
        },
        include: {
          user: {
            select: {
              id: true,
              telegramId: true,
              username: true
            }
          }
        }
      });

      return { deposit: updatedDeposit, newBalance: wallet.balance + deposit.amount };
    });

    // Log admin action
    await logAdminAction({
      adminId,
      action: 'APPROVE_DEPOSIT',
      userId: deposit.userId,
      depositId: id,
      amount: deposit.amount,
      status: 'SUCCESS',
      details: {
        newBalance: result.newBalance
      }
    });

    return res.json({
      success: true,
      deposit: result.deposit,
      newBalance: result.newBalance,
      message: 'Deposit approved successfully'
    });
  } catch (error) {
    console.error('Error in approveDeposit:', error);
    
    await logAdminAction({
      adminId: req.admin?.id || 'system',
      action: 'APPROVE_DEPOSIT',
      depositId: req.params?.id,
      status: 'FAILED',
      error: error.message
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to approve deposit'
    });
  }
};

/**
 * Reject a deposit
 * POST /admin/deposits/:id/reject
 */
export const rejectDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.admin?.id || 'system';

    const deposit = await prisma.deposit.findUnique({
      where: { id }
    });

    if (!deposit) {
      return res.status(404).json({
        success: false,
        error: 'Deposit not found'
      });
    }

    if (deposit.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: `Deposit is already ${deposit.status}`
      });
    }

    // Update deposit status
    const updatedDeposit = await prisma.deposit.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedAt: new Date(),
        approvedBy: adminId
      }
    });

    // Log admin action
    await logAdminAction({
      adminId,
      action: 'REJECT_DEPOSIT',
      userId: deposit.userId,
      depositId: id,
      amount: deposit.amount,
      status: 'SUCCESS',
      details: {
        reason: reason || 'No reason provided'
      }
    });

    return res.json({
      success: true,
      deposit: updatedDeposit,
      message: 'Deposit rejected'
    });
  } catch (error) {
    console.error('Error in rejectDeposit:', error);
    
    await logAdminAction({
      adminId: req.admin?.id || 'system',
      action: 'REJECT_DEPOSIT',
      depositId: req.params?.id,
      status: 'FAILED',
      error: error.message
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to reject deposit'
    });
  }
};

/**
 * Get all pending withdrawals
 * GET /admin/withdrawals/pending
 */
export const getPendingWithdrawals = async (req, res) => {
  try {
    const withdrawals = await prisma.withdrawal.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            telegramId: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      withdrawals
    });
  } catch (error) {
    console.error('Error in getPendingWithdrawals:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get pending withdrawals'
    });
  }
};

/**
 * Get all withdrawals
 * GET /admin/withdrawals
 */
export const getAllWithdrawals = async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};

    const withdrawals = await prisma.withdrawal.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            telegramId: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      withdrawals
    });
  } catch (error) {
    console.error('Error in getAllWithdrawals:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get withdrawals'
    });
  }
};

/**
 * Approve a withdrawal
 * POST /admin/withdrawals/:id/approve
 */
export const approveWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin?.id || 'system';

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            wallet: true
          }
        }
      }
    });

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        error: 'Withdrawal not found'
      });
    }

    if (withdrawal.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: `Withdrawal is already ${withdrawal.status}`
      });
    }

    // Ensure wallet exists
    let wallet = withdrawal.user.wallet;
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: withdrawal.userId }
      });
    }

    // Check balance
    if (wallet.balance < withdrawal.amount) {
      return res.status(400).json({
        success: false,
        error: 'User has insufficient balance'
      });
    }

    // Approve withdrawal and deduct from wallet
    const result = await prisma.$transaction(async (tx) => {
      // Update wallet balance
      await tx.wallet.update({
        where: { userId: withdrawal.userId },
        data: {
          balance: {
            decrement: withdrawal.amount
          }
        }
      });

      // Update withdrawal status
      const updatedWithdrawal = await tx.withdrawal.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: adminId
        },
        include: {
          user: {
            select: {
              id: true,
              telegramId: true,
              username: true
            }
          }
        }
      });

      return { withdrawal: updatedWithdrawal, newBalance: wallet.balance - withdrawal.amount };
    });

    // Log admin action
    await logAdminAction({
      adminId,
      action: 'APPROVE_WITHDRAWAL',
      userId: withdrawal.userId,
      amount: withdrawal.amount,
      status: 'SUCCESS',
      details: {
        withdrawalId: id,
        cryptoAddress: withdrawal.cryptoAddress,
        network: withdrawal.network,
        newBalance: result.newBalance
      }
    });

    return res.json({
      success: true,
      withdrawal: result.withdrawal,
      newBalance: result.newBalance,
      message: 'Withdrawal approved successfully'
    });
  } catch (error) {
    console.error('Error in approveWithdrawal:', error);
    
    await logAdminAction({
      adminId: req.admin?.id || 'system',
      action: 'APPROVE_WITHDRAWAL',
      withdrawalId: req.params?.id,
      status: 'FAILED',
      error: error.message
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to approve withdrawal'
    });
  }
};

/**
 * Reject a withdrawal
 * POST /admin/withdrawals/:id/reject
 */
export const rejectWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.admin?.id || 'system';

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id }
    });

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        error: 'Withdrawal not found'
      });
    }

    if (withdrawal.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: `Withdrawal is already ${withdrawal.status}`
      });
    }

    // Update withdrawal status
    const updatedWithdrawal = await prisma.withdrawal.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        approvedBy: adminId,
        rejectionReason: reason || null
      }
    });

    // Log admin action
    await logAdminAction({
      adminId,
      action: 'REJECT_WITHDRAWAL',
      userId: withdrawal.userId,
      withdrawalId: id,
      amount: withdrawal.amount,
      status: 'SUCCESS',
      details: {
        reason: reason || 'No reason provided'
      }
    });

    return res.json({
      success: true,
      withdrawal: updatedWithdrawal,
      message: 'Withdrawal rejected'
    });
  } catch (error) {
    console.error('Error in rejectWithdrawal:', error);
    
    await logAdminAction({
      adminId: req.admin?.id || 'system',
      action: 'REJECT_WITHDRAWAL',
      withdrawalId: req.params?.id,
      status: 'FAILED',
      error: error.message
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to reject withdrawal'
    });
  }
};

/**
 * Complete a withdrawal (add transaction hash)
 * POST /admin/withdrawals/:id/complete
 */
export const completeWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionHash } = req.body;
    const adminId = req.admin?.id || 'system';

    if (!transactionHash) {
      return res.status(400).json({
        success: false,
        error: 'Transaction hash is required'
      });
    }

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id }
    });

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        error: 'Withdrawal not found'
      });
    }

    if (withdrawal.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        error: `Withdrawal must be APPROVED before completion. Current status: ${withdrawal.status}`
      });
    }

    // Update withdrawal status
    const updatedWithdrawal = await prisma.withdrawal.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        transactionHash: transactionHash.trim(),
        completedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            telegramId: true,
            username: true
          }
        }
      }
    });

    // Log admin action
    await logAdminAction({
      adminId,
      action: 'COMPLETE_WITHDRAWAL',
      userId: withdrawal.userId,
      withdrawalId: id,
      amount: withdrawal.amount,
      status: 'SUCCESS',
      details: {
        transactionHash,
        cryptoAddress: withdrawal.cryptoAddress
      }
    });

    return res.json({
      success: true,
      withdrawal: updatedWithdrawal,
      message: 'Withdrawal marked as completed'
    });
  } catch (error) {
    console.error('Error in completeWithdrawal:', error);
    
    await logAdminAction({
      adminId: req.admin?.id || 'system',
      action: 'COMPLETE_WITHDRAWAL',
      withdrawalId: req.params?.id,
      status: 'FAILED',
      error: error.message
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to complete withdrawal'
    });
  }
};

/**
 * Get all users with their details
 * GET /admin/users
 */
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause for search
    const where = search ? {
      OR: [
        { telegramId: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    // Get users with wallet and deposit info
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          wallet: true,
          referrer: {
            select: {
              telegramId: true,
              username: true,
              firstName: true,
              lastName: true
            }
          },
          _count: {
            select: {
              referrals: true,
              deposits: true,
              withdrawals: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.user.count({ where })
    ]);

    // Calculate additional stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        // Get total deposits amount
        const deposits = await prisma.deposit.aggregate({
          where: { userId: user.id },
          _sum: { amount: true },
          _count: true
        });

        // Get total withdrawals amount
        const withdrawals = await prisma.withdrawal.aggregate({
          where: { userId: user.id },
          _sum: { amount: true },
          _count: true
        });

        // Get active deposits count
        const activeDeposits = await prisma.deposit.count({
          where: {
            userId: user.id,
            status: 'ACTIVE'
          }
        });

        return {
          id: user.id,
          telegramId: user.telegramId,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          referredBy: user.referredBy,
          referrer: user.referrer,
          referralChain: user.referralChain,
          referralCount: user._count.referrals,
          walletBalance: user.wallet?.balance || 0,
          totalDeposits: deposits._sum.amount || 0,
          depositCount: deposits._count || 0,
          activeDeposits,
          totalWithdrawals: withdrawals._sum.amount || 0,
          withdrawalCount: withdrawals._count || 0,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        };
      })
    );

    return res.json({
      success: true,
      users: usersWithStats,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get users',
      message: error.message
    });
  }
};

/**
 * Get single user details
 * GET /admin/users/:id
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        wallet: true,
        referrer: {
          select: {
            telegramId: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        referrals: {
          select: {
            id: true,
            telegramId: true,
            username: true,
            firstName: true,
            lastName: true,
            createdAt: true
          },
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        deposits: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            package: {
              select: {
                name: true,
                dailyROI: true
              }
            }
          }
        },
        withdrawals: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get additional stats
    const [totalDeposits, totalWithdrawals, activeDeposits] = await Promise.all([
      prisma.deposit.aggregate({
        where: { userId: user.id },
        _sum: { amount: true },
        _count: true
      }),
      prisma.withdrawal.aggregate({
        where: { userId: user.id },
        _sum: { amount: true },
        _count: true
      }),
      prisma.deposit.count({
        where: {
          userId: user.id,
          status: 'ACTIVE'
        }
      })
    ]);

    return res.json({
      success: true,
      user: {
        ...user,
        stats: {
          totalDeposits: totalDeposits._sum.amount || 0,
          depositCount: totalDeposits._count || 0,
          activeDeposits,
          totalWithdrawals: totalWithdrawals._sum.amount || 0,
          withdrawalCount: totalWithdrawals._count || 0,
          referralCount: user.referrals.length
        }
      }
    });
  } catch (error) {
    console.error('Error in getUserById:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get user',
      message: error.message
    });
  }
};

/**
 * Reset user referral (allow re-referral)
 * POST /admin/users/:id/reset-referral
 */
export const resetUserReferral = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Store previous referrer for logging
    const previousReferrer = user.referredBy;

    // Clear referral data
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        referredBy: null,
        referralChain: []
      },
      include: {
        referrer: {
          select: {
            telegramId: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Log admin action
    await prisma.systemLog.create({
      data: {
        action: 'ADMIN_ACTION',
        userId: id,
        status: 'SUCCESS',
        details: {
          action: 'RESET_USER_REFERRAL',
          adminId: req.admin?.id || 'admin',
          previousReferrer: previousReferrer,
          userTelegramId: user.telegramId
        }
      }
    });

    console.log(`✅ Admin reset referral for user ${user.telegramId} (ID: ${id})`);

    return res.json({
      success: true,
      message: 'User referral reset successfully. User can now be referred again.',
      user: {
        id: updatedUser.id,
        telegramId: updatedUser.telegramId,
        username: updatedUser.username,
        referredBy: updatedUser.referredBy,
        referralChain: updatedUser.referralChain
      }
    });
  } catch (error) {
    console.error('Error resetting user referral:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reset user referral',
      message: error.message
    });
  }
};

/**
 * Update user referral (assign new referrer)
 * POST /admin/users/:id/update-referral
 * Body: { referrerId: string } - Referrer's user ID (not telegramId)
 */
export const updateUserReferral = async (req, res) => {
  try {
    const { id } = req.params;
    const { referrerId } = req.body;

    if (!referrerId) {
      return res.status(400).json({
        success: false,
        error: 'Referrer ID is required'
      });
    }

    // Get the user to update
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get the referrer user
    const referrer = await prisma.user.findUnique({
      where: { id: referrerId }
    });

    if (!referrer) {
      return res.status(404).json({
        success: false,
        error: 'Referrer user not found'
      });
    }

    // Prevent self-referral
    if (referrer.id === user.id) {
      return res.status(400).json({
        success: false,
        error: 'User cannot refer themselves'
      });
    }

    // Check for referral loops (prevent circular references)
    if (user.referralChain.includes(referrer.telegramId)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot create referral loop: This user is already in the referrer\'s downline'
      });
    }

    // Build new referral chain
    const newReferralChain = [referrer.telegramId, ...referrer.referralChain].slice(0, 10);

    // Store previous referrer for logging
    const previousReferrer = user.referredBy;

    // Update user referral
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        referredBy: referrer.telegramId,
        referralChain: newReferralChain
      },
      include: {
        referrer: {
          select: {
            id: true,
            telegramId: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Log admin action
    await prisma.systemLog.create({
      data: {
        action: 'ADMIN_ACTION',
        userId: id,
        status: 'SUCCESS',
        details: {
          action: 'UPDATE_USER_REFERRAL',
          adminId: req.admin?.id || 'admin',
          previousReferrer: previousReferrer,
          newReferrer: referrer.telegramId,
          newReferrerId: referrer.id,
          userTelegramId: user.telegramId
        }
      }
    });

    console.log(`✅ Admin updated referral for user ${user.telegramId} (ID: ${id}) to ${referrer.telegramId} (ID: ${referrerId})`);

    return res.json({
      success: true,
      message: 'User referral updated successfully',
      user: {
        id: updatedUser.id,
        telegramId: updatedUser.telegramId,
        username: updatedUser.username,
        referredBy: updatedUser.referredBy,
        referralChain: updatedUser.referralChain,
        referrer: updatedUser.referrer
      }
    });
  } catch (error) {
    console.error('Error updating user referral:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update user referral',
      message: error.message
    });
  }
};

