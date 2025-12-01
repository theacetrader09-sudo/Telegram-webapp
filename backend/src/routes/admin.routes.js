import express from 'express';
import { adminAuth } from '../middleware/admin.middleware.js';
import { getJobStatus } from '../jobs/dailyROI.job.js';
import { 
  runROI, 
  sendROI, 
  getROILogsHandler,
  getPendingDeposits,
  approveDeposit,
  rejectDeposit,
  getPendingWithdrawals,
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  completeWithdrawal,
  getAllUsers,
  getUserById,
  resetUserReferral,
  updateUserReferral
} from '../controllers/admin.controller.js';

const router = express.Router();

// All admin routes require authentication
router.use(adminAuth);

// ROI management endpoints
router.get('/cron-status', (req, res) => {
  try {
    const status = getJobStatus();
    res.json({
      success: true,
      ...status,
      nextRunTimeFormatted: status.nextRunTime ? new Date(status.nextRunTime).toISOString() : null,
      lastRunTimeFormatted: status.lastRunTime ? new Date(status.lastRunTime).toISOString() : null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get cron job status',
      message: error.message
    });
  }
});
router.get('/deposits/status', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const statusCounts = await prisma.deposit.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    
    const activeDeposits = await prisma.deposit.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        userId: true,
        amount: true,
        packageId: true,
        lastROIDate: true,
        createdAt: true,
        user: {
          select: {
            telegramId: true,
            username: true
          }
        },
        package: {
          select: {
            name: true,
            dailyROI: true
          }
        }
      }
    });
    
    const approvedDeposits = await prisma.deposit.findMany({
      where: { status: 'APPROVED' },
      select: {
        id: true,
        userId: true,
        amount: true,
        packageId: true,
        createdAt: true,
        user: {
          select: {
            telegramId: true,
            username: true
          }
        }
      }
    });
    
    await prisma.$disconnect();
    
    res.json({
      success: true,
      statusCounts,
      activeDeposits: {
        count: activeDeposits.length,
        deposits: activeDeposits
      },
      approvedDeposits: {
        count: approvedDeposits.length,
        deposits: approvedDeposits,
        message: approvedDeposits.length > 0 ? 'These deposits need to be activated (status = ACTIVE) to earn ROI' : null
      }
    });
  } catch (error) {
    console.error('Error getting deposit status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get deposit status',
      message: error.message
    });
  }
});
router.post('/run-roi', runROI);
router.post('/send-roi', sendROI);
router.get('/roi-logs', getROILogsHandler);

// Deposit management
router.get('/deposits/pending', getPendingDeposits);
router.post('/deposits/:id/approve', approveDeposit);
router.post('/deposits/:id/reject', rejectDeposit);

// Withdrawal management
router.get('/withdrawals/pending', getPendingWithdrawals);
router.get('/withdrawals', getAllWithdrawals);
router.post('/withdrawals/:id/approve', approveWithdrawal);
router.post('/withdrawals/:id/reject', rejectWithdrawal);
router.post('/withdrawals/:id/complete', completeWithdrawal);

// User management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.post('/users/:id/reset-referral', resetUserReferral);
router.post('/users/:id/update-referral', updateUserReferral);

export default router;
