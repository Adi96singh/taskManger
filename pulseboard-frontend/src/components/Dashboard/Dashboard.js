import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboard } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import ProgressRing from "../common/ProgressRing";
import "./Dashboard.css";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data.dashboard))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  const d = data || {};

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">
          {isAdmin ? "Admin Command Center" : "My Dashboard"}
        </h1>
        <p className="page-subtitle">
          {isAdmin
            ? "Global project intelligence overview — full admin access"
            : "Your personal task overview and progress tracker"}
        </p>
        {isAdmin && (
          <span className="dashboard-role-tag admin-tag">⛊ Admin View</span>
        )}
        {!isAdmin && (
          <span className="dashboard-role-tag member-tag">◉ Member View</span>
        )}
      </div>

      <div className="dashboard-stats stagger-children">
        {isAdmin ? (
          <>
            {/* Admin sees global stats */}
            <div className="glass-card stat-card stat-total fade-in-up">
              <div className="stat-header">
                <div className="stat-icon">◈</div>
              </div>
              <div className="stat-value">{d.total_tasks || 0}</div>
              <div className="stat-label">Total Tasks (All Projects)</div>
            </div>

            <div className="glass-card stat-card stat-done fade-in-up">
              <div className="stat-header">
                <div className="stat-icon">✓</div>
              </div>
              <div className="stat-value">{d.completed || 0}</div>
              <div className="stat-label">Completed</div>
            </div>

            <div className="glass-card stat-card stat-progress fade-in-up">
              <div className="stat-header">
                <div className="stat-icon">⟳</div>
              </div>
              <div className="stat-value">{d.in_progress || 0}</div>
              <div className="stat-label">In Progress</div>
            </div>

            <div className={`glass-card stat-card stat-overdue fade-in-up ${d.overdue > 0 ? "overdue-glow" : ""}`}>
              <div className="stat-header">
                <div className="stat-icon">⚠</div>
              </div>
              <div className="stat-value">{d.overdue || 0}</div>
              <div className="stat-label">Overdue</div>
            </div>
          </>
        ) : (
          <>
            {/* Member sees personal stats */}
            <div className="glass-card stat-card stat-total fade-in-up">
              <div className="stat-header">
                <div className="stat-icon">◈</div>
              </div>
              <div className="stat-value">{d.my_tasks || 0}</div>
              <div className="stat-label">My Tasks</div>
            </div>

            <div className="glass-card stat-card stat-done fade-in-up">
              <div className="stat-header">
                <div className="stat-icon">✓</div>
              </div>
              <div className="stat-value">{d.my_completed || 0}</div>
              <div className="stat-label">My Completed</div>
            </div>

            <div className="glass-card stat-card stat-progress fade-in-up">
              <div className="stat-header">
                <div className="stat-icon">⟳</div>
              </div>
              <div className="stat-value">{d.in_progress || 0}</div>
              <div className="stat-label">In Progress</div>
            </div>

            <div className={`glass-card stat-card stat-overdue fade-in-up ${d.my_overdue > 0 ? "overdue-glow" : ""}`}>
              <div className="stat-header">
                <div className="stat-icon">⚠</div>
              </div>
              <div className="stat-value">{d.my_overdue || 0}</div>
              <div className="stat-label">My Overdue</div>
            </div>
          </>
        )}
      </div>

      <div className="dashboard-grid">
        <div className="glass-card-static recent-tasks-panel fade-in-up">
          <div className="recent-tasks-header">
            <span className="recent-tasks-title">
              {isAdmin ? "Recent Activity (All Projects)" : "My Recent Activity"}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate("/my-tasks")}>
              View All →
            </button>
          </div>
          {d.recent_tasks?.length > 0 ? (
            d.recent_tasks.map((task) => (
              <div key={task.id} className="recent-task-item" onClick={() => navigate(`/projects/${task.project_id}`)}>
                <div className={`recent-task-status-dot ${task.status}`}></div>
                <div className="recent-task-info">
                  <div className="recent-task-name">{task.title}</div>
                  <div className="recent-task-project">{task.project_name}</div>
                </div>
                <div className="recent-task-meta">
                  <div className={`recent-task-priority priority-${task.priority}`}>{task.priority}</div>
                  {task.deadline && (
                    <div className={`recent-task-deadline ${task.is_overdue ? "overdue-text" : ""}`}>
                      {task.is_overdue ? "Overdue" : formatDate(task.deadline)}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">No tasks yet</div>
              <div className="empty-state-text">
                {isAdmin
                  ? "Create a project and add tasks to get started"
                  : "Tasks assigned to you will appear here"}
              </div>
            </div>
          )}
        </div>

        <div className="glass-card-static progress-panel fade-in-up">
          <div className="progress-panel-title">
            {isAdmin ? "Global Completion Rate" : "My Completion Rate"}
          </div>
          <div className="progress-ring-wrapper">
            <ProgressRing percentage={d.completion_rate || 0} size={160} strokeWidth={10} />
          </div>
          <div className="progress-stats-row">
            <div className="progress-stat-item">
              <div className="progress-stat-value">{d.total_projects || 0}</div>
              <div className="progress-stat-label">Projects</div>
            </div>
            <div className="progress-stat-item">
              <div className="progress-stat-value">{d.my_tasks || 0}</div>
              <div className="progress-stat-label">My Tasks</div>
            </div>
            <div className="progress-stat-item">
              <div className="progress-stat-value">{d.my_completed || 0}</div>
              <div className="progress-stat-label">My Done</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function DashboardSkeleton() {
  return (
    <div>
      <div className="page-header">
        <div className="skeleton skeleton-title" style={{ width: 240 }}></div>
        <div className="skeleton skeleton-text" style={{ width: 320 }}></div>
      </div>
      <div className="dashboard-stats">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton skeleton-card" style={{ height: 130 }}></div>
        ))}
      </div>
      <div className="dashboard-grid">
        <div className="skeleton skeleton-card" style={{ height: 360 }}></div>
        <div className="skeleton skeleton-card" style={{ height: 360 }}></div>
      </div>
    </div>
  );
}
