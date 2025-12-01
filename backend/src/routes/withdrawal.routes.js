import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getWithdrawals, requestWithdrawal } from '../controllers/withdrawal.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getWithdrawals);
router.post('/', requestWithdrawal);

export default router;

