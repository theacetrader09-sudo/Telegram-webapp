import express from 'express';
import { adminLogin, verifyAdmin } from '../controllers/adminAuth.controller.js';
import { adminAuth } from '../middleware/admin.middleware.js';

const router = express.Router();

// Public routes
router.post('/login', adminLogin);
router.get('/verify', adminAuth, verifyAdmin);

export default router;

