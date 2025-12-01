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
