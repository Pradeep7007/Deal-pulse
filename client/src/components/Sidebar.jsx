import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ isMonitoring }) {
  return (
    <div className="d-flex flex-column flex-shrink-0 p-3 text-white bg-dark sidebar border-end border-secondary" style={{ width: '240px' }}>
      <ul className="nav nav-pills flex-column mb-auto gap-1">
        <li className="nav-item">
          <NavLink 
            to="/" 
            className={({ isActive }) => `nav-link d-flex align-items-center text-white gap-2 px-3 py-2.5 rounded ${isActive ? 'active bg-primary' : 'hover-bg-secondary'}`}
            end
          >
            <i className="bi bi-speedometer2"></i>
            <span>Dashboard</span>
          </NavLink>
        </li>
        <li>
          <NavLink 
            to="/settings" 
            className={({ isActive }) => `nav-link d-flex align-items-center text-white gap-2 px-3 py-2.5 rounded ${isActive ? 'active bg-primary' : 'hover-bg-secondary'}`}
          >
            <i className="bi bi-gear-fill"></i>
            <span>Settings</span>
          </NavLink>
        </li>
      </ul>
      
      <hr className="bg-secondary" />
      
      {/* Quick Monitor Health Card */}
      <div className="card bg-black border-secondary p-3 mt-auto">
        <h6 className="text-secondary text-uppercase font-monospace mb-2" style={{ fontSize: '0.75rem' }}>System Status</h6>
        <div className="d-flex align-items-center gap-2">
          <span className={`pulse-glow-${isMonitoring ? 'success' : 'danger'} rounded-circle d-inline-block`} style={{ width: '10px', height: '10px', backgroundColor: isMonitoring ? '#198754' : '#dc3545' }}></span>
          <span className="fw-semibold text-white" style={{ fontSize: '0.85rem' }}>
            {isMonitoring ? 'Cron Job Running' : 'Cron Job Idle'}
          </span>
        </div>
      </div>
    </div>
  );
}
