import express from 'express';
import { 
  runROI, 
  sendROI, 
  getROILogsHandler,
  getPendingDeposits,
  approveDeposit,
  rejectDeposit
} from '../controllers/admin.controller.js';

const router = express.Router();

// ROI management endpoints
router.post('/run-roi', runROI);
router.post('/send-roi', sendROI);
router.get('/roi-logs', getROILogsHandler);

// Deposit management
router.get('/deposits/pending', getPendingDeposits);
router.post('/deposits/:id/approve', approveDeposit);
router.post('/deposits/:id/reject', rejectDeposit);

export default router;
