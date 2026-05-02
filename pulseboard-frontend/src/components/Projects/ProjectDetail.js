import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getProject, deleteProject, addMember, removeMember,
  getProjectTasks, createTask, updateTask, deleteTask
} from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import "./Projects.css";

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);

  const isAdmin = user?.role === "admin";
  const isOwner = project?.owner_id === user?.id;
  // Admin or owner can manage the project
  const canManage = isAdmin || isOwner;

  const fetchData = useCallback(() => {
    Promise.all([
      getProject(projectId),
      getProjectTasks(projectId)
    ])
      .then(([projRes, tasksRes]) => {
        setProject(projRes.data.project);
        setTasks(tasksRes.data.tasks);
      })
      .catch(() => addToast("Failed to load project", "error"))
      .finally(() => setLoading(false));
  }, [projectId, addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDeleteProject = async () => {
    if (!window.confirm("Delete this project and all its tasks?")) return;
    try {
      await deleteProject(projectId);
      addToast("Project deleted", "success");
      navigate("/projects");
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to delete", "error");
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
      addToast("Task updated", "success");
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to update", "error");
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      addToast("Task deleted", "success");
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to delete", "error");
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Remove this member?")) return;
    try {
      const res = await removeMember(projectId, memberId);
      setProject(res.data.project);
      addToast("Member removed", "success");
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to remove", "error");
    }
  };

  if (loading) {
    return (
      <div>
        <div className="skeleton skeleton-title" style={{ width: 240 }}></div>
        <div className="skeleton skeleton-card" style={{ height: 60, marginTop: 20, marginBottom: 20 }}></div>
        <div className="task-columns">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton skeleton-card" style={{ height: 300 }}></div>)}
        </div>
      </div>
    );
  }

  if (!project) return <div className="empty-state"><div className="empty-state-title">Project not found</div></div>;

  // Filter tasks
  const filtered = tasks.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const todoTasks = filtered.filter((t) => t.status === "todo");
  const inProgressTasks = filtered.filter((t) => t.status === "in_progress");
  const doneTasks = filtered.filter((t) => t.status === "done");

  return (
    <div className="fade-in">
      <div className="project-detail-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("/projects")} style={{ marginBottom: 8 }}>← Back</button>
          <h1 className="page-title">{project.name}</h1>
          {project.description && <p className="page-subtitle">{project.description}</p>}
        </div>
        <div className="project-detail-actions">
          {/* Only admin/owner can manage members and delete project */}
          {canManage && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowMemberModal(true)}>+ Add Member</button>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>Delete Project</button>
            </>
          )}
          {/* Admin can create tasks; members can also create tasks if they are project members */}
          {(isAdmin || project.members?.includes(user?.id)) && (
            <button id="add-task-btn" className="btn btn-primary btn-sm" onClick={() => setShowTaskModal(true)}>+ New Task</button>
          )}
        </div>
      </div>

      {/* Members Bar */}
      <div className="glass-card-static project-members-bar">
        <span className="members-label">Team:</span>
        {(project.members_data || []).map((m) => (
          <div key={m.id} className="member-chip">
            <div className="member-chip-avatar" style={{ background: m.avatar_color }}>{m.username?.charAt(0).toUpperCase()}</div>
            {m.username}
            {/* Only admin/owner can remove members (never the owner themselves) */}
            {canManage && m.id !== project.owner_id && (
              <span className="member-chip-remove" onClick={() => handleRemoveMember(m.id)}>×</span>
            )}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="task-filters">
        {["all", "todo", "in_progress", "done"].map((s) => (
          <button key={s} className={`filter-chip ${statusFilter === s ? "active" : ""}`} onClick={() => setStatusFilter(s)}>
            {s === "all" ? "All" : s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <div className="task-search">
          <input className="form-input" placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Task Columns */}
      <div className="task-columns">
        <TaskColumn title="To Do" status="todo" tasks={todoTasks} onStatusChange={handleStatusChange} onDelete={handleDeleteTask} canManage={canManage} isAdmin={isAdmin} userId={user?.id} />
        <TaskColumn title="In Progress" status="in_progress" tasks={inProgressTasks} onStatusChange={handleStatusChange} onDelete={handleDeleteTask} canManage={canManage} isAdmin={isAdmin} userId={user?.id} />
        <TaskColumn title="Done" status="done" tasks={doneTasks} onStatusChange={handleStatusChange} onDelete={handleDeleteTask} canManage={canManage} isAdmin={isAdmin} userId={user?.id} />
      </div>

      {showTaskModal && (
        <CreateTaskModal
          members={project.members_data || []}
          onClose={() => setShowTaskModal(false)}
          onCreated={() => { setShowTaskModal(false); fetchData(); }}
          projectId={projectId}
        />
      )}

      {showMemberModal && (
        <AddMemberModal
          projectId={projectId}
          onClose={() => setShowMemberModal(false)}
          onAdded={(p) => { setShowMemberModal(false); setProject(p); }}
        />
      )}
    </div>
  );
}

function TaskColumn({ title, status, tasks, onStatusChange, onDelete, canManage, isAdmin, userId }) {
  const nextStatus = { todo: "in_progress", in_progress: "done", done: "todo" };
  return (
    <div className="task-column">
      <div className="task-column-header">
        <div className={`task-column-dot ${status}`}></div>
        <span className="task-column-title">{title}</span>
        <span className="task-column-count">{tasks.length}</span>
      </div>
      {tasks.map((t) => {
        // Members can only move their own tasks; admin/owner can move any task
        const isAssignee = t.assigned_to === userId;
        const canChangeStatus = canManage || isAdmin || isAssignee;
        const canDeleteTask = canManage || isAdmin;

        return (
          <div key={t.id} className={`task-card ${t.is_overdue ? "overdue" : ""}`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div className="task-card-title">{t.title}</div>
              <div className="task-card-actions">
                {canChangeStatus && (
                  <button className="task-action-btn" onClick={() => onStatusChange(t.id, nextStatus[status])} title={`Move to ${nextStatus[status]}`}>
                    {status === "done" ? "↩" : "→"}
                  </button>
                )}
                {canDeleteTask && (
                  <button className="task-action-btn delete" onClick={() => onDelete(t.id)} title="Delete">✕</button>
                )}
              </div>
            </div>
            <div className="task-card-meta">
              <div className="task-card-assignee">
                <div className={`task-card-priority-dot ${t.priority}`}></div>
                {t.assignee && (
                  <>
                    <div className="task-card-assignee-avatar" style={{ background: t.assignee.avatar_color }}>
                      {t.assignee.username?.charAt(0).toUpperCase()}
                    </div>
                    {t.assignee.username}
                  </>
                )}
              </div>
              {t.deadline && (
                <span className={`task-card-deadline ${t.is_overdue ? "overdue-text" : ""}`}>
                  {t.is_overdue ? "⚠ Overdue" : formatDate(t.deadline)}
                </span>
              )}
            </div>
          </div>
        );
      })}
      {tasks.length === 0 && (
        <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted)", fontSize: 13 }}>
          No tasks
        </div>
      )}
    </div>
  );
}

function CreateTaskModal({ members, onClose, onCreated, projectId }) {
  const [form, setForm] = useState({ title: "", description: "", assigned_to: "", deadline: "", priority: "medium" });
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.assigned_to) return;
    setLoading(true);
    const payload = { ...form };
    if (payload.deadline) {
      payload.deadline = new Date(payload.deadline).toISOString();
    } else {
      delete payload.deadline;
    }
    try {
      await createTask(projectId, payload);
      addToast("Task created!", "success");
      onCreated();
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to create task", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Create Task</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input id="task-title-input" className="form-input" placeholder="Task title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={2} placeholder="Optional description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Assign To</label>
            <select id="task-assignee-select" className="form-select" value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} required>
              <option value="">Select member</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.username}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input type="datetime-local" className="form-input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="task-submit-btn" type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Creating..." : "Create Task"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMemberModal({ projectId, onClose, onAdded }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await addMember(projectId, email);
      addToast(res.data.message, "success");
      onAdded(res.data.project);
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to add member", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Add Team Member</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Member Email</label>
            <input id="member-email-input" className="form-input" type="email" placeholder="teammate@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="member-submit-btn" type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Adding..." : "Add Member"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
