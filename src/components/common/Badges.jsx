import React from 'react';

// Status badge — maps task status strings from backend
export const StatusBadge = ({ status }) => {
  const map = {
    Todo: 'badge-todo',
    'In Progress': 'badge-progress',
    Done: 'badge-done',
  };
  return <span className={`badge ${map[status] || 'badge-todo'}`}>{status}</span>;
};

// Priority badge
export const PriorityBadge = ({ priority }) => {
  const map = {
    low: 'badge-low',
    medium: 'badge-medium',
    high: 'badge-high',
    Low: 'badge-low',
    Medium: 'badge-medium',
    High: 'badge-high',
  };
  return <span className={`badge ${map[priority] || 'badge-medium'}`}>● {priority}</span>;
};

// Role badge
export const RoleBadge = ({ role }) => (
  <span className={`badge ${role === 'Admin' ? 'badge-admin' : 'badge-member'}`}>{role}</span>
);

// Loading spinner
export const Spinner = ({ size = 24 }) => (
  <div className="spinner-wrap">
    <svg className="spinner" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="var(--border2)" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  </div>
);

// Empty state
export const EmptyState = ({ icon, title, subtitle, action }) => (
  <div className="empty-state">
    <div className="empty-icon">{icon}</div>
    <div className="empty-title">{title}</div>
    {subtitle && <div className="empty-subtitle">{subtitle}</div>}
    {action}
  </div>
);

// Overdue chip
export const OverdueBadge = () => (
  <span className="badge badge-overdue">Overdue</span>
);
