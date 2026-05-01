import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getProjects, getTasksByProject, createTask, updateTask,
  addMember,
} from '../../api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, PriorityBadge, Spinner, EmptyState, OverdueBadge } from '../../components/common/Badges';
import Modal from '../../components/common/Modal';
import { formatDistanceToNow, isPast, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const STATUSES = ['Todo', 'In Progress', 'Done'];
const PRIORITIES = ['low', 'medium', 'high'];

const KanbanCol = ({ title, tasks, color, onTaskClick }) => (
  <div className="kanban-col">
    <div className="kanban-col-header" style={{ borderTopColor: color }}>
      <span className="kanban-col-title">{title}</span>
      <span className="kanban-col-count">{tasks.length}</span>
    </div>
    <div className="kanban-cards">
      {tasks.map((t) => {
        const overdue = t.dueDate && isPast(parseISO(t.dueDate)) && t.status !== 'Done';
        return (
          <div key={t._id} className={`kanban-card ${overdue ? 'kanban-card-overdue' : ''}`} onClick={() => onTaskClick(t)}>
            <div className="kanban-card-title">{t.title}</div>
            <div className="kanban-card-footer">
              <PriorityBadge priority={t.priority || 'medium'} />
              {t.assignedTo?.name && (
                <div className="assignee-chip">{t.assignedTo.name.split(' ')[0]}</div>
              )}
            </div>
            {overdue && <OverdueBadge />}
          </div>
        );
      })}
      {tasks.length === 0 && <div className="kanban-empty">Drop tasks here</div>}
    </div>
  </div>
);

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [project, setProject] = useState(null);
  const [allProjects, setAllProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('kanban'); // 'kanban' | 'list' | 'members'
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  // Task form
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', status: 'Todo', priority: 'medium',
    assignedTo: '', dueDate: '',
  });
  const [saving, setSaving] = useState(false);

  // Add member form
  const [memberUserId, setMemberUserId] = useState('');
  const [allUsers, setAllUsers] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        getProjects(),                      // GET /api/projects
        getTasksByProject(projectId),       // GET /api/tasks/:projectId
      ]);
      const proj = projRes.data.find((p) => p._id === projectId);
      if (!proj) { navigate('/projects'); return; }
      setProject(proj);
      setAllProjects(projRes.data);
      setTasks(taskRes.data);
    } catch {
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [projectId, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Build user pool from all project members across all projects (for add-member)
  useEffect(() => {
    if (allProjects.length) {
      const seen = new Set();
      const users = [];
      allProjects.forEach((p) =>
        (p.members || []).forEach((m) => {
          if (!seen.has(m._id)) { seen.add(m._id); users.push(m); }
        })
      );
      setAllUsers(users);
    }
  }, [allProjects]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return toast.error('Title required');
    setSaving(true);
    try {
      await createTask({         // POST /api/tasks
        title: taskForm.title,
        description: taskForm.description,
        project: projectId,      // backend field: project
        assignedTo: taskForm.assignedTo || undefined,
        dueDate: taskForm.dueDate || undefined,
        status: taskForm.status,
        priority: taskForm.priority,
      });
      toast.success('Task created!');
      setShowCreateModal(false);
      setTaskForm({ title: '', description: '', status: 'Todo', priority: 'medium', assignedTo: '', dueDate: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (taskId, status) => {
    try {
      await updateTask(taskId, { status }); // PUT /api/tasks/:id
      setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status } : t)));
      if (selectedTask?._id === taskId) setSelectedTask((t) => ({ ...t, status }));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update task');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberUserId) return toast.error('Select a user');
    try {
      await addMember(projectId, memberUserId); // POST /api/projects/:id/add-member
      toast.success('Member added!');
      setShowAddMember(false);
      setMemberUserId('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to add member');
    }
  };

  if (loading) return <div className="page-loading"><Spinner size={36} /></div>;
  if (!project) return null;

  const byStatus = (status) => tasks.filter((t) => t.status === status);
  const members = project.members || [];
  const nonMembers = allUsers.filter((u) => !members.find((m) => m._id === u._id));
  const isMember = members.find((m) => m._id === user?._id) || isAdmin;

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <button className="back-btn" onClick={() => navigate('/projects')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Projects
          </button>
          <div className="project-title-row">
            <div className="project-dot-lg" style={{ background: project.color || '#7c6af7' }} />
            <h1 className="page-title">{project.name}</h1>
          </div>
          {project.description && <p className="page-subtitle">{project.description}</p>}
        </div>
        {isMember && (
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>+ Add Task</button>
        )}
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {['kanban', 'list', 'members'].map((t) => (
          <button
            key={t}
            className={`tab-btn ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t !== 'members' && <span className="tab-count">{tasks.length}</span>}
            {t === 'members' && <span className="tab-count">{members.length}</span>}
          </button>
        ))}
      </div>

      {/* Kanban */}
      {tab === 'kanban' && (
        <div className="kanban-board">
          <KanbanCol title="To Do" tasks={byStatus('Todo')} color="#9090a8" onTaskClick={setSelectedTask} />
          <KanbanCol title="In Progress" tasks={byStatus('In Progress')} color="var(--blue)" onTaskClick={setSelectedTask} />
          <KanbanCol title="Done" tasks={byStatus('Done')} color="var(--green)" onTaskClick={setSelectedTask} />
        </div>
      )}

      {/* List */}
      {tab === 'list' && (
        <div className="task-table-wrap">
          {tasks.length === 0 ? (
            <EmptyState icon="✓" title="No tasks" subtitle="Add your first task to this project" />
          ) : (
            <table className="task-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assignee</th>
                  <th>Due</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => {
                  const overdue = t.dueDate && isPast(parseISO(t.dueDate)) && t.status !== 'Done';
                  return (
                    <tr key={t._id} className={overdue ? 'row-overdue' : ''} onClick={() => setSelectedTask(t)} style={{ cursor: 'pointer' }}>
                      <td>
                        <span className="task-table-title">{t.title}</span>
                        {overdue && <OverdueBadge />}
                      </td>
                      <td><StatusBadge status={t.status} /></td>
                      <td><PriorityBadge priority={t.priority || 'medium'} /></td>
                      <td>{t.assignedTo?.name || <span className="text-muted">—</span>}</td>
                      <td className={overdue ? 'text-red' : 'text-muted'}>
                        {t.dueDate ? formatDistanceToNow(parseISO(t.dueDate), { addSuffix: true }) : '—'}
                      </td>
                      <td>
                        <button className="btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setSelectedTask(t); }}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Members */}
      {tab === 'members' && (
        <div className="members-section">
          <div className="section-header">
            <h2 className="section-title">Members ({members.length})</h2>
            {isAdmin && nonMembers.length > 0 && (
              <button className="btn-primary btn-sm" onClick={() => setShowAddMember(true)}>+ Add Member</button>
            )}
          </div>
          <div className="members-grid">
            {members.map((m) => (
              <div key={m._id} className="member-card">
                <div className="member-card-avatar">
                  {(m.name || m.email || '?').slice(0, 2).toUpperCase()}
                </div>
                <div className="member-card-info">
                  <span className="member-card-name">{m.name || '—'}</span>
                  <span className="member-card-email">{m.email}</span>
                </div>
                <span className={`badge ${m.role === 'Admin' ? 'badge-admin' : 'badge-member'}`}>{m.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task detail / edit modal */}
      <Modal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} title="Task Details">
        {selectedTask && (
          <div className="task-detail">
            <h3 className="task-detail-title">{selectedTask.title}</h3>
            {selectedTask.description && <p className="task-detail-desc">{selectedTask.description}</p>}
            <div className="task-detail-meta">
              <div><span className="meta-label">Status</span><StatusBadge status={selectedTask.status} /></div>
              <div><span className="meta-label">Priority</span><PriorityBadge priority={selectedTask.priority || 'medium'} /></div>
              {selectedTask.assignedTo?.name && (
                <div><span className="meta-label">Assignee</span><span>{selectedTask.assignedTo.name}</span></div>
              )}
              {selectedTask.dueDate && (
                <div>
                  <span className="meta-label">Due</span>
                  <span className={isPast(parseISO(selectedTask.dueDate)) && selectedTask.status !== 'Done' ? 'text-red' : ''}>
                    {new Date(selectedTask.dueDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            {isMember && (
              <div className="task-detail-actions">
                <span className="meta-label">Update Status</span>
                <div className="status-buttons">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      className={`status-btn ${selectedTask.status === s ? 'active' : ''}`}
                      onClick={() => handleUpdateStatus(selectedTask._id, s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Task Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Task">
        <form className="modal-form" onSubmit={handleCreateTask}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" type="text" placeholder="Task title" value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input form-textarea" placeholder="Optional details"
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={taskForm.status}
                onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input" value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Assign To</label>
              <select className="form-input" value={taskForm.assignedTo}
                onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}>
                <option value="">Unassigned</option>
                {members.map((m) => <option key={m._id} value={m._id}>{m.name || m.email}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input className="form-input" type="date" value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={() => setShowCreateModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="Add Member">
        <form className="modal-form" onSubmit={handleAddMember}>
          <div className="form-group">
            <label className="form-label">Select User</label>
            <select className="form-input" value={memberUserId}
              onChange={(e) => setMemberUserId(e.target.value)}>
              <option value="">Choose a user…</option>
              {nonMembers.map((u) => (
                <option key={u._id} value={u._id}>{u.name || u.email} ({u.role})</option>
              ))}
            </select>
          </div>
          {nonMembers.length === 0 && (
            <p className="text-muted text-sm">All available users are already members.</p>
          )}
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={() => setShowAddMember(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={!memberUserId}>Add Member</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectDetail;
