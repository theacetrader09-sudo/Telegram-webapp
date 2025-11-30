import prisma from '../lib/prisma.js';

/**
 * Log ROI calculation run
 * @param {Object} data - Log data
 * @returns {Promise<void>}
 */
export const logROICalculation = async (data) => {
  try {
    await prisma.systemLog.create({
      data: {
        action: 'ROI_CALCULATION',
        status: data.errors && data.errors.length > 0 ? 'PARTIAL' : 'SUCCESS',
        details: {
          processed: data.processed || 0,
          totalROI: data.totalROI || 0,
          totalReferrals: data.totalReferrals || 0,
          duration: data.duration || 0,
          userId: data.userId || null,
          errors: data.errors || []
        },
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to log ROI calculation:', error);
  }
};

/**
 * Log referral distribution
 * @param {Object} data - Log data
 * @returns {Promise<void>}
 */
export const logReferralDistribution = async (data) => {
  try {
    await prisma.systemLog.create({
      data: {
        action: 'REFERRAL_DISTRIBUTION',
        userId: data.userId,
        depositId: data.depositId,
        amount: data.amount,
        status: 'SUCCESS',
        details: {
          level: data.level,
          referrerId: data.referrerId
        },
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to log referral distribution:', error);
  }
};

/**
 * Log admin action
 * @param {Object} data - Log data
 * @returns {Promise<void>}
 */
export const logAdminAction = async (data) => {
  try {
    await prisma.systemLog.create({
      data: {
        action: 'ADMIN_ACTION',
        userId: data.userId || null,
        status: data.status || 'SUCCESS',
        details: {
          adminId: data.adminId,
          action: data.action,
          ...data.details
        },
        error: data.error || null,
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
};

/**
 * Log error
 * @param {string} action - Action that failed
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 * @returns {Promise<void>}
 */
export const logError = async (action, error, context = {}) => {
  try {
    await prisma.systemLog.create({
      data: {
        action,
        status: 'FAILED',
        error: error.message || String(error),
        details: {
          stack: error.stack,
          ...context
        },
        createdAt: new Date()
      }
    });
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }
};

/**
 * Get ROI logs
 * @param {number} limit - Number of logs to retrieve
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Object>} - Logs and pagination info
 */
export const getROILogs = async (limit = 50, offset = 0) => {
  try {
    const [logs, total] = await Promise.all([
      prisma.systemLog.findMany({
        where: {
          action: 'ROI_CALCULATION'
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      }),
      prisma.systemLog.count({
        where: {
          action: 'ROI_CALCULATION'
        }
      })
    ]);

    return {
      logs: logs.map(log => ({
        id: log.id,
        action: log.action,
        status: log.status,
        processed: log.details?.processed || 0,
        totalROI: log.details?.totalROI || 0,
        totalReferrals: log.details?.totalReferrals || 0,
        duration: log.details?.duration || 0,
        errors: log.details?.errors || [],
        createdAt: log.createdAt
      })),
      pagination: {
        limit,
        offset,
        total
      }
    };
  } catch (error) {
    console.error('Failed to get ROI logs:', error);
    throw error;
  }
};

