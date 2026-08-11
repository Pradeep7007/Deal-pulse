import express from 'express';
import { 
  getStatus, 
  startMonitoring, 
  stopMonitoring, 
  triggerManualCheck,
  startLoginBrowser
} from '../controllers/monitorController.js';
import { 
  getSettings, 
  updateSettings 
} from '../controllers/settingsController.js';
import { 
  getLogs, 
  clearLogs 
} from '../controllers/logController.js';
import { 
  getNotifications, 
  clearNotifications 
} from '../controllers/notificationController.js';
import { 
  settingsRules, 
  validate 
} from '../middleware/validation.js';

const router = express.Router();

// Monitor routes
router.get('/status', getStatus);
router.post('/start', startMonitoring);
router.post('/stop', stopMonitoring);
router.post('/check', triggerManualCheck);
router.post('/login-browser', startLoginBrowser);

// Settings routes
router.get('/settings', getSettings);
router.put('/settings', settingsRules, validate, updateSettings);

// Log routes
router.get('/logs', getLogs);
router.delete('/logs', clearLogs);

// Notification history routes
router.get('/history', getNotifications);
router.delete('/history', clearNotifications);

export default router;
