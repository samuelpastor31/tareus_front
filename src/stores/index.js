import { defineStore } from "pinia";
import ApiClient, { clearAuthToken } from "../services/api";
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

    async fetchProjectUsers(projectId) {
      try {
        const response = await apiClient.projects().getProjectUsers(projectId);
        return response.data;
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
        const response = await apiClient
          .cards()
          .createCard(projectId, cardData);
        this.cards.push(response.data);
        return response.data;
      } catch (error) {
        console.error("Error creating card:", error);
        return null;
      }
    },

    async createProject(projectData) {
      try {
        // First create the project
        const response = await apiClient.projects().addProject({
          name: projectData.name,
          description: projectData.description
        });
        
        const newProject = response.data;

        // If users are provided, assign them to the project
        if (projectData.users && projectData.users.length > 0) {
          for (const userAssignment of projectData.users) {
            try {
              await apiClient.projects().assignUserToProject(
                newProject.id,
                userAssignment.userId,
                userAssignment.permissions
              );
            } catch (userError) {
              console.error(`Error assigning user ${userAssignment.userId}:`, userError);
              // Continue with other users even if one fails
            }
          }
        }

        this.projects.push(newProject);
        return newProject;
      } catch (error) {
        console.error("Error creating project:", error);
        throw error;
      }
    },

    async updateProject(projectData) {
      try {
        const response = await apiClient.projects().updateProject(projectData);
        const index = this.projects.findIndex(
          (project) => project.id === projectData.id
        );
        if (index !== -1) this.projects[index] = response.data;
        return response.data;
      } catch (error) {
        console.error("Error updating project:", error);
        return null;
      }
    },    async deleteProject(projectId) {
      try {
        await apiClient.projects().removeProject(projectId);
        
        // Filter out the deleted project using strict comparison
        this.projects = this.projects.filter((project) => {
          return String(project.id) !== String(projectId);
        });
        
        return true;
      } catch (error) {
        console.error("Error deleting project:", error);
        return false;
      }
    },

    
    async createTask(projectId, taskData) {
      try {
        const response = await apiClient.tasks().addTask(projectId, taskData);
        const newTask = response.data;
        
        // Add the new task to local state instead of refetching all tasks
        this.tasks.push(newTask);
        
        // If the task is assigned to a card, update the card's tasks in local state
        if (newTask.card_id) {
          const cardIndex = this.cards.findIndex(card => card.id === newTask.card_id);
          if (cardIndex !== -1) {
            if (!this.cards[cardIndex].Tasks) {
              this.cards[cardIndex].Tasks = [];
            }
            this.cards[cardIndex].Tasks.push(newTask);
          }
        }
        
        return newTask;
      } catch (error) {
        console.error("Error creating task:", error);
        throw error;
      }
    },

    
    async updateTask(taskData) {
      try {
        const response = await apiClient.tasks().updateTask(taskData);
        const updatedTask = response.data;
        
        // Update task in local state
        const taskIndex = this.tasks.findIndex((task) => task.id === taskData.id);
        if (taskIndex !== -1) {
          this.tasks[taskIndex] = updatedTask;
        }
        
        // Update task in cards state as well
        this.cards.forEach(card => {
          if (card.Tasks) {
            const cardTaskIndex = card.Tasks.findIndex(task => task.id === taskData.id);
            if (cardTaskIndex !== -1) {
              card.Tasks[cardTaskIndex] = updatedTask;
            }
          }
        });
        
        return updatedTask;
      } catch (error) {
        console.error("Error updating task:", error);
        throw error;
      }
    },

    
    async deleteTask(taskId) {
      try {
        await apiClient.tasks().removeTask(taskId);
        
        // Remove task from tasks state
        this.tasks = this.tasks.filter((task) => task.id !== taskId);
        
        // Remove task from cards state as well
        this.cards.forEach(card => {
          if (card.Tasks) {
            card.Tasks = card.Tasks.filter(task => task.id !== taskId);
          }
        });
        
        return true;
      } catch (error) {
        console.error("Error deleting task:", error);
        return false;
      }
    },

    async updateTaskPriority(taskId, priority) {
      try {
        const response = await apiClient
          .tasks()
          .updateTaskPriority(taskId, priority);
        const updatedTask = response.data;
        
        // Update task in local state
        const taskIndex = this.tasks.findIndex((task) => task.id === taskId);
        if (taskIndex !== -1) {
          this.tasks[taskIndex] = updatedTask;
        }
        
        // Update task in cards state as well
        this.cards.forEach(card => {
          if (card.Tasks) {
            const cardTaskIndex = card.Tasks.findIndex(task => task.id === taskId);
            if (cardTaskIndex !== -1) {
              card.Tasks[cardTaskIndex] = updatedTask;
            }
          }
        });
        
        return updatedTask;
      } catch (error) {
        console.error("Error updating task priority:", error);
        return null;
      }
    },

    
    async updateTaskStatus(taskId, status) {
      try {
        const response = await apiClient
          .tasks()
          .updateTaskStatus(taskId, status);
        const updatedTask = response.data;
        
        // Update task in local state
        const taskIndex = this.tasks.findIndex((task) => task.id === taskId);
        if (taskIndex !== -1) {
          this.tasks[taskIndex] = updatedTask;
        }
        
        // Update task in cards state as well
        this.cards.forEach(card => {
          if (card.Tasks) {
            const cardTaskIndex = card.Tasks.findIndex(task => task.id === taskId);
            if (cardTaskIndex !== -1) {
              card.Tasks[cardTaskIndex] = updatedTask;
            }
          }
        });
        
        return updatedTask;
      } catch (error) {
        console.error("Error updating task status:", error);
        return null;
      }
    },

    async updateTaskAssignedUser(taskId, assignedUserId) {
      try {
        const response = await apiClient
          .tasks()
          .updateTask({ id: taskId, assigned_user_id: assignedUserId });
        const updatedTask = response.data;
        
        // Update task in local state
        const taskIndex = this.tasks.findIndex((task) => task.id === taskId);
        if (taskIndex !== -1) {
          this.tasks[taskIndex] = updatedTask;
        }
        
        // Update task in cards state as well
        this.cards.forEach(card => {
          if (card.Tasks) {
            const cardTaskIndex = card.Tasks.findIndex(task => task.id === taskId);
            if (cardTaskIndex !== -1) {
              card.Tasks[cardTaskIndex] = updatedTask;
            }
          }
        });
        
        return updatedTask;
      } catch (error) {
        console.error("Error updating task assigned user:", error);
        throw error; // Propagate the error so the component can handle it
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
      clearAuthToken();
      this.loggedIn = false;
      // Clear any cached data
      this.projects = [];
      this.tasks = [];
      this.cards = [];
      this.currentProject = null;
      this.users = [];
      this.userReport = null;
      this.projectReport = null;
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
        const updatedCard = response.data.card;
        
        // Update card in local state
        const cardIndex = this.cards.findIndex((card) => card.id === cardData.id);
        if (cardIndex !== -1) {
          // Preserve the Tasks array when updating the card
          this.cards[cardIndex] = { ...updatedCard, Tasks: this.cards[cardIndex].Tasks || [] };
        }
        
        return updatedCard;
      } catch (error) {
        console.error("Error updating card:", error);
        return null;
      }
    },

    async deleteCard(cardId) {
      try {
        await apiClient.cards().deleteCard(cardId);
        this.cards = this.cards.filter((card) => card.id !== cardId);
        return true;
      } catch (error) {
        console.error("Error deleting card:", error);
        return false;
      }
    },

    // Method to reorder cards locally
    reorderCards(fromIndex, toIndex) {
      if (fromIndex === toIndex) return;
      
      const updated = [...this.cards];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      this.cards = updated;
    },

    // Method to reorder tasks locally
    reorderTasks(fromIndex, toIndex) {
      if (fromIndex === toIndex) return;
      
      const updated = [...this.tasks];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      this.tasks = updated;
    },async assignTaskToCard(cardId, taskId) {
      try {
        const response = await apiClient.cards().assignTask(cardId, taskId);
        const updatedTask = response.data.task;
        
        // Update task in local state
        const taskIndex = this.tasks.findIndex((task) => task.id === taskId);
        if (taskIndex !== -1) {
          const oldCardId = this.tasks[taskIndex].card_id;
          this.tasks[taskIndex] = updatedTask;
          
          // Remove task from old card's tasks array
          if (oldCardId) {
            const oldCardIndex = this.cards.findIndex(card => card.id === oldCardId);
            if (oldCardIndex !== -1 && this.cards[oldCardIndex].Tasks) {
              this.cards[oldCardIndex].Tasks = this.cards[oldCardIndex].Tasks.filter(
                task => task.id !== taskId
              );
            }
          }
          
          // Add task to new card's tasks array
          const cardIndex = this.cards.findIndex(card => card.id === cardId);
          if (cardIndex !== -1) {
            if (!this.cards[cardIndex].Tasks) {
              this.cards[cardIndex].Tasks = [];
            }
            this.cards[cardIndex].Tasks.push(updatedTask);
          }
        }
        
        return updatedTask;
      } catch (error) {
        console.error("Error assigning task to card:", error);
        return null;
      }
    },

    async removeTaskFromCard(cardId, taskId) {
      try {
        const response = await apiClient.cards().removeTask(cardId, taskId);
        const updatedTask = response.data.task;
        
        // Update task in local state
        const taskIndex = this.tasks.findIndex((task) => task.id === taskId);
        if (taskIndex !== -1) {
          this.tasks[taskIndex] = updatedTask;
        }
        
        // Remove task from card's tasks array
        const cardIndex = this.cards.findIndex(card => card.id === cardId);
        if (cardIndex !== -1 && this.cards[cardIndex].Tasks) {
          this.cards[cardIndex].Tasks = this.cards[cardIndex].Tasks.filter(
            task => task.id !== taskId
          );
        }
        
        return updatedTask;
      } catch (error) {
        console.error("Error removing task from card:", error);
        return null;
      }
    },

    async updateTaskCard(taskId, cardId) {
      try {
        const response = await apiClient.tasks().updateTaskCard(taskId, cardId);
        const updatedTask = response.data;
        
        // Update task in tasks state
        const taskIndex = this.tasks.findIndex((task) => task.id === taskId);
        if (taskIndex !== -1) {
          const oldCardId = this.tasks[taskIndex].card_id;
          this.tasks[taskIndex] = updatedTask;
          
          // Remove task from old card's tasks array
          if (oldCardId) {
            const oldCardIndex = this.cards.findIndex(card => card.id === oldCardId);
            if (oldCardIndex !== -1 && this.cards[oldCardIndex].Tasks) {
              this.cards[oldCardIndex].Tasks = this.cards[oldCardIndex].Tasks.filter(
                task => task.id !== taskId
              );
            }
          }
          
          // Add task to new card's tasks array
          if (cardId) {
            const newCardIndex = this.cards.findIndex(card => card.id === cardId);
            if (newCardIndex !== -1) {
              if (!this.cards[newCardIndex].Tasks) {
                this.cards[newCardIndex].Tasks = [];
              }
              this.cards[newCardIndex].Tasks.push(updatedTask);
            }
          }
        }
        
        return updatedTask;
      } catch (error) {
        console.error("Error updating task's card:", error);
        throw error;
      }
    },

    async fetchTaskComments(taskId) {
      try {
        const response = await apiClient.comments().getTaskComments(taskId);
        return response.data || [];
      } catch (error) {
        console.error("Error fetching task comments:", error);
        return [];
      }
    },

    async addComment(taskId, content) {
      try {
        const response = await apiClient.comments().addComment(taskId, content);
        return response.data;
      } catch (error) {
        console.error("Error adding comment:", error);
        throw error;
      }
    },

    async updateComment(commentId, content) {
      try {
        const response = await apiClient
          .comments()
          .updateComment(commentId, content);
        return response.data;
      } catch (error) {
        console.error("Error updating comment:", error);
        throw error;
      }
    },

    async deleteComment(commentId) {
      try {
        await apiClient.comments().deleteComment(commentId);
        return true;
      } catch (error) {
        console.error("Error deleting comment:", error);
        throw error;
      }
    },

    // User-Project management methods
    async assignUserToProject(projectId, userId, permissions) {
      try {
        const response = await apiClient.projects().assignUserToProject(projectId, userId, permissions);
        return response.data;
      } catch (error) {
        console.error("Error assigning user to project:", error);
        throw error;
      }
    },

    async updateUserPermissions(projectId, userId, permissions) {
      try {
        const response = await apiClient.projects().updateUserPermissions(projectId, userId, permissions);
        return response.data;
      } catch (error) {
        console.error("Error updating user permissions:", error);
        throw error;
      }
    },

    async removeUserFromProject(projectId, userId) {
      try {
        const response = await apiClient.projects().removeUserFromProject(projectId, userId);
        return response.data;
      } catch (error) {
        console.error("Error removing user from project:", error);
        throw error;
      }
    },
  },
});
