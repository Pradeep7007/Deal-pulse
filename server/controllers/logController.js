import Log from '../models/Log.js';
import { logger } from '../utils/logger.js';

// Get recent check logs
export const getLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '100', 10);
    const logs = await Log.find()
      .sort({ timestamp: -1 })
      .limit(limit);
      
    res.json({ success: true, logs });
  } catch (error) {
    logger.error(`Error in getLogs: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error retrieving logs.' });
  }
};

// Clear all logs
export const clearLogs = async (req, res) => {
  try {
    await Log.deleteMany({});
    logger.info('Monitoring check logs cleared.');
    res.json({ success: true, message: 'Logs cleared successfully.' });
  } catch (error) {
    logger.error(`Error in clearLogs: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error clearing logs.' });
  }
};
