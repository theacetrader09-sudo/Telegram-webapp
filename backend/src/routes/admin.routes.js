import express from 'express';
import { runROI, sendROI, getROILogsHandler } from '../controllers/admin.controller.js';
// import { adminAuth } from '../middleware/adminAuth.middleware.js'; // Uncomment when implemented

const router = express.Router();

// Apply admin auth middleware to all routes
// router.use(adminAuth); // Uncomment when implemented

// ROI management endpoints
router.post('/run-roi', runROI);
router.post('/send-roi', sendROI);
router.get('/roi-logs', getROILogsHandler);

export default router;

