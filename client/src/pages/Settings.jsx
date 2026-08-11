import React, { useState, useEffect } from 'react';
import monitorAPI from '../services/api';

export default function Settings({ fetchAllData }) {
  const [formData, setFormData] = useState({
    rewardUrl: '',
    pollingInterval: 5,
    emailAddress: '',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    browserProfilePath: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [browserLaunching, setBrowserLaunching] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');
  const [errors, setErrors] = useState({});

  // Fetch current settings on load
  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await monitorAPI.getSettings();
      if (res.success && res.settings) {
        setFormData({
          rewardUrl: res.settings.rewardUrl || '',
          pollingInterval: res.settings.pollingInterval || 5,
          emailAddress: res.settings.emailAddress || '',
          smtpHost: res.settings.smtpHost || '',
          smtpPort: res.settings.smtpPort || 587,
          smtpUser: res.settings.smtpUser || '',
          smtpPass: res.settings.smtpPass || '',
          browserProfilePath: res.settings.browserProfilePath || ''
        });
      }
    } catch (err) {
      showToast('Error loading settings from server', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'pollingInterval' || name === 'smtpPort' ? Number(value) : value
    }));
    
    // Clear validation error when editing
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.rewardUrl) newErrors.rewardUrl = 'Reward URL is required.';
    else if (!formData.rewardUrl.startsWith('http://') && !formData.rewardUrl.startsWith('https://')) {
      newErrors.rewardUrl = 'Reward URL must be a valid HTTP/HTTPS URL.';
    }
    
    if (!formData.pollingInterval || formData.pollingInterval < 1 || formData.pollingInterval > 1440) {
      newErrors.pollingInterval = 'Polling interval must be between 1 and 1440 minutes.';
    }
    
    if (!formData.emailAddress) newErrors.emailAddress = 'Recipient email address is required.';
    else if (!/\S+@\S+\.\S+/.test(formData.emailAddress)) {
      newErrors.emailAddress = 'Recipient email address must be a valid email.';
    }
    
    if (!formData.smtpHost) newErrors.smtpHost = 'SMTP Host is required.';
    if (!formData.smtpPort || formData.smtpPort < 1 || formData.smtpPort > 65535) {
      newErrors.smtpPort = 'SMTP Port must be between 1 and 65535.';
    }
    if (!formData.smtpUser) newErrors.smtpUser = 'SMTP User email is required.';
    if (!formData.smtpPass) newErrors.smtpPass = 'SMTP Password is required.';
    if (!formData.browserProfilePath) newErrors.browserProfilePath = 'Browser Profile Path is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Please fix validation errors first', 'danger');
      return;
    }

    setSaving(true);
    try {
      const res = await monitorAPI.updateSettings(formData);
      if (res.success) {
        showToast('Settings saved successfully!');
        fetchAllData(); // Refresh global app status
      }
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors && Array.isArray(serverErrors)) {
        const mappedErrors = {};
        serverErrors.forEach(err => {
          mappedErrors[err.field] = err.message;
        });
        setErrors(mappedErrors);
        showToast('Failed saving settings due to server validations.', 'danger');
      } else {
        showToast('Failed to save settings: ' + (err.response?.data?.message || err.message), 'danger');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLaunchBrowser = async () => {
    setBrowserLaunching(true);
    showToast('Launching browser window on the host server. Check your host machine taskbar!', 'info');
    try {
      const res = await monitorAPI.launchLoginBrowser();
      if (res.success) {
        showToast('Manual login browser launched successfully.', 'success');
      }
    } catch (err) {
      showToast('Failed to launch browser: ' + err.message, 'danger');
    } finally {
      setBrowserLaunching(false);
    }
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
      <div className="mb-4">
        <h1 className="h3 mb-0 text-white font-weight-bold">Monitoring & Notification Settings</h1>
        <p className="text-secondary mb-0">Configure your Microsoft Rewards monitoring details, browser session profile, and email alerting.</p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading settings...</span>
          </div>
          <p className="text-secondary mt-3">Loading settings from database...</p>
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-12 col-xl-8">
            <div className="card bg-dark border-secondary metric-card">
              <div className="card-header bg-black border-secondary py-3">
                <h5 className="card-title mb-0 text-white text-uppercase font-monospace fs-6">Configuration Settings</h5>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSubmit} noValidate>
                  {/* Rewards URL & Polling */}
                  <h6 className="text-primary border-bottom border-secondary pb-2 mb-3">
                    <i className="bi bi-search me-2"></i> Monitoring Options
                  </h6>
                  
                  <div className="row g-3 mb-4">
                    <div className="col-12">
                      <label className="form-label text-white-50">Reward Target URL</label>
                      <input
                        type="url"
                        name="rewardUrl"
                        className={`form-control bg-black text-white border-secondary ${errors.rewardUrl ? 'is-invalid' : ''}`}
                        value={formData.rewardUrl}
                        onChange={handleInputChange}
                        placeholder="https://rewards.bing.com/redeem/..."
                        required
                      />
                      {errors.rewardUrl && <div className="invalid-feedback">{errors.rewardUrl}</div>}
                      <small className="form-text text-secondary">
                        The specific Microsoft Rewards redemption page URL for the gift card.
                      </small>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label text-white-50">Polling Interval (Minutes)</label>
                      <input
                        type="number"
                        name="pollingInterval"
                        className={`form-control bg-black text-white border-secondary ${errors.pollingInterval ? 'is-invalid' : ''}`}
                        value={formData.pollingInterval}
                        onChange={handleInputChange}
                        min="1"
                        max="1440"
                        required
                      />
                      {errors.pollingInterval && <div className="invalid-feedback">{errors.pollingInterval}</div>}
                      <small className="form-text text-secondary">
                        How frequently (in minutes) to open the page and inspect the button state.
                      </small>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label text-white-50">Chrome User Profile Directory</label>
                      <input
                        type="text"
                        name="browserProfilePath"
                        className={`form-control bg-black text-white border-secondary ${errors.browserProfilePath ? 'is-invalid' : ''}`}
                        value={formData.browserProfilePath}
                        onChange={handleInputChange}
                        placeholder="./browser-profile"
                        required
                      />
                      {errors.browserProfilePath && <div className="invalid-feedback">{errors.browserProfilePath}</div>}
                      <small className="form-text text-secondary">
                        Saves cookies, logins, and session details to avoid repeat login prompts.
                      </small>
                    </div>
                  </div>

                  {/* Notification Credentials */}
                  <h6 className="text-primary border-bottom border-secondary pb-2 mb-3">
                    <i className="bi bi-envelope-fill me-2"></i> SMTP Credentials (Gmail SMTP)
                  </h6>

                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label text-white-50">Alert Email Destination</label>
                      <input
                        type="email"
                        name="emailAddress"
                        className={`form-control bg-black text-white border-secondary ${errors.emailAddress ? 'is-invalid' : ''}`}
                        value={formData.emailAddress}
                        onChange={handleInputChange}
                        placeholder="your-email@gmail.com"
                        required
                      />
                      {errors.emailAddress && <div className="invalid-feedback">{errors.emailAddress}</div>}
                      <small className="form-text text-secondary">
                        The email address that receives notifications when cards are in stock.
                      </small>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label text-white-50">SMTP Host</label>
                      <input
                        type="text"
                        name="smtpHost"
                        className={`form-control bg-black text-white border-secondary ${errors.smtpHost ? 'is-invalid' : ''}`}
                        value={formData.smtpHost}
                        onChange={handleInputChange}
                        placeholder="smtp.gmail.com"
                        required
                      />
                      {errors.smtpHost && <div className="invalid-feedback">{errors.smtpHost}</div>}
                    </div>

                    <div className="col-md-4">
                      <label className="form-label text-white-50">SMTP Port</label>
                      <input
                        type="number"
                        name="smtpPort"
                        className={`form-control bg-black text-white border-secondary ${errors.smtpPort ? 'is-invalid' : ''}`}
                        value={formData.smtpPort}
                        onChange={handleInputChange}
                        placeholder="587"
                        required
                      />
                      {errors.smtpPort && <div className="invalid-feedback">{errors.smtpPort}</div>}
                    </div>

                    <div className="col-md-4">
                      <label className="form-label text-white-50">SMTP Username (Gmail Email)</label>
                      <input
                        type="text"
                        name="smtpUser"
                        className={`form-control bg-black text-white border-secondary ${errors.smtpUser ? 'is-invalid' : ''}`}
                        value={formData.smtpUser}
                        onChange={handleInputChange}
                        placeholder="example@gmail.com"
                        required
                      />
                      {errors.smtpUser && <div className="invalid-feedback">{errors.smtpUser}</div>}
                    </div>

                    <div className="col-md-4">
                      <label className="form-label text-white-50">SMTP Password (Gmail App Password)</label>
                      <input
                        type="password"
                        name="smtpPass"
                        className={`form-control bg-black text-white border-secondary ${errors.smtpPass ? 'is-invalid' : ''}`}
                        value={formData.smtpPass}
                        onChange={handleInputChange}
                        placeholder="••••••••••••••••"
                        required
                      />
                      {errors.smtpPass && <div className="invalid-feedback">{errors.smtpPass}</div>}
                      <small className="form-text text-secondary">
                        Use a Gmail App Password, not your standard login.
                      </small>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end pt-3">
                    <button 
                      type="submit" 
                      className="btn btn-primary px-4 py-2"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Saving Settings...
                        </>
                      ) : (
                        <><i className="bi bi-save2-fill me-1"></i> Save Configuration</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Sidebar Actions */}
          <div className="col-12 col-xl-4">
            {/* Login Helper Card */}
            <div className="card bg-dark border-secondary metric-card mb-4">
              <div className="card-header bg-black border-secondary py-3">
                <h5 className="card-title mb-0 text-white text-uppercase font-monospace fs-6">Authentication Helper</h5>
              </div>
              <div className="card-body">
                <p className="text-secondary text-justify" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                  Microsoft Rewards pages require an active login session. We reuse cookies via Playwright's persistent user profile context.
                </p>
                <div className="alert alert-warning border-warning bg-warning-subtle text-warning-emphasis p-3 rounded" style={{ fontSize: '0.85rem' }}>
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  <strong>Important:</strong> Launching the browser will open a visible, interactive Chrome window on the server host machine.
                </div>
                <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
                  Click below to open a browser window using the path <code>{formData.browserProfilePath || './browser-profile'}</code>, complete the Microsoft authentication flow manually, and then close the Chrome browser window.
                </p>
                <button
                  className="btn btn-outline-primary w-100 py-2"
                  onClick={handleLaunchBrowser}
                  disabled={browserLaunching}
                >
                  {browserLaunching ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Browser Open...
                    </>
                  ) : (
                    <><i className="bi bi-box-arrow-up-right me-2"></i> Open Browser for Login</>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Diagnostic Card */}
            <div className="card bg-dark border-secondary metric-card">
              <div className="card-header bg-black border-secondary py-3">
                <h5 className="card-title mb-0 text-white text-uppercase font-monospace fs-6">Diagnostic Overview</h5>
              </div>
              <div className="card-body">
                <ul className="list-group list-group-flush bg-transparent border-0">
                  <li className="list-group-item bg-transparent text-secondary border-secondary px-0 py-2.5 d-flex justify-content-between">
                    <span>Database Connection:</span>
                    <span className="text-success fw-semibold"><i className="bi bi-check-circle-fill me-1"></i> Connected</span>
                  </li>
                  <li className="list-group-item bg-transparent text-secondary border-secondary px-0 py-2.5 d-flex justify-content-between">
                    <span>Browser Engine:</span>
                    <span className="text-white">Playwright Chromium</span>
                  </li>
                  <li className="list-group-item bg-transparent text-secondary border-0 px-0 py-2.5 d-flex justify-content-between">
                    <span>Server Mode:</span>
                    <span className="text-info font-monospace">production</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
