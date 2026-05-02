import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProjects, createProject } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import "./Projects.css";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";

  const fetchProjects = () => {
    getProjects()
      .then((res) => setProjects(res.data.projects))
      .catch(() => addToast("Failed to load projects", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []); // eslint-disable-line

  if (loading) return <ProjectsSkeleton />;

  return (
    <div className="fade-in">
      <div className="projects-header">
        <div>
          <h1 className="page-title">{isAdmin ? "Projects" : "My Projects"}</h1>
          <p className="page-subtitle">
            {projects.length} {isAdmin ? "active" : "assigned"} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isAdmin && (
          <button id="create-project-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
            + New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="glass-card-static empty-state">
          <div className="empty-state-icon">{isAdmin ? "🚀" : "📂"}</div>
          <div className="empty-state-title">
            {isAdmin ? "No projects yet" : "No projects assigned"}
          </div>
          <div className="empty-state-text">
            {isAdmin
              ? "Create your first project to start organizing tasks"
              : "You'll see projects here once an admin adds you as a member"}
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Project</button>
          )}
        </div>
      ) : (
        <div className="projects-grid stagger-children">
          {projects.map((p) => (
            <div key={p.id} className="glass-card project-card fade-in-up" onClick={() => navigate(`/projects/${p.id}`)}>
              <div className="project-card-header">
                <div className="project-card-name">{p.name}</div>
              </div>
              <div className="project-card-desc">{p.description || "No description"}</div>
              <div className="project-card-footer">
                <div className="project-members">
                  {(p.members_data || []).slice(0, 4).map((m) => (
                    <div key={m.id} className="project-member-avatar" style={{ background: m.avatar_color }} title={m.username}>
                      {m.username?.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {(p.members_data || []).length > 4 && (
                    <div className="project-member-more">+{p.members_data.length - 4}</div>
                  )}
                </div>
                <div className="project-progress">
                  <div className="project-progress-bar-bg">
                    <div className="project-progress-bar-fill" style={{ width: `${p.task_stats?.progress || 0}%` }}></div>
                  </div>
                  <span className="project-progress-text">{p.task_stats?.progress || 0}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CreateProjectModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); fetchProjects(); }}
        />
      )}
    </div>
  );
}

function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      await createProject(form);
      addToast("Project created!", "success");
      onCreated();
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to create project", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Create New Project</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Project Name</label>
            <input id="project-name-input" className="form-input" placeholder="e.g. Website Redesign" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea id="project-desc-input" className="form-input" rows={3} placeholder="Brief project description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="project-submit-btn" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProjectsSkeleton() {
  return (
    <div>
      <div className="projects-header">
        <div><div className="skeleton skeleton-title" style={{ width: 180 }}></div></div>
      </div>
      <div className="projects-grid">
        {[1, 2, 3].map((i) => (<div key={i} className="skeleton skeleton-card" style={{ height: 180 }}></div>))}
      </div>
    </div>
  );
}
