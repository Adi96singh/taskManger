import React, { useState, useEffect } from "react";
import { getMyTasks, updateTask } from "../../api/api";
import { useToast } from "../../context/ToastContext";
import "../Projects/Projects.css";

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { addToast } = useToast();

  useEffect(() => {
    getMyTasks()
      .then((res) => setTasks(res.data.tasks))
      .catch(() => addToast("Failed to load tasks", "error"))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
      addToast("Task updated", "success");
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to update", "error");
    }
  };

  if (loading) {
    return (
      <div>
        <div className="skeleton skeleton-title" style={{ width: 200 }}></div>
        {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton skeleton-card" style={{ height: 80, marginTop: 12 }}></div>)}
      </div>
    );
  }

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
    overdue: tasks.filter((t) => t.is_overdue).length,
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">My Tasks</h1>
        <p className="page-subtitle">{stats.total} task{stats.total !== 1 ? "s" : ""} assigned to you</p>
      </div>

      {/* Mini stat bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <MiniStat label="To Do" value={stats.todo} color="var(--text-muted)" />
        <MiniStat label="In Progress" value={stats.in_progress} color="var(--neon-cyan)" />
        <MiniStat label="Done" value={stats.done} color="#22c55e" />
        {stats.overdue > 0 && <MiniStat label="Overdue" value={stats.overdue} color="var(--neon-red)" />}
      </div>

      {/* Filter */}
      <div className="task-filters">
        {["all", "todo", "in_progress", "done"].map((s) => (
          <button key={s} className={`filter-chip ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>
            {s === "all" ? "All" : s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card-static empty-state">
          <div className="empty-state-icon">✨</div>
          <div className="empty-state-title">{filter === "all" ? "No tasks assigned" : `No ${filter.replace("_", " ")} tasks`}</div>
          <div className="empty-state-text">Tasks assigned to you will appear here</div>
        </div>
      ) : (
        <div className="stagger-children">
          {filtered.map((t) => {
            const nextStatus = { todo: "in_progress", in_progress: "done", done: "todo" };
            return (
              <div key={t.id} className={`glass-card task-card fade-in-up ${t.is_overdue ? "overdue" : ""}`} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div className="task-card-title">{t.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                      {t.project_name} • <span className={`priority-${t.priority}`}>{t.priority}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className={`status-badge status-${t.status}`}>
                      {t.status === "in_progress" ? "In Progress" : t.status}
                    </span>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => { e.stopPropagation(); handleStatusChange(t.id, nextStatus[t.status]); }}
                      title={`Move to ${nextStatus[t.status]}`}
                    >
                      {t.status === "done" ? "↩" : "→"}
                    </button>
                  </div>
                </div>
                {t.deadline && (
                  <div style={{ marginTop: 8, fontSize: 12, color: t.is_overdue ? "var(--neon-red)" : "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    {t.is_overdue ? "⚠ Overdue • " : "Due: "}{formatDate(t.deadline)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div className="glass-card-static" style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}66` }}></div>
      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-bright)", fontFamily: "var(--font-mono)" }}>{value}</span>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
