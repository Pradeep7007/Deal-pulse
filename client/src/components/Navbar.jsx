import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ isMonitoring, onStart, onStop, isDarkMode, toggleDarkMode, onManualCheck, isChecking }) {
  const location = useLocation();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark border-bottom border-secondary sticky-top py-2">
      <div className="container-fluid px-4">
        {/* Brand */}
        <Link className="navbar-brand d-flex align-items-center fw-bold fs-4 text-primary" to="/">
          <i className="bi bi-gift-fill me-2 text-primary"></i>
          <span className="text-white">MS Rewards</span>
          <span className="text-primary ms-1">Notifier</span>
        </Link>

        {/* Toggle Button */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Content */}
        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-4">
            <li className="nav-item">
              <Link 
                className={`nav-link px-3 ${location.pathname === '/' ? 'active text-primary fw-semibold' : 'text-secondary'}`} 
                to="/"
              >
                <i className="bi bi-speedometer2 me-1"></i> Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`nav-link px-3 ${location.pathname === '/settings' ? 'active text-primary fw-semibold' : 'text-secondary'}`} 
                to="/settings"
              >
                <i className="bi bi-gear-fill me-1"></i> Settings
              </Link>
            </li>
          </ul>

          {/* Right Action panel */}
          <div className="d-flex align-items-center gap-3 flex-wrap">
            {/* Monitoring Status Badge */}
            <span className={`badge d-flex align-items-center py-2 px-3 rounded-pill border ${isMonitoring ? 'bg-success-subtle text-success border-success' : 'bg-danger-subtle text-danger border-danger'}`}>
              <span className={`spinner-grow spinner-grow-sm me-2 ${isMonitoring ? 'text-success' : 'text-danger'}`} role="status"></span>
              {isMonitoring ? 'Monitoring Active' : 'Monitoring Stopped'}
            </span>

            {/* Quick Control Actions */}
            <button 
              className={`btn btn-sm ${isMonitoring ? 'btn-outline-danger' : 'btn-primary'}`} 
              onClick={isMonitoring ? onStop : onStart}
            >
              {isMonitoring ? (
                <><i className="bi bi-stop-fill me-1"></i> Stop</>
              ) : (
                <><i className="bi bi-play-fill me-1"></i> Start</>
              )}
            </button>

            <button 
              className="btn btn-sm btn-outline-info" 
              onClick={onManualCheck}
              disabled={isChecking}
            >
              {isChecking ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  Checking...
                </>
              ) : (
                <><i className="bi bi-arrow-clockwise me-1"></i> Check Now</>
              )}
            </button>

            {/* Dark Mode Toggle */}
            <button 
              className="btn btn-sm btn-outline-secondary rounded-circle px-2"
              onClick={toggleDarkMode}
              title="Toggle Theme"
            >
              <i className={`bi ${isDarkMode ? 'bi-sun-fill text-warning' : 'bi-moon-fill'}`}></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
