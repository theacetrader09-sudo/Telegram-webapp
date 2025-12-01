import { calculateDailyROI } from '../services/roiEngine.service.js';
import { sendROIToUser } from '../services/adminROI.service.js';
import { getROILogs } from '../utils/logger.js';
import { logAdminAction } from '../utils/logger.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Manually trigger ROI calculation
 * POST /admin/run-roi
 */
export const runROI = async (req, res) => {
  try {
    const { userId } = req.body;
    const adminId = req.admin?.id || 'system';

    // Run ROI calculation
    const result = await calculateDailyROI(userId || null);

    // Log admin action
    await logAdminAction({
      adminId,
      action: 'MANUAL_ROI_TRIGGER',
      status: 'SUCCESS',
      details: {
        userId: userId || 'all',
        processed: result.processed,
        totalROI: result.totalROI,
        totalReferrals: result.totalReferrals
      }
    });

    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error in runROI:', error);
    
    await logAdminAction({
      adminId: req.admin?.id || 'system',
      action: 'MANUAL_ROI_TRIGGER',
      status: 'FAILED',
      error: error.message
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

