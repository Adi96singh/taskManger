import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Layout.css";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initial = user?.username?.charAt(0).toUpperCase() || "U";
  const isAdmin = user?.role === "admin";

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">P</div>
          <span className="sidebar-logo-text">PulseBoard</span>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>
          <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
            <span className="sidebar-link-icon">◈</span>
            Dashboard
          </NavLink>

          {isAdmin && (
            <NavLink to="/projects" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
              <span className="sidebar-link-icon">▦</span>
              Projects
            </NavLink>
          )}

          <NavLink to="/my-tasks" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
            <span className="sidebar-link-icon">✦</span>
            My Tasks
          </NavLink>

          {!isAdmin && (
            <NavLink to="/projects" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
              <span className="sidebar-link-icon">▦</span>
              My Projects
            </NavLink>
          )}

          <div className="sidebar-section-label">Account</div>
          <div className="sidebar-stats">
            <div className="sidebar-stat-item">
              <span className={`sidebar-stat-dot ${isAdmin ? "dot-purple" : "dot-cyan"}`}></span>
              <span>{isAdmin ? "Admin Access" : "Member Access"}</span>
            </div>
            <div className="sidebar-stat-item">
              <span className="sidebar-stat-dot dot-cyan"></span>
              <span>Active Projects</span>
            </div>
          </div>
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-avatar" style={{ background: user?.avatar_color || "var(--gradient-primary)" }}>
            {initial}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-username">{user?.username}</div>
            <div className="sidebar-role">
              <span className={`role-indicator ${isAdmin ? "role-admin" : "role-member"}`}>
                {user?.role}
              </span>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout} title="Logout">
            ⏻
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
