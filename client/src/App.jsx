import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import monitorAPI from './services/api';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';

export default function App() {
  const [status, setStatus] = useState({
    isMonitoring: false,
    lastChecked: null,
    lastStatus: null,
    lastButtonState: 'UNKNOWN',
    lastError: null,
    pollingInterval: 5,
    rewardUrl: ''
  });
  const [stats, setStats] = useState({
    totalChecks: 0,
    successChecks: 0,
    failedChecks: 0,
    successRate: 0
  });
  const [lastLog, setLastLog] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Fetch status, stats and last log from backend API
  const fetchAllData = async () => {
    try {
      const res = await monitorAPI.getStatus();
      if (res.success) {
        setStatus(res.status);
        setStats(res.stats);
        setLastLog(res.lastLog);
      }
    } catch (err) {
      console.error('Error fetching global status:', err.message);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Sync dark/light theme with document DOM
  useEffect(() => {
    const rootEl = document.documentElement;
    if (isDarkMode) {
      rootEl.setAttribute('data-bs-theme', 'dark');
      rootEl.style.backgroundColor = '#121212';
    } else {
      rootEl.setAttribute('data-bs-theme', 'light');
      rootEl.style.backgroundColor = '#f8f9fa';
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const handleStartMonitor = async () => {
    try {
      const res = await monitorAPI.startMonitor();
      if (res.success) {
        fetchAllData();
      }
    } catch (err) {
      console.error('Error starting monitor:', err.message);
    }
  };

  const handleStopMonitor = async () => {
    try {
      const res = await monitorAPI.stopMonitor();
      if (res.success) {
        fetchAllData();
      }
    } catch (err) {
      console.error('Error stopping monitor:', err.message);
    }
  };

  const handleManualCheck = async () => {
    if (isChecking) return;
    setIsChecking(true);
    try {
      await monitorAPI.checkNow();
      await fetchAllData();
    } catch (err) {
      console.error('Error running manual check:', err.message);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Router>
      <div className="d-flex flex-column min-vh-100 bg-body">
        {/* Navbar */}
        <Navbar 
          isMonitoring={status.isMonitoring}
          onStart={handleStartMonitor}
          onStop={handleStopMonitor}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          onManualCheck={handleManualCheck}
          isChecking={isChecking}
        />
        
        {/* Main Panel Layout */}
        <div className="d-flex flex-grow-1">
          {/* Sidebar */}
          <Sidebar isMonitoring={status.isMonitoring} />
          
          {/* Page Routing Outlet */}
          <main className="flex-grow-1 overflow-auto bg-body-tertiary">
            <Routes>
              <Route 
                path="/" 
                element={
                  <Dashboard 
                    status={status}
                    stats={stats}
                    lastLog={lastLog}
                    fetchAllData={fetchAllData}
                    isChecking={isChecking}
                    onManualCheck={handleManualCheck}
                  />
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <Settings 
                    fetchAllData={fetchAllData}
                  />
                } 
              />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
