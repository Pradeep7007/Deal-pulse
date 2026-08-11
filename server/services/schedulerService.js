import cron from 'node-cron';
import Settings from '../models/Settings.js';
import Log from '../models/Log.js';
import MonitorState from '../models/MonitorState.js';
import { checkRewardAvailability } from './playwrightService.js';
import { sendCromaAvailableNotification } from './notificationService.js';
import { logger } from '../utils/logger.js';

let cronJob = null;

/**
 * Runs a single monitoring check iteration.
 * Can be called by scheduler or triggered manually.
 * 
 * @param {boolean} isManual - Whether the check is manual or scheduled
 * @returns {Promise<Object>} - The check result log entry
 */
export const runMonitoringCheck = async (isManual = false) => {
  const startTime = Date.now();
  let checkResult = null;
  
  try {
    // 1. Fetch current settings
    const settings = await Settings.getSettings();
    
    // 2. Perform Playwright check
    checkResult = await checkRewardAvailability(settings);
    
    // 3. Save log to database
    const logEntry = await Log.create({
      timestamp: new Date(),
      status: checkResult.status,
      buttonState: checkResult.buttonState,
      responseTime: checkResult.responseTime,
      error: checkResult.error
    });
    
    // 4. Retrieve and update monitor state
    const state = await MonitorState.getState();
    const previousButtonState = state.lastButtonState;
    const currentButtonState = checkResult.buttonState;
    
    // Determine notification logic
    // Send email alert only when state changes from DISABLED/UNKNOWN to ENABLED
    let notificationSent = false;
    if (checkResult.status === 'SUCCESS') {
      if (currentButtonState === 'ENABLED' && previousButtonState !== 'ENABLED') {
        logger.info('Availability change detected: DISABLED -> ENABLED. Sending notification!');
        notificationSent = await sendCromaAvailableNotification(settings);
      }
      
      // Update state details
      state.lastButtonState = currentButtonState;
    }
    
    state.lastChecked = new Date();
    state.lastStatus = checkResult.status;
    state.lastError = checkResult.error;
    
    if (isManual) {
      // If manually run, isMonitoring state remains what it is
    } else {
      state.isMonitoring = true;
    }
    
    await state.save();
    
    return {
      log: logEntry,
      notificationSent,
      state
    };
    
  } catch (error) {
    logger.error(`Error in runMonitoringCheck: ${error.message}`);
    
    // Attempt to log failure in DB
    try {
      const responseTime = Date.now() - startTime;
      const logEntry = await Log.create({
        timestamp: new Date(),
        status: 'FAILED',
        buttonState: 'UNKNOWN',
        responseTime,
        error: error.message
      });
      
      const state = await MonitorState.getState();
      state.lastChecked = new Date();
      state.lastStatus = 'FAILED';
      state.lastError = error.message;
      await state.save();
      
      return {
        log: logEntry,
        notificationSent: false,
        state
      };
    } catch (dbError) {
      logger.error(`Failed to write error log to MongoDB: ${dbError.message}`);
      throw error;
    }
  }
};

/**
 * Starts the cron scheduler based on database settings.
 */
export const startScheduler = async () => {
  try {
    const settings = await Settings.getSettings();
    const state = await MonitorState.getState();
    
    // Stop any existing scheduler before starting
    if (cronJob) {
      cronJob.stop();
      cronJob = null;
    }
    
    // Convert minutes to cron expression
    const interval = settings.pollingInterval || 5;
    const cronExpression = `*/${interval} * * * *`;
    
    logger.info(`Starting scheduler: checking every ${interval} minutes (${cronExpression})`);
    
    // Schedule cron job
    cronJob = cron.schedule(cronExpression, async () => {
      logger.info('Scheduled check triggered...');
      try {
        await runMonitoringCheck(false);
      } catch (error) {
        logger.error(`Scheduler check error: ${error.message}`);
      }
    });
    
    // Update state in DB
    state.isMonitoring = true;
    await state.save();
    
    // Also save monitoring status in Settings
    settings.isMonitoringEnabled = true;
    await settings.save();
    
    logger.info('Scheduler started successfully.');
    return true;
  } catch (error) {
    logger.error(`Failed to start scheduler: ${error.message}`);
    return false;
  }
};

/**
 * Stops the active cron scheduler.
 */
export const stopScheduler = async () => {
  try {
    const state = await MonitorState.getState();
    const settings = await Settings.getSettings();
    
    if (cronJob) {
      cronJob.stop();
      cronJob = null;
      logger.info('Scheduler stopped.');
    } else {
      logger.info('Scheduler was not running.');
    }
    
    // Update states
    state.isMonitoring = false;
    await state.save();
    
    settings.isMonitoringEnabled = false;
    await settings.save();
    
    return true;
  } catch (error) {
    logger.error(`Failed to stop scheduler: ${error.message}`);
    return false;
  }
};

/**
 * Initializes scheduler status on server boot.
 * If monitoring is enabled in Settings, automatically start the cron job.
 */
export const initScheduler = async () => {
  try {
    const settings = await Settings.getSettings();
    if (settings.isMonitoringEnabled) {
      logger.info('Auto-starting monitoring scheduler on boot...');
      await startScheduler();
    } else {
      logger.info('Monitoring is disabled on boot.');
      const state = await MonitorState.getState();
      state.isMonitoring = false;
      await state.save();
    }
  } catch (error) {
    logger.error(`Failed to initialize scheduler on boot: ${error.message}`);
  }
};
