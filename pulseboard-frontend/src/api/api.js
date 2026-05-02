import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pulseboard_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("pulseboard_token");
      localStorage.removeItem("pulseboard_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// Auth
export const signup = (data) => api.post("/auth/signup", data);
export const login = (data) => api.post("/auth/login", data);
export const getProfile = () => api.get("/auth/me");
export const getAllUsers = () => api.get("/auth/users");

// Projects
export const createProject = (data) => api.post("/projects", data);
export const getProjects = () => api.get("/projects");
export const getProject = (id) => api.get(`/projects/${id}`);
export const deleteProject = (id) => api.delete(`/projects/${id}`);
export const addMember = (projectId, email) =>
  api.post(`/projects/${projectId}/members`, { email });
export const removeMember = (projectId, memberId) =>
  api.delete(`/projects/${projectId}/members/${memberId}`);

// Tasks
export const createTask = (projectId, data) =>
  api.post(`/tasks/project/${projectId}`, data);
export const getProjectTasks = (projectId, params = {}) =>
  api.get(`/tasks/project/${projectId}`, { params });
export const updateTask = (taskId, data) => api.put(`/tasks/${taskId}`, data);
export const deleteTask = (taskId) => api.delete(`/tasks/${taskId}`);
export const getMyTasks = (params = {}) => api.get("/tasks/my", { params });
export const getDashboard = () => api.get("/tasks/dashboard");

export default api;
