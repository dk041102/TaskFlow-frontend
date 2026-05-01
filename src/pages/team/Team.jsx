import React, { useEffect, useState } from 'react';
import { getProjects, getTasksByProject } from '../../api';
import { RoleBadge, Spinner, EmptyState } from '../../components/common/Badges';
import toast from 'react-hot-toast';

const Team = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const projRes = await getProjects();
        const projects = projRes.data;

        // Aggregate unique users across all projects
        const userMap = new Map();
        projects.forEach((p) => {
          (p.members || []).forEach((m) => {
            if (!userMap.has(m._id)) {
              userMap.set(m._id, { ...m, projectNames: [] });
            }
            userMap.get(m._id).projectNames.push(p.name);
          });
        });

        // Fetch tasks to compute per-user stats
        const taskResults = await Promise.all(
          projects.map((p) => getTasksByProject(p._id).catch(() => ({ data: [] })))
        );
        const allTasks = taskResults.flatMap((r) => r.data || []);

        const membersWithStats = Array.from(userMap.values()).map((u) => {
          const myTasks = allTasks.filter(
            (t) => t.assignedTo?._id === u._id || t.assignedTo === u._id
          );
          return {
            ...u,
            total: myTasks.length,
            done: myTasks.filter((t) => t.status === 'Done').length,
            inProgress: myTasks.filter((t) => t.status === 'In Progress').length,
          };
        });

        setMembers(membersWithStats);
      } catch {
        toast.error('Failed to load team');
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  if (loading) return <div className="page-loading"><Spinner size={36} /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {members.length === 0 ? (
        <EmptyState icon="👥" title="No team members" subtitle="Members will appear when added to projects" />
      ) : (
        <div className="team-grid">
          {members.map((m) => {
            const initials = (m.name || m.email || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
            const completion = m.total ? Math.round((m.done / m.total) * 100) : 0;
            return (
              <div key={m._id} className="team-card">
                <div className="team-card-header">
                  <div className="team-avatar">{initials}</div>
                  <div className="team-info">
                    <div className="team-name">{m.name || '—'}</div>
                    <div className="team-email">{m.email}</div>
                  </div>
                  <RoleBadge role={m.role} />
                </div>

                <div className="team-stats">
                  <div className="team-stat">
                    <span className="team-stat-value">{m.total}</span>
                    <span className="team-stat-label">Tasks</span>
                  </div>
                  <div className="team-stat">
                    <span className="team-stat-value text-blue">{m.inProgress}</span>
                    <span className="team-stat-label">Active</span>
                  </div>
                  <div className="team-stat">
                    <span className="team-stat-value text-green">{m.done}</span>
                    <span className="team-stat-label">Done</span>
                  </div>
                  <div className="team-stat">
                    <span className="team-stat-value">{completion}%</span>
                    <span className="team-stat-label">Complete</span>
                  </div>
                </div>

                <div className="team-progress">
                  <div className="team-progress-bar">
                    <div className="team-progress-fill" style={{ width: `${completion}%` }} />
                  </div>
                </div>

                {m.projectNames.length > 0 && (
                  <div className="team-projects">
                    {m.projectNames.map((name) => (
                      <span key={name} className="team-project-chip">{name}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Team;
