import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api", // proxy in vite.config.js
  withCredentials: false,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Add request interceptor to add the token to each request
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Token = token;
  }
  return config;
}, error => {
  return Promise.reject(error);
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

  cards() {
    return {
      getProjectCards: (projectId) => apiClient.get(`/projects/${projectId}/cards`),
      createCard: (projectId, card) => apiClient.post(`/projects/${projectId}/cards`, card),
      getCard: (id) => apiClient.get(`/cards/${id}`),
      updateCard: (card) => apiClient.put(`/cards/${card.id}`, card),
      deleteCard: (id) => apiClient.delete(`/cards/${id}`),
      assignTask: (cardId, taskId) => apiClient.post(`/cards/${cardId}/tasks/${taskId}`),
      removeTask: (cardId, taskId) => apiClient.delete(`/cards/${cardId}/tasks/${taskId}`),
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
      updateTaskCard: (id, cardId) => apiClient.patch(`/tasks/${id}/card`, { card_id: cardId }),
    };
  }

  comments() {
    return {
      getTaskComments: (taskId) => apiClient.get(`/tasks/${taskId}/comments`),
      addComment: (taskId, content) => apiClient.post(`/tasks/${taskId}/comments`, { content }),
      updateComment: (commentId, content) => apiClient.put(`/comments/${commentId}`, { content }),
      deleteComment: (commentId) => apiClient.delete(`/comments/${commentId}`),
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
  localStorage.setItem('token', token);
  apiClient.defaults.headers.common['Token'] = token;
}

export function clearAuthToken() {
  localStorage.removeItem('token');
  delete apiClient.defaults.headers.common['Token'];
}