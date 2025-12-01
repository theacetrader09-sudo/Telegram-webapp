import express from 'express';
import { getPackages } from '../controllers/package.controller.js';

const router = express.Router();

// Public route - no auth required
router.get('/', getPackages);

export default router;

