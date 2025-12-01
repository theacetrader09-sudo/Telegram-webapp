import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getCurrentUser, getROISummary } from '../controllers/user.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/me', getCurrentUser);
router.get('/roi', getROISummary);

export default router;

