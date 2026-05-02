import React from "react";
import { Link } from "react-router-dom";
import "./Auth.css";

export default function RoleSelect() {
  return (
    <div className="auth-page">
      <div className="role-select-container">
        <div className="role-select-header">
          <div className="auth-logo-icon">P</div>
          <h1 className="role-select-title">Welcome to PulseBoard</h1>
          <p className="role-select-subtitle">Select your role to continue</p>
        </div>

        <div className="role-cards">
          <Link to="/login/admin" className="role-card role-card-admin">
            <div className="role-card-glow"></div>
            <div className="role-card-icon-wrapper role-icon-admin">
              <span className="role-card-icon">⛊</span>
            </div>
            <h2 className="role-card-title">Admin</h2>
            <p className="role-card-desc">
              Full access to manage projects, teams, tasks, and system settings
            </p>
            <ul className="role-card-features">
              <li><span className="role-feature-dot admin-dot"></span>Create & delete projects</li>
              <li><span className="role-feature-dot admin-dot"></span>Manage team members</li>
              <li><span className="role-feature-dot admin-dot"></span>Assign & delete tasks</li>
              <li><span className="role-feature-dot admin-dot"></span>Global dashboard stats</li>
            </ul>
            <div className="role-card-action">
              Sign in as Admin <span className="role-arrow">→</span>
            </div>
          </Link>

          <Link to="/login/member" className="role-card role-card-member">
            <div className="role-card-glow"></div>
            <div className="role-card-icon-wrapper role-icon-member">
              <span className="role-card-icon">◉</span>
            </div>
            <h2 className="role-card-title">Member</h2>
            <p className="role-card-desc">
              View assigned tasks, update progress, and collaborate with your team
            </p>
            <ul className="role-card-features">
              <li><span className="role-feature-dot member-dot"></span>View assigned projects</li>
              <li><span className="role-feature-dot member-dot"></span>Update task status</li>
              <li><span className="role-feature-dot member-dot"></span>Track personal progress</li>
              <li><span className="role-feature-dot member-dot"></span>Personal dashboard</li>
            </ul>
            <div className="role-card-action">
              Sign in as Member <span className="role-arrow">→</span>
            </div>
          </Link>
        </div>

        <div className="auth-footer" style={{ marginTop: 32, textAlign: "center" }}>
          Don't have an account? <Link to="/signup">Create one</Link>
        </div>
      </div>
    </div>
  );
}
