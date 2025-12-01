import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getReferralTree } from '../controllers/referral.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/tree', getReferralTree);

export default router;

