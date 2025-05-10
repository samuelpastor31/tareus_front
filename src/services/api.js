import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api", // proxy in vite.config.js
  withCredentials: false,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export { apiClient };

export default class ApiClient {
  projects() {
    return {
      getProjects: () => apiClient.get("/projects"),
      getProject: (id) => apiClient.get("/projects/" + id),
      addProject: (project) => apiClient.post("/projects", project),
      removeProject: (id) => apiClient.delete("/projects/" + id),
      updateProject: (project) => apiClient.put("/projects/" + project.id, project),
    };
  }

  tasks() {
    return {
      getTasks: (projectId) => apiClient.get(`/projects/${projectId}/tasks`),
      getTask: (id) => apiClient.get("/tasks/" + id),
      addTask: (projectId, task) => apiClient.post(`/projects/${projectId}/tasks`, task),
      removeTask: (id) => apiClient.delete("/tasks/" + id),
      updateTask: (task) => apiClient.put("/tasks/" + task.id, task),
      updateTaskPriority: (id, priority) => apiClient.patch(`/tasks/${id}/priority`, { priority }),
      updateTaskStatus: (id, status) => apiClient.patch(`/tasks/${id}/status`, { status }),
    };
  }

  reports() {
    return {
      getProjectReport: (projectId) => apiClient.get(`/reports/projects/${projectId}`),
      getUserReport: (userId) => apiClient.get(`/reports/users/${userId}`),
    };
  }

  auth() {
    return {
      register: (userData) => apiClient.post("/auth/register", userData),
      login: (credentials) => apiClient.post("/auth/login", { email: credentials.email, password: credentials.password }),
    };
  }

  users() {
    return {
      getUsers: () => apiClient.get("/users"),
    };
  }

}

export function setAuthToken(token) {
  apiClient.defaults.headers.common['Token'] = token;
}