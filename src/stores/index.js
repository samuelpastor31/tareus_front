import { defineStore } from "pinia";
import ApiClient from "../services/api";
import { setAuthToken } from "../services/api";

const apiClient = new ApiClient();

export const useDataStore = defineStore("data", {
  state: () => ({
    projects: [],
    tasks: [],
    users: [],
    currentProject: null,
    userReport: null,
    projectReport: null,
    cards: [],
    loggedIn: localStorage.getItem("loggedIn") === "true",
  }),
  actions: {
    //only projects from the user token
    async fetchProjects() {
      try {
        const response = await apiClient.projects().getProjects();
        this.projects = response.data;
        return this.projects;
      } catch (error) {
        console.error("Error fetching projects:", error);
        return [];
      }
    },

    async fetchProject(projectId) {
      try {
        const response = await apiClient.projects().getProject(projectId);
        this.currentProject = response.data;
        return this.currentProject;
      } catch (error) {
        console.error("Error fetching project:", error);
        return null;
      }
    },

    async fetchProjectUsers(projectId) {
      try {
        const response = await apiClient.getProjectUsers(projectId);
        this.users = response.data;
        return this.users;
      } catch (error) {
        console.error("Error fetching project users:", error);
        return [];
      }
    },

    async fetchProjectReport(projectId) {
      try {
        const response = await apiClient.getProjectReport(projectId);
        this.projectReport = response.data;
        return this.projectReport;
      } catch (error) {
        console.error("Error fetching project report:", error);
        return null;
      }
    },

    async fetchUserReport(userId) {
      try {
        const response = await apiClient.getUserReport(userId);
        this.userReport = response.data;
        return this.userReport;
      } catch (error) {
        console.error("Error fetching user report:", error);
        return null;
      }
    },

    async fetchTasks(projectId) {
      try {
        const response = await apiClient.tasks().getTasks(projectId);
        if (Array.isArray(response.data)) {
          this.tasks = response.data;
        } else if (Array.isArray(response.data.tasks)) {
          this.tasks = response.data.tasks;
        } else {
          this.tasks = [];
        }
        return this.tasks;
      } catch (error) {
        console.error("Error fetching tasks:", error);
        return [];
      }
    },

    async fetchCards(projectId) {
      try {
        const response = await apiClient.cards().getProjectCards(projectId);
        if (Array.isArray(response.data)) {
          this.cards = response.data;
        } else if (Array.isArray(response.data.cards)) {
          this.cards = response.data.cards;
        } else {
          this.cards = [];
        }
        return this.cards;
      } catch (error) {
        console.error("Error fetching cards:", error);
        return [];
      }
    },

    async createCard(projectId, cardData) {
      try {
        const response = await apiClient.cards().createCard(projectId, cardData);
        this.cards.push(response.data);
        return response.data;
      } catch (error) {
        console.error("Error creating card:", error);
        return null;
      }
    },

    async createProject(projectData) {
      try {
        const response = await apiClient.projects().addProject(projectData);
        this.projects.push(response.data);
        return response.data;
      } catch (error) {
        console.error("Error creating project:", error);
        return null;
      }
    },

    async updateProject(projectData) {
      try {
        const response = await apiClient.projects().updateProject(projectData);
        const index = this.projects.findIndex((project) => project.id === projectData.id);
        if (index !== -1) this.projects[index] = response.data;
        return response.data;
      } catch (error) {
        console.error("Error updating project:", error);
        return null;
      }
    },

    async deleteProject(projectId) {
      try {
        await apiClient.projects().removeProject(projectId);
        this.projects = this.projects.filter((project) => project.id !== projectId);
        return true;
      } catch (error) {
        console.error("Error deleting project:", error);
        return false;
      }
    },

    async createTask(projectId, taskData) {
      try {
        const response = await apiClient.tasks().addTask(projectId, taskData);
        await this.fetchTasks(projectId);
        return response.data;
      } catch (error) {
        console.error("Error creating task:", error);
        return null;
      }
    },

    async updateTask(taskData) {
      try {
        const response = await apiClient.tasks().updateTask(taskData);
        const index = this.tasks.findIndex((task) => task.id === taskData.id);
        if (index !== -1) this.tasks[index] = response.data;
        return response.data;
      } catch (error) {
        console.error("Error updating task:", error);
        return null;
      }
    },

    async deleteTask(taskId) {
      try {
        await apiClient.tasks().removeTask(taskId);
        this.tasks = this.tasks.filter((task) => task.id !== taskId);
        return true;
      } catch (error) {
        console.error("Error deleting task:", error);
        return false;
      }
    },

    async updateTaskPriority(taskId, priority) {
      try {
        const response = await apiClient.tasks().updateTaskPriority(taskId, priority);
        const index = this.tasks.findIndex((task) => task.id === taskId);
        if (index !== -1) this.tasks[index] = response.data;
        return response.data;
      } catch (error) {
        console.error("Error updating task priority:", error);
        return null;
      }
    },

    async updateTaskStatus(taskId, status) {
      try {
        const response = await apiClient.tasks().updateTaskStatus(taskId, status);
        const index = this.tasks.findIndex((task) => task.id === taskId);
        if (index !== -1) this.tasks[index] = response.data;
        return response.data;
      } catch (error) {
        console.error("Error updating task status:", error);
        return null;
      }
    },

    async registerUser(userData) {
      try {
        const response = await apiClient.auth().register(userData);
        return response.data;
      } catch (error) {
        console.error("Error registering user:", error);
        throw error;
      }
    },

    async loginUser(credentials) {
      try {
        const response = await apiClient.auth().login(credentials);
        const token = response.data.token;
        const userId = response.data.userId;
        if (token) {
          localStorage.setItem("token", token);
          localStorage.setItem("loggedIn", "true");
          if (userId) {
            localStorage.setItem("user_id", userId);
          }
          setAuthToken(token);
          this.loggedIn = true;
        }
        return response.data;
      } catch (error) {
        console.error("Error logging in user:", error);
        this.loggedIn = false;
        return null;
      }
    },

    logout() {
      localStorage.removeItem("token");
      localStorage.setItem("loggedIn", "false");
      setAuthToken(null);
      this.loggedIn = false;
    },

    async fetchUsers() {
      try {
        const response = await apiClient.users().getUsers();
        this.users = response.data;
        return this.users;
      } catch (error) {
        console.error("Error fetching users:", error);
        return [];
      }
    },

    async fetchCard(cardId) {
      try {
        const response = await apiClient.cards().getCard(cardId);
        return response.data;
      } catch (error) {
        console.error("Error fetching card:", error);
        return null;
      }
    },

    async updateCard(cardData) {
      try {
        const response = await apiClient.cards().updateCard(cardData);
        return response.data.card;
      } catch (error) {
        console.error("Error updating card:", error);
        return null;
      }
    },

    async deleteCard(cardId) {
      try {
        await apiClient.cards().deleteCard(cardId);
        this.cards = this.cards.filter(card => card.id !== cardId);
        return true;
      } catch (error) {
        console.error("Error deleting card:", error);
        return false;
      }
    },

    async assignTaskToCard(cardId, taskId) {
      try {
        const response = await apiClient.cards().assignTask(cardId, taskId);
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
          this.tasks[taskIndex] = response.data.task;
        }
        return response.data.task;
      } catch (error) {
        console.error("Error assigning task to card:", error);
        return null;
      }
    },

    async removeTaskFromCard(cardId, taskId) {
      try {
        const response = await apiClient.cards().removeTask(cardId, taskId);
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
          this.tasks[taskIndex] = response.data.task;
        }
        return response.data.task;
      } catch (error) {
        console.error("Error removing task from card:", error);
        return null;
      }
    },
    
    async updateTaskCard(taskId, cardId) {
      try {
        const response = await apiClient.tasks().updateTaskCard(taskId, cardId);
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
          this.tasks[taskIndex] = response.data;
        }
        return response.data;
      } catch (error) {
        console.error("Error updating task's card:", error);
        return null;
      }
    },
  },
});
