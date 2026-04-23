import React from 'react';
import './Shared.css';

export function StatusBadge({ status }) {
  const map = {
    'Active': 'status-active',
    'At Risk': 'status-risk',
    'Completed': 'status-completed',
  };
  return <span className={`status-badge ${map[status] || ''}`}>{status}</span>;
}

export function StageBadge({ stage }) {
  const map = {
    'Planted': 'stage-planted',
    'Growing': 'stage-growing',
    'Ready': 'stage-ready',
    'Harvested': 'stage-harvested',
  };
  return <span className={`stage-badge ${map[stage] || ''}`}>{stage}</span>;
}

export function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="stat-card" style={{ '--accent-card': color || 'var(--accent-primary)' }}>
      {icon && <div className="stat-icon">{icon}</div>}
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export function ProgressBar({ value, color }) {
  return (
    <div className="progress-track">
      <div
        className="progress-fill"
        style={{ width: `${Math.min(100, value)}%`, background: color || 'var(--accent-primary)' }}
      />
    </div>
  );
}

export function Loader() {
  return (
    <div className="loader-wrap">
      <div className="loader-ring" />
      <span className="loader-text">Loading...</span>
    </div>
  );
}

export function EmptyState({ icon, title, sub, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3 className="empty-title">{title}</h3>
      {sub && <p className="empty-sub">{sub}</p>}
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </div>
  );
}

export function Card({ children, className = '' }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
