import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { getProfile } from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("pulseboard_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("pulseboard_token"));
  const [loading, setLoading] = useState(true);

  const saveAuth = useCallback((tokenVal, userVal) => {
    localStorage.setItem("pulseboard_token", tokenVal);
    localStorage.setItem("pulseboard_user", JSON.stringify(userVal));
    setToken(tokenVal);
    setUser(userVal);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("pulseboard_token");
    localStorage.removeItem("pulseboard_user");
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (token) {
      getProfile()
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem("pulseboard_user", JSON.stringify(res.data.user));
        })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token, logout]);

  return (
    <AuthContext.Provider value={{ user, token, loading, saveAuth, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
