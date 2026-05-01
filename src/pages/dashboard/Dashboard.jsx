import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard, getProjects, getTasksByProject } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, Spinner, EmptyState, OverdueBadge } from '../../components/common/Badges';
import { formatDistanceToNow, isPast, parseISO } from 'date-fns';
//import toast from 'react-hot-toast';

const StatCard = ({ label, value, color, icon }) => (
  <div className={`stat-card stat-${color}`}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const token = localStorage.getItem('token');

  if (!token) return; //  STOP if no token

  const fetchAll = async () => {
    try {
      const [dashRes, projRes] = await Promise.all([
        getDashboard(),
        getProjects()
      ]);

      setStats(dashRes.data);

      const projs = projRes.data;
      setProjects(projs);

      const taskResults = await Promise.all(
        projs.slice(0, 2).map((p) =>
          getTasksByProject(p._id).catch(() => ({ data: [] }))
        )
      );

      const allTasks = taskResults.flatMap((r) => r.data || []);
      setRecentTasks(allTasks.slice(0, 6));

    } catch (err) {
      console.error(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchAll();
}, []);

  if (loading) return <div className="page-loading"><Spinner size={36} /></div>;



  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {greeting()}, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => navigate('/projects')}>
            + New Project
          </button>
        )}
      </div>

      {/* Stats grid */}
      <div className="stats-grid">
        <StatCard
          label="Total Tasks" value={stats?.total ?? 0} color="purple"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>}
        />
        <StatCard
          label="To Do" value={stats?.todo ?? 0} color="slate"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /></svg>}
        />
        <StatCard
          label="In Progress" value={stats?.inProgress ?? 0} color="blue"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" /></svg>}
        />
        <StatCard
          label="Done" value={stats?.done ?? 0} color="green"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
        />
        <StatCard
          label="Overdue" value={stats?.overdue ?? 0} color="red"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>}
        />
      </div>

      {/* Two column: tasks + projects */}
      <div className="dashboard-grid">
        <div className="dashboard-col">
          <div className="section-header">
            <h2 className="section-title">Recent Tasks</h2>
            <button className="btn-ghost btn-sm" onClick={() => navigate('/tasks')}>View all</button>
          </div>
          {recentTasks.length === 0 ? (
            <EmptyState icon="✓" title="No tasks yet" subtitle="Tasks assigned to you will appear here" />
          ) : (
            <div className="task-list">
              {recentTasks.map((task) => {
                const overdue =
                  task.dueDate &&
                  isPast(parseISO(task.dueDate)) &&
                  task.status !== 'Done';
                return (
                  <div key={task._id} className={`task-item ${overdue ? 'task-overdue' : ''}`}>
                    <div className="task-item-main">
                      <span className="task-item-title">{task.title}</span>
                      <div className="task-item-meta">
                        {task.assignedTo?.name && (
                          <span className="task-assignee">→ {task.assignedTo.name}</span>
                        )}
                        {task.dueDate && (
                          <span className="task-due">
                            {formatDistanceToNow(parseISO(task.dueDate), { addSuffix: true })}
                          </span>
                        )}
                        {overdue && <OverdueBadge />}
                      </div>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="dashboard-col">
          <div className="section-header">
            <h2 className="section-title">Projects</h2>
            <button className="btn-ghost btn-sm" onClick={() => navigate('/projects')}>View all</button>
          </div>
          {projects.length === 0 ? (
            <EmptyState icon="📁" title="No projects" subtitle="Projects you're a member of appear here" />
          ) : (
            <div className="project-list">
              {projects.map((p) => {
                const memberCount = p.members?.length ?? 0;
                return (
                  <div
                    key={p._id}
                    className="project-item"
                    onClick={() => navigate(`/projects/${p._id}`)}
                  >
                    <div className="project-dot" style={{ background: p.color || 'var(--accent)' }} />
                    <div className="project-item-info">
                      <span className="project-item-name">{p.name}</span>
                      <span className="project-item-meta">
                        {memberCount} member{memberCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
