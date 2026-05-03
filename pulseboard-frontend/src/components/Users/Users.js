import React, { useState, useEffect } from "react";
import { getAllUsers, updateUserRole } from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import "./Users.css";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const { user } = useAuth();

  const fetchUsers = () => {
    setLoading(true);
    getAllUsers()
      .then((res) => setUsers(res.data.users))
      .catch(() => addToast("Failed to load users", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []); // eslint-disable-line

  const handleRoleChange = async (userId, currentRole) => {
    const newRole = currentRole === "admin" ? "member" : "admin";
    try {
      await updateUserRole(userId, newRole);
      addToast(`Role updated successfully to ${newRole}`, "success");
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to update role", "error");
    }
  };

  if (loading) return <div className="page-container"><p>Loading users...</p></div>;

  return (
    <div className="fade-in users-page">
      <div className="projects-header">
        <div>
          <h1 className="page-title">Team Management</h1>
          <p className="page-subtitle">Manage member access and roles</p>
        </div>
      </div>

      <div className="users-list stagger-children">
        {users.map((u) => (
          <div key={u.id} className="glass-card user-card fade-in-up">
            <div className="user-info">
              <div
                className="user-avatar"
                style={{ background: u.avatar_color || "var(--gradient-primary)" }}
              >
                {u.username?.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <div className="user-name">{u.username}</div>
                <div className="user-email">{u.email}</div>
              </div>
            </div>
            
            <div className="user-actions">
              <span className={`role-badge ${u.role === "admin" ? "badge-admin" : "badge-member"}`}>
                {u.role.toUpperCase()}
              </span>
              
              {u.email !== "admin@gmail.com" && u.id !== user.id && (
                <button
                  className={`btn ${u.role === "admin" ? "btn-secondary" : "btn-primary"} btn-sm ml-3`}
                  onClick={() => handleRoleChange(u.id, u.role)}
                >
                  {u.role === "admin" ? "Revoke Admin" : "Grant Admin"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
