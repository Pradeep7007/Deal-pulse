import React, { useState, useEffect } from 'react';
import monitorAPI from '../services/api';

export default function Dashboard({ status, stats, lastLog, fetchAllData, isChecking, onManualCheck }) {
  const [logs, setLogs] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success'); // success, danger, info
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalBody, setModalBody] = useState('');

  // Fetch recent logs and notification history
  const fetchLogsAndHistory = async () => {
    setLoadingLogs(true);
    setLoadingHistory(true);
    try {
      const logsRes = await monitorAPI.getLogs(20);
      if (logsRes.success) {
        setLogs(logsRes.logs);
      }
      
      const historyRes = await monitorAPI.getHistory(15);
      if (historyRes.success) {
        setHistory(historyRes.notifications);
      }
    } catch (err) {
      showToast('Error loading logs/history', 'danger');
    } finally {
      setLoadingLogs(false);
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchLogsAndHistory();
  }, []);

  // Poll for status and logs updates every 10 seconds to keep UI live
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllData();
      fetchLogsAndHistory();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  const handleClearLogs = async () => {
    try {
      const res = await monitorAPI.clearLogs();
      if (res.success) {
        showToast('Logs cleared successfully');
        setLogs([]);
        fetchAllData();
      }
    } catch (err) {
      showToast('Failed to clear logs', 'danger');
    }
  };

  const handleClearHistory = async () => {
    try {
      const res = await monitorAPI.clearHistory();
      if (res.success) {
        showToast('Notification history cleared successfully');
        setHistory([]);
      }
    } catch (err) {
      showToast('Failed to clear history', 'danger');
    }
  };

  const triggerModal = (action, title, body) => {
    setModalAction(() => action);
    setModalTitle(title);
    setModalBody(body);
    setShowConfirmModal(true);
  };

  const confirmModalAction = () => {
    if (modalAction) {
      modalAction();
    }
    setShowConfirmModal(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getButtonStateBadgeClass = (state) => {
    switch (state) {
      case 'ENABLED':
        return 'bg-success text-white pulse-glow-success';
      case 'DISABLED':
        return 'bg-danger text-white';
      default:
        return 'bg-warning text-dark';
    }
  };

  const getStatusBadgeClass = (status) => {
    return status === 'SUCCESS' ? 'bg-success' : 'bg-danger';
  };

  return (
    <div className="container-fluid p-4">
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`toast show align-items-center text-white bg-${toastType} border-0 position-fixed top-0 end-0 m-4`} role="alert" aria-live="assertive" aria-atomic="true" style={{ zIndex: 1050 }}>
          <div className="d-flex">
            <div className="toast-body">
              <i className={`bi ${toastType === 'success' ? 'bi-check-circle-fill' : toastType === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill'} me-2`}></i>
              {toastMessage}
            </div>
            <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToastMessage(null)} aria-label="Close"></button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h1 className="h3 mb-0 text-white font-weight-bold">Monitoring Dashboard</h1>
          <p className="text-secondary mb-0">Track availability of Microsoft Rewards gift cards.</p>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-danger"
            onClick={() => triggerModal(
              handleClearLogs,
              'Clear Monitoring Logs?',
              'This action will permanently delete all monitoring verification history.'
            )}
            disabled={logs.length === 0}
          >
            <i className="bi bi-trash3-fill me-1"></i> Clear Logs
          </button>
          <button 
            className="btn btn-outline-info"
            onClick={fetchLogsAndHistory}
          >
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
          </button>
        </div>
      </div>

      {/* Row 1: Status & Metric Cards */}
      <div className="row g-4 mb-4">
        {/* Status Card */}
        <div className="col-12 col-xl-6">
          <div className="card bg-dark border-secondary h-100 metric-card">
            <div className="card-header bg-black border-secondary d-flex justify-content-between align-items-center py-3">
              <h5 className="card-title mb-0 text-white text-uppercase font-monospace fs-6">Target Reward Status</h5>
              <span className={`badge ${getButtonStateBadgeClass(status.lastButtonState)} px-3 py-2 fs-7`}>
                <i className={`bi ${status.lastButtonState === 'ENABLED' ? 'bi-check-circle-fill' : 'bi-dash-circle-fill'} me-1`}></i>
                {status.lastButtonState || 'UNKNOWN'}
              </span>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-sm-6">
                  <div className="p-3 bg-black border border-secondary rounded">
                    <span className="text-secondary d-block font-monospace text-uppercase mb-1" style={{ fontSize: '0.75rem' }}>Reward Name</span>
                    <strong className="text-white fs-6">Croma Gift Card</strong>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="p-3 bg-black border border-secondary rounded">
                    <span className="text-secondary d-block font-monospace text-uppercase mb-1" style={{ fontSize: '0.75rem' }}>Polling Interval</span>
                    <strong className="text-white fs-6">{status.pollingInterval ? `${status.pollingInterval} minutes` : 'Not Set'}</strong>
                  </div>
                </div>
                <div className="col-12">
                  <div className="p-3 bg-black border border-secondary rounded">
                    <span className="text-secondary d-block font-monospace text-uppercase mb-1" style={{ fontSize: '0.75rem' }}>Reward URL</span>
                    <a href={status.rewardUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-break" style={{ fontSize: '0.9rem' }}>
                      {status.rewardUrl} <i className="bi bi-box-arrow-up-right ms-1"></i>
                    </a>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="p-3 bg-black border border-secondary rounded">
                    <span className="text-secondary d-block font-monospace text-uppercase mb-1" style={{ fontSize: '0.75rem' }}>Last Checked</span>
                    <span className="text-white fw-semibold" style={{ fontSize: '0.9rem' }}>{formatDate(status.lastChecked)}</span>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="p-3 bg-black border border-secondary rounded">
                    <span className="text-secondary d-block font-monospace text-uppercase mb-1" style={{ fontSize: '0.75rem' }}>Last Run Status</span>
                    <span className={`badge ${status.lastStatus === 'SUCCESS' ? 'bg-success' : 'bg-danger'} px-2 py-1`}>
                      {status.lastStatus || 'NONE'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics stats */}
        <div className="col-12 col-xl-6">
          <div className="row g-4 h-100">
            <div className="col-sm-6">
              <div className="card bg-dark border-secondary h-100 metric-card d-flex flex-column justify-content-between p-4">
                <div>
                  <span className="text-secondary font-monospace text-uppercase d-block mb-1" style={{ fontSize: '0.8rem' }}>Total Checks</span>
                  <h2 className="display-5 text-white fw-bold mb-0">{stats.totalChecks}</h2>
                </div>
                <div className="mt-3">
                  <span className="text-info fs-7"><i className="bi bi-clock-history me-1"></i> Since setup</span>
                </div>
              </div>
            </div>

            <div className="col-sm-6">
              <div className="card bg-dark border-secondary h-100 metric-card d-flex flex-column justify-content-between p-4">
                <div>
                  <span className="text-secondary font-monospace text-uppercase d-block mb-1" style={{ fontSize: '0.8rem' }}>Success Rate</span>
                  <h2 className="display-5 text-success fw-bold mb-0">{stats.successRate}%</h2>
                </div>
                <div className="mt-3">
                  <div className="progress bg-secondary" style={{ height: '6px' }}>
                    <div className="progress-bar bg-success" role="progressbar" style={{ width: `${stats.successRate}%` }} aria-valuenow={stats.successRate} aria-valuemin="0" aria-valuemax="100"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-sm-6">
              <div className="card bg-dark border-secondary h-100 metric-card d-flex flex-column justify-content-between p-4">
                <div>
                  <span className="text-secondary font-monospace text-uppercase d-block mb-1" style={{ fontSize: '0.8rem' }}>Successful Checks</span>
                  <h2 className="display-5 text-white fw-bold mb-0">{stats.successChecks}</h2>
                </div>
                <div className="mt-3">
                  <span className="text-success fs-7"><i className="bi bi-check-circle-fill me-1"></i> Active polling ok</span>
                </div>
              </div>
            </div>

            <div className="col-sm-6">
              <div className="card bg-dark border-secondary h-100 metric-card d-flex flex-column justify-content-between p-4">
                <div>
                  <span className="text-secondary font-monospace text-uppercase d-block mb-1" style={{ fontSize: '0.8rem' }}>Failed Checks</span>
                  <h2 className="display-5 text-danger fw-bold mb-0">{stats.failedChecks}</h2>
                </div>
                <div className="mt-3">
                  <span className="text-danger fs-7">
                    <i className="bi bi-exclamation-triangle-fill me-1"></i> 
                    {status.lastError ? 'Errors present' : 'No recent errors'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Logs Table & Notification History */}
      <div className="row g-4">
        {/* Logs Table */}
        <div className="col-12 col-lg-8">
          <div className="card bg-dark border-secondary metric-card h-100">
            <div className="card-header bg-black border-secondary d-flex justify-content-between align-items-center py-3">
              <h5 className="card-title mb-0 text-white text-uppercase font-monospace fs-6">Monitoring Logs (Last 20 Runs)</h5>
              <button 
                className="btn btn-sm btn-outline-secondary" 
                onClick={fetchLogsAndHistory}
                disabled={loadingLogs}
              >
                {loadingLogs ? <span className="spinner-border spinner-border-sm" role="status"></span> : <i className="bi bi-arrow-clockwise"></i>}
              </button>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-dark table-hover table-striped mb-0 align-middle">
                  <thead>
                    <tr>
                      <th className="border-secondary py-3 ps-4" style={{ fontSize: '0.8rem' }}>Timestamp</th>
                      <th className="border-secondary py-3" style={{ fontSize: '0.8rem' }}>Checked Status</th>
                      <th className="border-secondary py-3" style={{ fontSize: '0.8rem' }}>Button State</th>
                      <th className="border-secondary py-3" style={{ fontSize: '0.8rem' }}>Response Time</th>
                      <th className="border-secondary py-3 pe-4" style={{ fontSize: '0.8rem' }}>Error / Diagnostic</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-5 text-secondary border-0">
                          <i className="bi bi-database-exclamation fs-1 d-block mb-2"></i>
                          No monitoring logs found. Start the scheduler to generate logs.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log._id}>
                          <td className="ps-4 border-secondary text-secondary" style={{ fontSize: '0.85rem' }}>
                            {formatDate(log.timestamp)}
                          </td>
                          <td className="border-secondary">
                            <span className={`badge ${getStatusBadgeClass(log.status)} px-2 py-1`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="border-secondary">
                            <span className={`badge ${log.buttonState === 'ENABLED' ? 'bg-success' : log.buttonState === 'DISABLED' ? 'bg-secondary' : 'bg-warning text-dark'} px-2 py-1`}>
                              {log.buttonState}
                            </span>
                          </td>
                          <td className="border-secondary font-monospace" style={{ fontSize: '0.85rem' }}>
                            {log.responseTime} ms
                          </td>
                          <td className="pe-4 border-secondary text-truncate text-danger" style={{ maxWidth: '200px', fontSize: '0.85rem' }} title={log.error}>
                            {log.error || <span className="text-success">-</span>}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Notification History / Timeline */}
        <div className="col-12 col-lg-4">
          <div className="card bg-dark border-secondary metric-card h-100">
            <div className="card-header bg-black border-secondary d-flex justify-content-between align-items-center py-3">
              <h5 className="card-title mb-0 text-white text-uppercase font-monospace fs-6">Notification History</h5>
              <button 
                className="btn btn-sm btn-outline-danger" 
                onClick={() => triggerModal(
                  handleClearHistory,
                  'Clear Notification History?',
                  'This action will permanently delete all SMTP alert logs.'
                )}
                disabled={history.length === 0}
              >
                <i className="bi bi-trash"></i>
              </button>
            </div>
            <div className="card-body" style={{ maxHeight: '450px', overflowY: 'auto' }}>
              {history.length === 0 ? (
                <div className="text-center py-5 text-secondary">
                  <i className="bi bi-envelope-x fs-2 d-block mb-2"></i>
                  No notifications sent yet.
                </div>
              ) : (
                <ul className="timeline">
                  {history.map((item) => (
                    <li key={item._id} className="timeline-item">
                      <div className={`timeline-marker ${item.status === 'SENT' ? 'bg-success' : 'bg-danger'}`}></div>
                      <div className="timeline-content">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-semibold text-white" style={{ fontSize: '0.85rem' }}>{item.subject}</span>
                          <span className={`badge ${item.status === 'SENT' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} rounded-pill`} style={{ fontSize: '0.7rem' }}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-secondary mb-1" style={{ fontSize: '0.75rem' }}>
                          Sent to configured email at {formatDate(item.timestamp)}
                        </p>
                        {item.error && (
                          <div className="bg-black text-danger p-2 rounded font-monospace" style={{ fontSize: '0.7rem' }}>
                            Error: {item.error}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content bg-dark border-secondary text-white">
                <div className="modal-header border-secondary">
                  <h5 className="modal-title">{modalTitle}</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowConfirmModal(false)} aria-label="Close"></button>
                </div>
                <div className="modal-body">
                  <p>{modalBody}</p>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowConfirmModal(false)}>Cancel</button>
                  <button type="button" className="btn btn-danger" onClick={confirmModalAction}>Confirm</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
}
