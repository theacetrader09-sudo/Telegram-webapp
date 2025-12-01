import express from 'express';
import { adminAuth } from '../middleware/admin.middleware.js';
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
  getUserById
} from '../controllers/admin.controller.js';

const router = express.Router();

// All admin routes require authentication
router.use(adminAuth);

// ROI management endpoints
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

export default router;
