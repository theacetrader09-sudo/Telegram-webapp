import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { createDeposit } from '../controllers/deposit.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/', createDeposit);

export default router;

