import cron from 'node-cron';
import { calculateDailyROI } from '../services/roiEngine.service.js';
import { logError } from '../utils/logger.js';

let isRunning = false;
let lastRunTime = null;
let cronTask = null;

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
  const startTimeISO = startTime.toISOString();

  try {
    console.log(`🔄 [${startTimeISO}] Starting daily ROI calculation...`);
    
    const result = await calculateDailyROI();

    lastRunTime = new Date();
    const endTime = new Date();
    const duration = endTime - startTime;
    
    console.log(`✅ [${endTime.toISOString()}] Daily ROI calculation completed:`, {
      processed: result.processed,
      totalROI: `$${result.totalROI.toFixed(2)}`,
      totalReferrals: `$${result.totalReferrals.toFixed(2)}`,
      duration: `${duration}ms`,
      timestamp: result.timestamp
    });

    if (result.errors && result.errors.length > 0) {
      console.warn(`⚠️ ${result.errors.length} errors occurred during processing:`, result.errors);
    }

    // Log success
    console.log(`📊 Summary: Processed ${result.processed} deposits, Total ROI: $${result.totalROI.toFixed(2)}, Referrals: $${result.totalReferrals.toFixed(2)}`);
  } catch (error) {
    const errorTime = new Date().toISOString();
    console.error(`❌ [${errorTime}] Error in daily ROI job:`, error);
    console.error('Error stack:', error.stack);
    await logError('DAILY_ROI_JOB', error, {
      startTime: startTimeISO,
      errorMessage: error.message,
      errorStack: error.stack
    });
  } finally {
    isRunning = false;
    const endTime = new Date();
    const totalDuration = endTime - startTime;
    console.log(`⏱️ ROI job completed in ${totalDuration}ms`);
  }
};

/**
 * Start the daily ROI cron job
 * Schedule: Every day at 00:00 UTC
 */
export const startDailyROIJob = () => {
  try {
    // Schedule: 0 0 * * * (every day at 00:00 UTC)
    cronTask = cron.schedule('0 0 * * *', dailyROIJob, {
      scheduled: true,
      timezone: 'UTC'
    });

    const now = new Date();
    const nextRun = getNextRunTime();
    const timeUntilNext = nextRun - now;
    const hoursUntil = Math.floor(timeUntilNext / (1000 * 60 * 60));
    const minutesUntil = Math.floor((timeUntilNext % (1000 * 60 * 60)) / (1000 * 60));

    console.log('📅 Daily ROI job scheduled: Runs daily at 00:00 UTC');
    console.log(`⏰ Next run: ${nextRun.toISOString()} (in ${hoursUntil}h ${minutesUntil}m)`);
    console.log(`🕐 Current time: ${now.toISOString()}`);

    // Optional: Run immediately on startup for testing (remove in production)
    if (process.env.RUN_ROI_ON_STARTUP === 'true') {
      console.log('🚀 Running ROI calculation on startup (testing mode)...');
      setTimeout(() => {
        dailyROIJob().catch(err => {
          console.error('Failed to run ROI on startup:', err);
        });
      }, 5000); // Wait 5 seconds for server to fully start
    }
  } catch (error) {
    console.error('❌ Failed to start ROI cron job:', error);
    throw error;
  }
};

/**
 * Get job status
 * @returns {Object} - Job status information
 */
export const getJobStatus = () => {
  const nextRun = getNextRunTime();
  const now = new Date();
  const timeUntilNext = nextRun - now;
  
  return {
    isRunning,
    lastRunTime,
    nextRunTime: nextRun,
    timeUntilNext: timeUntilNext,
    isScheduled: cronTask !== null,
    cronExpression: '0 0 * * *',
    timezone: 'UTC'
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
export const triggerManually = async () => {
  if (isRunning) {
    throw new Error('ROI job is already running');
  }
  return await dailyROIJob();
};

/**
 * Stop the cron job
 */
export const stopDailyROIJob = () => {
  if (cronTask) {
    cronTask.stop();
    console.log('🛑 Daily ROI job stopped');
  }
};

