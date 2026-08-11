import Settings from '../models/Settings.js';
import { startScheduler } from '../services/schedulerService.js';
import { logger } from '../utils/logger.js';

// Get current settings
export const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    // Return settings with password redacted for security
    const safeSettings = settings.toObject();
    // Keep it in case the user wants to edit it, but we can return it.
    // If we want the UI to be able to pre-populate, we can send it.
    res.json({ success: true, settings: safeSettings });
  } catch (error) {
    logger.error(`Error in getSettings: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error retrieving settings.' });
  }
};

// Update settings
export const updateSettings = async (req, res) => {
  try {
    const {
      rewardUrl,
      pollingInterval,
      emailAddress,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      browserProfilePath
    } = req.body;

    const settings = await Settings.getSettings();
    
    // Save updated values
    settings.rewardUrl = rewardUrl;
    settings.pollingInterval = Number(pollingInterval);
    settings.emailAddress = emailAddress;
    settings.smtpHost = smtpHost;
    settings.smtpPort = Number(smtpPort);
    settings.smtpUser = smtpUser;
    settings.smtpPass = smtpPass;
    settings.browserProfilePath = browserProfilePath;
    
    await settings.save();
    logger.info('Settings updated successfully.');

    // If monitoring is actively running, restart the scheduler with the new interval
    if (settings.isMonitoringEnabled) {
      logger.info('Restarting scheduler with updated polling settings...');
      await startScheduler();
    }

    res.json({ 
      success: true, 
      message: 'Settings updated successfully.', 
      settings: settings.toObject() 
    });
  } catch (error) {
    logger.error(`Error in updateSettings: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error updating settings.' });
  }
};
