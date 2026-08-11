import MonitorState from '../models/MonitorState.js';
import Settings from '../models/Settings.js';
import Log from '../models/Log.js';
import { runMonitoringCheck, startScheduler, stopScheduler } from '../services/schedulerService.js';
import { launchLoginBrowser } from '../services/playwrightService.js';
import { logger } from '../utils/logger.js';

// Get current monitoring status
export const getStatus = async (req, res) => {
  try {
    const state = await MonitorState.getState();
    const settings = await Settings.getSettings();
    
    // Count stats for dashboard
    const totalChecks = await Log.countDocuments();
    const successChecks = await Log.countDocuments({ status: 'SUCCESS' });
    const failedChecks = await Log.countDocuments({ status: 'FAILED' });
    
    // Get last log entry
    const lastLog = await Log.findOne().sort({ timestamp: -1 });

    res.json({
      success: true,
      status: {
        isMonitoring: state.isMonitoring,
        lastChecked: state.lastChecked,
        lastStatus: state.lastStatus,
        lastButtonState: state.lastButtonState,
        lastError: state.lastError,
        pollingInterval: settings.pollingInterval,
        rewardUrl: settings.rewardUrl
      },
      stats: {
        totalChecks,
        successChecks,
        failedChecks,
        successRate: totalChecks > 0 ? Math.round((successChecks / totalChecks) * 100) : 0
      },
      lastLog
    });
  } catch (error) {
    logger.error(`Error in getStatus: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error retrieving monitoring status.' });
  }
};

// Start monitoring scheduler
export const startMonitoring = async (req, res) => {
  try {
    const success = await startScheduler();
    if (success) {
      res.json({ success: true, message: 'Monitoring started successfully.' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to start monitoring.' });
    }
  } catch (error) {
    logger.error(`Error in startMonitoring: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error starting monitoring.' });
  }
};

// Stop monitoring scheduler
export const stopMonitoring = async (req, res) => {
  try {
    const success = await stopScheduler();
    if (success) {
      res.json({ success: true, message: 'Monitoring stopped successfully.' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to stop monitoring.' });
    }
  } catch (error) {
    logger.error(`Error in stopMonitoring: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error stopping monitoring.' });
  }
};

// Trigger manual check
export const triggerManualCheck = async (req, res) => {
  try {
    logger.info('Manual check triggered from API.');
    const result = await runMonitoringCheck(true);
    res.json({ 
      success: true, 
      message: 'Manual check completed.', 
      result: {
        status: result.log.status,
        buttonState: result.log.buttonState,
        responseTime: result.log.responseTime,
        error: result.log.error,
        notificationSent: result.notificationSent
      }
    });
  } catch (error) {
    logger.error(`Error in triggerManualCheck: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error executing manual check.' });
  }
};

// Launch login browser
export const startLoginBrowser = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    // We launch login browser asynchronously so we don't block the API response
    // But we let the user know it is starting
    logger.info('Manual login browser requested.');
    
    launchLoginBrowser(settings)
      .then(() => {
        logger.info('Manual login browser session ended.');
      })
      .catch((err) => {
        logger.error(`Error during manual login browser session: ${err.message}`);
      });
      
    res.json({ 
      success: true, 
      message: 'Login browser launched. Please check the host machine for the Chromium window, log in, and then close the browser.' 
    });
  } catch (error) {
    logger.error(`Error in startLoginBrowser: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to launch login browser.' });
  }
};
