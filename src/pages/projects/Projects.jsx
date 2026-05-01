import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects, createProject } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Spinner, EmptyState } from '../../components/common/Badges';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const COLORS = ['#7c6af7', '#3ecf8e', '#f5a623', '#4fa3e8', '#e05252', '#c77df5', '#f56d7c', '#14b8a6'];

const ProjectCard = ({ project, onClick }) => {
  const memberCount = project.members?.length ?? 0;
  return (
    <div className="project-card" onClick={onClick}>
      <div className="project-card-header">
        <div className="project-color-dot" style={{ background: project.color || '#7c6af7' }} />
        <h3 className="project-card-name">{project.name}</h3>
      </div>
      {project.description && (
        <p className="project-card-desc">{project.description}</p>
      )}
      <div className="project-card-footer">
        <div className="project-members-stack">
          {(project.members || []).slice(0, 4).map((m, i) => (
            <div
              key={m._id || i}
              className="member-avatar-sm"
              title={m.name}
              style={{ zIndex: 4 - i }}
            >
              {(m.name || m.email || '?').slice(0, 2).toUpperCase()}
            </div>
          ))}
          {memberCount > 4 && (
            <div className="member-avatar-sm member-avatar-more">+{memberCount - 4}</div>
          )}
        </div>
        <span className="project-card-meta">{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
};

const Projects = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: COLORS[0] });
  const [creating, setCreating] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await getProjects(); // GET /api/projects
      setProjects(res.data);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Project name is required');
    setCreating(true);
    try {
      await createProject(form); // POST /api/projects
      toast.success('Project created!');
      setShowModal(false);
      setForm({ name: '', description: '', color: COLORS[0] });
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="page-loading"><Spinner size={36} /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
        )}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon="📁"
          title="No projects yet"
          subtitle={isAdmin 
  ? "Create your first project to get started" 
  : "You haven't been added to any projects yet"
}
          action={isAdmin && (
            <button className="btn-primary" onClick={() => setShowModal(true)}>+ Create Project</button>
          )}
        />
      ) : (
        <div className="projects-grid">
          {projects.map((p) => (
            <ProjectCard
              key={p._id}
              project={p}
              onClick={() => navigate(`/projects/${p._id}`)}
            />
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Project">
        <form className="modal-form" onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. Website Redesign"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input form-textarea"
              placeholder="What is this project about?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <div className="color-picker">
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  className={`color-swatch ${form.color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setForm({ ...form, color: c })}
                />
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Projects;
