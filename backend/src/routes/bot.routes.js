import express from 'express';
import { handleWebhook } from '../bot/webhook.controller.js';

const router = express.Router();

// Telegram webhook endpoint
router.post('/webhook', handleWebhook);

export default router;

