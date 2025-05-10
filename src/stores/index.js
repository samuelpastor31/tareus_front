import { defineStore } from 'pinia';
import ApiClient from '../services/api';
import { setAuthToken } from '../services/api';

const apiClient = new ApiClient();

export const useDataStore = defineStore('data', {
  state: () => ({
    projects: [],
    tasks: [],
    users: [],
    currentProject: null,
    userReport: null,
    projectReport: null,
    loggedIn: localStorage.getItem('loggedIn') === 'true', // <-- add this
  }),
  actions: {
    async fetchProjects() {
      try {
        const response = await apiClient.projects().getProjects();
        this.projects = response.data;
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    },

    async fetchProject(projectId) {
      try {
        const response = await apiClient.projects().getProject(projectId);
        this.currentProject = response.data;
      } catch (error) {
        console.error('Error fetching project:', error);
      }
    },

    async fetchProjectUsers(projectId) {
      try {
        const response = await apiClient.getProjectUsers(projectId);
        this.users = response.data;
      } catch (error) {
        console.error('Error fetching project users:', error);
      }
    },

    async fetchProjectReport(projectId) {
      try {
        const response = await apiClient.getProjectReport(projectId);
        this.projectReport = response.data;
      } catch (error) {
        console.error('Error fetching project report:', error);
      }
    },

    async fetchUserReport(userId) {
      try {
        const response = await apiClient.getUserReport(userId);
        this.userReport = response.data;
      } catch (error) {
        console.error('Error fetching user report:', error);
      }
    },

    async fetchTasks(projectId) {
      try {
        const response = await apiClient.tasks().getTasks(projectId);
        this.tasks = response.data;
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    },

    async createProject(projectData) {
      try {
        const response = await apiClient.projects().addProject(projectData);
        this.projects.push(response.data);
      } catch (error) {
        console.error('Error creating project:', error);
      }
    },

    async updateProject(projectData) {
      try {
        const response = await apiClient.projects().updateProject(projectData);
        const index = this.projects.findIndex(project => project.id === projectData.id);
        if (index !== -1) this.projects[index] = response.data;
      } catch (error) {
        console.error('Error updating project:', error);
      }
    },

    async deleteProject(projectId) {
      try {
        await apiClient.projects().removeProject(projectId);
        this.projects = this.projects.filter(project => project.id !== projectId);
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    },

    async createTask(projectId, taskData) {
      try {
        const response = await apiClient.tasks().addTask(projectId, taskData);
        this.tasks.push(response.data);
      } catch (error) {
        console.error('Error creating task:', error);
      }
    },

    async updateTask(taskData) {
      try {
        const response = await apiClient.tasks().updateTask(taskData);
        const index = this.tasks.findIndex(task => task.id === taskData.id);
        if (index !== -1) this.tasks[index] = response.data;
      } catch (error) {
        console.error('Error updating task:', error);
      }
    },

    async deleteTask(taskId) {
      try {
        await apiClient.tasks().removeTask(taskId);
        this.tasks = this.tasks.filter(task => task.id !== taskId);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    },

    async updateTaskPriority(taskId, priority) {
      try {
        const response = await apiClient.tasks().updateTaskPriority(taskId, priority);
        const index = this.tasks.findIndex(task => task.id === taskId);
        if (index !== -1) this.tasks[index] = response.data;
      } catch (error) {
        console.error('Error updating task priority:', error);
      }
    },

    async updateTaskStatus(taskId, status) {
      try {
        const response = await apiClient.tasks().updateTaskStatus(taskId, status);
        const index = this.tasks.findIndex(task => task.id === taskId);
        if (index !== -1) this.tasks[index] = response.data;
      } catch (error) {
        console.error('Error updating task status:', error);
      }
    },

    async registerUser(userData) {
      try {
        const response = await apiClient.auth().register(userData);
        return response.data;
      } catch (error) {
        console.error('Error registering user:', error);
        throw error;
      }
    },
    

    async loginUser(credentials) {
      try {
        console.log('Logging in user with credentials:', credentials);
        const response = await apiClient.auth().login(credentials);
        console.log('Login response:', response.data);
        const token = response.data.token;
        if (token) {
          localStorage.setItem('token', token);
          localStorage.setItem('loggedIn', 'true');
          setAuthToken(token);
          this.loggedIn = true;
        }
        return response.data; 
      } catch (error) {
        console.error('Error logging in user:', error);
        this.loggedIn = false;
        return null;
      }
    },

    logout() {
      localStorage.removeItem('token');
      localStorage.setItem('loggedIn', 'false');
      setAuthToken(null);
      this.loggedIn = false;
    },

    async fetchUsers() {
      try {
        const response = await apiClient.users().getUsers();
        console.log('Fetched users:', response.data);
        this.users = response.data;
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    },
  },
});