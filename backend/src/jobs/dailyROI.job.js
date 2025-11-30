import cron from 'node-cron';
import { calculateDailyROI } from '../services/roiEngine.service.js';
import { logError } from '../utils/logger.js';

let isRunning = false;
let lastRunTime = null;

/**
 * Daily ROI calculation job
 * Runs at 00:00 UTC every day
 */
const dailyROIJob = async () => {
  // Prevent concurrent execution
  if (isRunning) {
    console.log('⚠️ ROI calculation already running, skipping...');
    return;
  }

  isRunning = true;
  const startTime = new Date();

  try {
    console.log('🔄 Starting daily ROI calculation...');
    
    const result = await calculateDailyROI();

    lastRunTime = new Date();
    
    console.log('✅ Daily ROI calculation completed:', {
      processed: result.processed,
      totalROI: result.totalROI.toFixed(2),
      totalReferrals: result.totalReferrals.toFixed(2),
      duration: `${result.duration}ms`
    });

    if (result.errors && result.errors.length > 0) {
      console.warn(`⚠️ ${result.errors.length} errors occurred during processing`);
    }
  } catch (error) {
    console.error('❌ Error in daily ROI job:', error);
    await logError('DAILY_ROI_JOB', error);
  } finally {
    isRunning = false;
  }
};

/**
 * Start the daily ROI cron job
 * Schedule: Every day at 00:00 UTC
 */
export const startDailyROIJob = () => {
  // Schedule: 0 0 * * * (every day at 00:00 UTC)
  cron.schedule('0 0 * * *', dailyROIJob, {
    scheduled: true,
    timezone: 'UTC'
  });

  console.log('📅 Daily ROI job scheduled: Runs daily at 00:00 UTC');

  // Optional: Run immediately on startup for testing (remove in production)
  if (process.env.RUN_ROI_ON_STARTUP === 'true') {
    console.log('🚀 Running ROI calculation on startup (testing mode)...');
    dailyROIJob();
  }
};

/**
 * Get job status
 * @returns {Object} - Job status information
 */
export const getJobStatus = () => {
  return {
    isRunning,
    lastRunTime,
    nextRunTime: getNextRunTime()
  };
};

/**
 * Calculate next run time (00:00 UTC)
 * @returns {Date} - Next run time
 */
const getNextRunTime = () => {
  const now = new Date();
  const nextRun = new Date();
  nextRun.setUTCHours(0, 0, 0, 0);
  
  // If already past 00:00 UTC today, schedule for tomorrow
  if (nextRun <= now) {
    nextRun.setUTCDate(nextRun.getUTCDate() + 1);
  }
  
  return nextRun;
};

/**
 * Manually trigger the job (for testing)
 */
export const triggerManually = () => {
  if (isRunning) {
    throw new Error('ROI job is already running');
  }
  return dailyROIJob();
};

