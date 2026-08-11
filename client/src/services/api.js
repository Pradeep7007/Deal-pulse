import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const monitorAPI = {
  // Get current status and stats
  getStatus: async () => {
    const response = await api.get('/status');
    return response.data;
  },

  // Start monitoring scheduler
  startMonitor: async () => {
    const response = await api.post('/start');
    return response.data;
  },

  // Stop monitoring scheduler
  stopMonitor: async () => {
    const response = await api.post('/stop');
    return response.data;
  },

  // Trigger manual check
  checkNow: async () => {
    const response = await api.post('/check');
    return response.data;
  },

  // Launch login browser on the server host
  launchLoginBrowser: async () => {
    const response = await api.post('/login-browser');
    return response.data;
  },

  // Settings
  getSettings: async () => {
    const response = await api.get('/settings');
    return response.data;
  },

  updateSettings: async (settings) => {
    const response = await api.put('/settings', settings);
    return response.data;
  },

  // Logs
  getLogs: async (limit = 100) => {
    const response = await api.get(`/logs?limit=${limit}`);
    return response.data;
  },

  clearLogs: async () => {
    const response = await api.delete('/logs');
    return response.data;
  },

  // Notification History
  getHistory: async (limit = 50) => {
    const response = await api.get(`/history?limit=${limit}`);
    return response.data;
  },

  clearHistory: async () => {
    const response = await api.delete('/history');
    return response.data;
  },
};

export default monitorAPI;
