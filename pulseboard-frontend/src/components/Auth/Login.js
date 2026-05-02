import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { login as loginApi } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import "./Auth.css";

export default function Login() {
  const { role } = useParams();
  const expectedRole = role === "admin" ? "admin" : "member";
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { saveAuth } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const isAdmin = expectedRole === "admin";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await loginApi(form);
      const user = res.data.user;

      // Validate that the user's actual role matches the selected portal
      if (user.role !== expectedRole) {
        setError(
          expectedRole === "admin"
            ? "Access denied. This account does not have admin privileges."
            : "This account has admin privileges. Please use the Admin login."
        );
        setLoading(false);
        return;
      }

      saveAuth(res.data.token, user);
      addToast(`Welcome back, ${user.username}!`, "success");
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <div className={`auth-logo-icon ${isAdmin ? "auth-logo-admin" : "auth-logo-member"}`}>
              {isAdmin ? "⛊" : "◉"}
            </div>
            <div className="auth-logo-title">
              {isAdmin ? "Admin Login" : "Member Login"}
            </div>
            <div className="auth-logo-subtitle">
              {isAdmin
                ? "Sign in with admin credentials"
                : "Sign in to access your tasks"}
            </div>
            <div className={`auth-role-badge ${isAdmin ? "badge-admin" : "badge-member"}`}>
              {isAdmin ? "🔒 Admin Portal" : "👤 Member Portal"}
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                id="login-password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button id="login-submit" type="submit" className={`btn ${isAdmin ? "btn-admin" : "btn-primary"}`} disabled={loading}>
              {loading ? "Signing in..." : `Sign In as ${isAdmin ? "Admin" : "Member"}`}
            </button>
          </form>

          <div className="auth-footer">
            <Link to="/login" className="auth-switch-role">← Choose different role</Link>
          </div>
          <div className="auth-footer">
            Don't have an account? <Link to="/signup">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
