import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects, getTasksByProject, updateTask } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, PriorityBadge, Spinner, EmptyState, OverdueBadge } from '../../components/common/Badges';
import { formatDistanceToNow, isPast, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const FILTERS = ['All', 'Todo', 'In Progress', 'Done', 'Overdue'];

const MyTasks = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    const fetchMyTasks = async () => {
      try {
        // Fetch all projects, then tasks from each, filter by assignee
        const projRes = await getProjects();
        const allProjects = projRes.data;
        const taskResults = await Promise.all(
          allProjects.map((p) => getTasksByProject(p._id).catch(() => ({ data: [] })))
        );
        const allTasks = taskResults.flatMap((r) => r.data || []);
        // For admins show all; for members filter to assigned
        const mine = isAdmin
          ? allTasks
          : allTasks.filter((t) => t.assignedTo?._id === user?._id || t.assignedTo === user?._id);
        // Attach project info
        const withProject = mine.map((t) => ({
          ...t,
          _projectName: allProjects.find((p) => p._id === t.project)?.name || '',
          _projectColor: allProjects.find((p) => p._id === t.project)?.color || '#7c6af7',
        }));
        setTasks(withProject);
      } catch {
        toast.error('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };
    fetchMyTasks();
  }, [user, isAdmin]);

  const handleStatusChange = async (taskId, status) => {
    setUpdating(taskId);
    try {
      await updateTask(taskId, { status }); // PUT /api/tasks/:id
      setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status } : t)));
      toast.success('Status updated');
    } catch {
      toast.error('Update failed');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = tasks.filter((t) => {
    if (filter === 'All') return true;
    if (filter === 'Overdue') return t.dueDate && isPast(parseISO(t.dueDate)) && t.status !== 'Done';
    return t.status === filter;
  });

  const counts = {
    All: tasks.length,
    Todo: tasks.filter((t) => t.status === 'Todo').length,
    'In Progress': tasks.filter((t) => t.status === 'In Progress').length,
    Done: tasks.filter((t) => t.status === 'Done').length,
    Overdue: tasks.filter((t) => t.dueDate && isPast(parseISO(t.dueDate)) && t.status !== 'Done').length,
  };

  if (loading) return <div className="page-loading"><Spinner size={36} /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isAdmin ? 'All Tasks' : 'My Tasks'}</h1>
          <p className="page-subtitle">{tasks.length} task{tasks.length !== 1 ? 's' : ''} total</p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="filter-chips">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`filter-chip ${filter === f ? 'active' : ''} ${f === 'Overdue' && counts.Overdue > 0 ? 'chip-danger' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
            {counts[f] > 0 && <span className="chip-count">{counts[f]}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="✓" title={`No ${filter.toLowerCase()} tasks`} subtitle="Nothing to show here" />
      ) : (
        <div className="tasks-list">
          {filtered.map((t) => {
            const overdue = t.dueDate && isPast(parseISO(t.dueDate)) && t.status !== 'Done';
            return (
              <div key={t._id} className={`task-row ${overdue ? 'task-row-overdue' : ''}`}>
                <div className="task-row-left">
                  {/* Project color pill */}
                  {t._projectName && (
                    <div className="task-project-pill" style={{ background: t._projectColor + '22', color: t._projectColor }}>
                      <div className="task-project-dot" style={{ background: t._projectColor }} />
                      <button
                        className="task-project-link"
                        style={{ color: t._projectColor }}
                        onClick={() => navigate(`/projects/${t.project}`)}
                      >
                        {t._projectName}
                      </button>
                    </div>
                  )}
                  <div className="task-row-title">{t.title}</div>
                  <div className="task-row-meta">
                    <PriorityBadge priority={t.priority || 'medium'} />
                    {t.assignedTo?.name && isAdmin && (
                      <span className="text-muted text-sm">→ {t.assignedTo.name}</span>
                    )}
                    {t.dueDate && (
                      <span className={`text-sm ${overdue ? 'text-red' : 'text-muted'}`}>
                        {formatDistanceToNow(parseISO(t.dueDate), { addSuffix: true })}
                      </span>
                    )}
                    {overdue && <OverdueBadge />}
                  </div>
                </div>
                <div className="task-row-right">
                  <StatusBadge status={t.status} />
                  <select
                    className="status-select"
                    value={t.status}
                    disabled={updating === t._id}
                    onChange={(e) => handleStatusChange(t._id, e.target.value)}
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyTasks;
