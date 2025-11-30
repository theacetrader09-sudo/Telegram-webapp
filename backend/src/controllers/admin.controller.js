import { calculateDailyROI } from '../services/roiEngine.service.js';
import { sendROIToUser } from '../services/adminROI.service.js';
import { getROILogs } from '../utils/logger.js';
import { logAdminAction } from '../utils/logger.js';
import prisma from '../lib/prisma.js';

/**
 * Manually trigger ROI calculation
 * POST /admin/run-roi
 */
export const runROI = async (req, res) => {
  try {
    const { userId } = req.body;
    const adminId = req.admin?.id || 'system';

    // Run ROI calculation
    const result = await calculateDailyROI(userId || null);

    // Log admin action
    await logAdminAction({
      adminId,
      action: 'MANUAL_ROI_TRIGGER',
      status: 'SUCCESS',
      details: {
        userId: userId || 'all',
        processed: result.processed,
        totalROI: result.totalROI,
        totalReferrals: result.totalReferrals
      }
    });

    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error in runROI:', error);
    
    await logAdminAction({
      adminId: req.admin?.id || 'system',
      action: 'MANUAL_ROI_TRIGGER',
      status: 'FAILED',
      error: error.message
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to run ROI calculation',
      message: error.message
    });
  }
};

/**
 * Credit individual ROI or referral commission to user
 * POST /admin/send-roi
 */
export const sendROI = async (req, res) => {
  try {
    const { userId, amount, type } = req.body;
    const adminId = req.admin?.id || 'system';

    if (!userId || !amount || !type) {
      return res.status(400).json({
        success: false,
        error: 'userId, amount, and type are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0'
      });
    }

    const validTypes = ['SELF', 'REFERRAL_LEVEL_1', 'REFERRAL_LEVEL_2', 'REFERRAL_LEVEL_3', 
                       'REFERRAL_LEVEL_4', 'REFERRAL_LEVEL_5', 'REFERRAL_LEVEL_6', 
                       'REFERRAL_LEVEL_7', 'REFERRAL_LEVEL_8', 'REFERRAL_LEVEL_9', 'REFERRAL_LEVEL_10'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    const result = await sendROIToUser(userId, amount, type, adminId);

    // Log admin action
    await logAdminAction({
      adminId,
      action: 'SEND_ROI',
      userId,
      status: 'SUCCESS',
      details: {
        amount,
        type,
        newBalance: result.newBalance
      }
    });

    return res.json({
      success: true,
      roiRecord: result.roiRecord,
      newBalance: result.newBalance
    });
  } catch (error) {
    console.error('Error in sendROI:', error);

    await logAdminAction({
      adminId: req.admin?.id || 'system',
      action: 'SEND_ROI',
      userId: req.body?.userId,
      status: 'FAILED',
      error: error.message
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to send ROI',
      message: error.message
    });
  }
};

/**
 * Get ROI calculation logs
 * GET /admin/roi-logs
 */
export const getROILogsHandler = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const result = await getROILogs(limit, offset);

    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error in getROILogsHandler:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get ROI logs',
      message: error.message
    });
  }
};

