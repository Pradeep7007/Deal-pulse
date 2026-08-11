import Notification from '../models/Notification.js';
import { logger } from '../utils/logger.js';

// Get recent notifications
export const getNotifications = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const notifications = await Notification.find()
      .sort({ timestamp: -1 })
      .limit(limit);
      
    res.json({ success: true, notifications });
  } catch (error) {
    logger.error(`Error in getNotifications: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error retrieving notification history.' });
  }
};

// Clear notification history
export const clearNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({});
    logger.info('Notification history cleared.');
    res.json({ success: true, message: 'Notification history cleared successfully.' });
  } catch (error) {
    logger.error(`Error in clearNotifications: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error clearing notification history.' });
  }
};
