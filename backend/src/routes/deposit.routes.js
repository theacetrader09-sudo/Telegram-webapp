import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { 
  createDeposit, 
  createDepositRequest, 
  getPendingDeposits,
  getUserDeposits 
} from '../controllers/deposit.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create deposit request (for crypto deposit)
router.post('/request', createDepositRequest);

// Get user's pending deposits
router.get('/pending', getPendingDeposits);

// Get all user deposits
router.get('/user', getUserDeposits);

// Create deposit and activate package (uses wallet balance)
router.post('/', createDeposit);

export default router;

